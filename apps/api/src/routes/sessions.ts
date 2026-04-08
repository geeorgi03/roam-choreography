import { Hono } from 'hono';
import { createRequire } from 'module';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkSessionLimit } from '../lib/planGate.js';
import type { Session, MusicTrack, Clip, Moment, FormationData, QualityData, Loop } from '@roam/types';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

const GROUP_COLOR_PALETTE = ['#e67c5c', '#4a90e2', '#8a6ee8', '#3ba287', '#f2b233', '#d35d9e'];

const app = new Hono<{ Variables: { userId: string; userEmail: string | null } }>()
  .use('*', requireAuth);

async function hasSessionAccess(sessionId: string, userId: string): Promise<boolean> {
  const { data: ownedSession, error: ownedError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownedError) return false;
  if (ownedSession) return true;

  const { data: participant, error: participantError } = await supabase
    .from('group_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (participantError) return false;
  return Boolean(participant);
}

type MomentsSessionAccessResult =
  | { status: 200 }
  | { status: 403; error: 'Forbidden' }
  | { status: 404; error: 'Not found' }
  | { status: 500; error: string };

type MomentsAccessCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'forbidden' }
  | { allowed: false; reason: 'error'; error: string; errorCode?: string };

/**
 * Moments routes must distinguish:
 * - 404: session does not exist
 * - 403: session exists, but caller has no access
 */
async function hasMomentsSessionAccess(
  sessionId: string,
  userId: string,
  sessionUserId: string
): Promise<MomentsAccessCheckResult> {
  // Owner check using the already-fetched session row; no extra query required.
  if (sessionUserId === userId) return { allowed: true };

  // Participant check must not swallow Supabase/query errors.
  const { data: participant, error: participantError } = await supabase
    .from('group_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (participantError) {
    return {
      allowed: false,
      reason: 'error',
      error: participantError.message,
      errorCode: (participantError as { code?: string }).code,
    };
  }
  if (participant) return { allowed: true };
  return { allowed: false, reason: 'forbidden' };
}

function isInvalidUuidCastError(error: unknown): boolean {
  // Postgres uses SQLSTATE `22P02` for "invalid input syntax" (including invalid UUID casts).
  const e = error as { code?: string; message?: string } | null | undefined;
  const code = e?.code;
  if (code === '22P02') return true;

  const msg = (e?.message ?? '').toLowerCase();
  return (
    msg.includes('invalid input syntax') &&
    msg.includes('uuid')
  );
}

async function assertMomentsSessionAccess(
  sessionId: string,
  userId: string
): Promise<MomentsSessionAccessResult> {
  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    if (isInvalidUuidCastError(sessionError)) return { status: 404, error: 'Not found' };
    return { status: 500, error: sessionError.message };
  }
  if (!sessionRow) return { status: 404, error: 'Not found' };

  const accessCheck = await hasMomentsSessionAccess(sessionId, userId, sessionRow.user_id as string);
  if (accessCheck.allowed) return { status: 200 };
  if (accessCheck.reason === 'forbidden') return { status: 403, error: 'Forbidden' };
  if (accessCheck.reason === 'error' && isInvalidUuidCastError({ code: accessCheck.errorCode, message: accessCheck.error })) {
    return { status: 404, error: 'Not found' };
  }
  return { status: 500, error: accessCheck.error };
}

async function safeReqJson<T>(
  c: { req: { json: <U>() => Promise<U> } } | any
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    // Avoid passing type arguments to potentially `any`-typed request helpers.
    const data = await c.req.json();
    return { ok: true, data: data as T };
  } catch {
    return { ok: false };
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  // Supabase/PostgREST surfaces Postgres error codes (e.g. 23505) for constraint violations.
  const e = error as { code?: string; message?: string } | null | undefined;
  if (!e) return false;
  if (e.code === '23505') return true;
  const msg = (e.message ?? '').toLowerCase();
  return (
    msg.includes('duplicate key value') ||
    msg.includes('unique constraint') ||
    msg.includes('violates unique')
  );
}

async function hasValidSessionShareToken(sessionId: string, token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) return false;

  const { data, error } = await supabase
    .from('share_tokens')
    .select('token')
    .eq('token', trimmed)
    .eq('session_id', sessionId)
    .is('clip_id', null)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.token);
}

/** GET /sessions — list sessions for the authenticated user */
app.get('/', async (c) => {
  const userId = c.get('userId');
  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, name, phrase, created_at, updated_at, clips(count), section_clips(count)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const sessionIds = (data ?? []).map((row) => (row as { id: string }).id);
  const sectionCountBySessionId = new Map<string, number>();

  if (sessionIds.length > 0) {
    const { data: sectionRows, error: sectionError } = await supabase
      .from('section_clips')
      .select('session_id, section_label')
      .in('session_id', sessionIds);

    if (sectionError) {
      return c.json({ error: sectionError.message }, 500);
    }

    const sectionLabelsBySessionId = new Map<string, Set<string>>();
    for (const row of sectionRows ?? []) {
      const typed = row as { session_id?: string | null; section_label?: string | null };
      if (!typed.session_id || !typed.section_label) continue;
      if (!sectionLabelsBySessionId.has(typed.session_id)) {
        sectionLabelsBySessionId.set(typed.session_id, new Set<string>());
      }
      sectionLabelsBySessionId.get(typed.session_id)!.add(typed.section_label);
    }

    for (const [sessionId, labels] of sectionLabelsBySessionId.entries()) {
      sectionCountBySessionId.set(sessionId, labels.size);
    }
  }

  const sessions = (data ?? []).map((row) => {
    const typedRow = row as Session & {
      clips?: Array<{ count?: number | null }> | null;
      section_clips?: Array<{ count?: number | null }> | null;
    };
    const { clips, section_clips, ...sessionFields } = typedRow;

    return {
      ...sessionFields,
      clip_count: clips?.[0]?.count ?? 0,
      section_count: sectionCountBySessionId.get(typedRow.id) ?? 0,
    } as Session;
  });

  return c.json({ sessions: sessions as Session[] });
});

/** POST /sessions — create a session */
app.post('/', checkSessionLimit, async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');

  const parsedBody = await safeReqJson<{ name?: unknown; music_url?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const rawBody = parsedBody.data;

  const name =
    typeof rawBody?.name === 'string' ? rawBody.name.trim() || 'Untitled Session' : 'Untitled Session';

  let musicUrl: string | null = null;
  if (rawBody?.music_url !== undefined) {
    if (typeof rawBody.music_url !== 'string') {
      return c.json({ error: 'music_url must be a string URL when provided' }, 400);
    }
    const candidate = rawBody.music_url.trim();
    if (!candidate) {
      return c.json({ error: 'music_url must be a non-empty string when provided' }, 400);
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return c.json({ error: 'music_url must use http or https scheme' }, 400);
      }
      musicUrl = parsed.toString();
    } catch {
      return c.json({ error: 'music_url must be a valid URL' }, 400);
    }
  }

  // Ensure public.users exists for this auth user (prevents FK failures when migrations/triggers weren't applied).
  // users.email is NOT NULL, so if we don't have it, fail loudly instead of inserting an invalid row.
  if (!userEmail) {
    return c.json({ error: 'User email missing; cannot create profile row' }, 500);
  }
  const { error: userUpsertError } = await supabase
    .from('users')
    .upsert({ id: userId, email: userEmail, plan: 'free' }, { onConflict: 'id' });
  if (userUpsertError) {
    return c.json({ error: userUpsertError.message }, 500);
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: userId, name })
    .select('id, user_id, name, phrase, created_at')
    .single();

  if (sessionError) {
    return c.json({ error: sessionError.message }, 500);
  }

  if (musicUrl) {
    const musicTrackId = crypto.randomUUID();

    const { error: musicError } = await supabase
      .from('music_tracks')
      .insert({
        id: musicTrackId,
        session_id: sessionRow.id,
        source_type: 'youtube',
        source_url: musicUrl,
        storage_path: null,
        analysis_status: 'complete',
      });

    if (musicError) {
      return c.json({ error: musicError.message }, 500);
    }
  }

  return c.json(sessionRow as Session, 201);
});

/** GET /sessions/:id — get one session with music_track and clips (must belong to user) */
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const allowed = await hasSessionAccess(id, userId);
  if (!allowed) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('sessions')
    .select('*, music_tracks(*), clips(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }

  const { music_tracks, clips, ...sessionFields } = data as Session & {
    music_tracks: MusicTrack[];
    clips: Clip[];
  };
  (clips as Clip[]).sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const session = sessionFields as Session;
  const music_track: MusicTrack | null =
    (Array.isArray(music_tracks) && music_tracks.length > 0
      ? (music_tracks as MusicTrack[])[0]
      : null) ?? null;

  return c.json({ session, music_track, clips: clips as Clip[] });
});

/** PATCH /sessions/:id — update session name and/or phrase (owner only) */
app.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const parsedBody = await safeReqJson<{ name?: unknown; phrase?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return c.json({ error: 'name must be a non-empty string' }, 400);
    }
  }

  if (body.phrase !== undefined) {
    if (typeof body.phrase !== 'string' && body.phrase !== null) {
      return c.json({ error: 'phrase must be a string or null' }, 400);
    }
  }

  if (body.name === undefined && body.phrase === undefined) {
    return c.json({ error: 'No updatable fields provided' }, 400);
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (sessionError) {
    if (isInvalidUuidCastError(sessionError)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: sessionError.message }, 500);
  }
  if (!sessionRow) return c.json({ error: 'Not found' }, 404);
  if (sessionRow.user_id !== userId) return c.json({ error: 'Forbidden' }, 403);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.phrase !== undefined) updates.phrase = body.phrase === null ? null : (body.phrase as string).trim() || null;

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select('id, user_id, name, phrase, created_at')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as Session);
});

/** PATCH /sessions/:id/quality-target — set quality target for a session */
app.patch('/:id/quality-target', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const parsed = await safeReqJson<{
    clip_url: unknown;
    timestamp_ms: unknown;
    source_clip_id: unknown;
  }>(c);
  if (!parsed.ok) return c.json({ error: 'Malformed JSON' }, 400);

  const {
    clip_url: rawClipUrl,
    timestamp_ms: rawTimestampMs,
    source_clip_id: rawSourceClipId,
  } = parsed.data;

  // Validate input
  if (
    typeof rawClipUrl !== 'string' ||
    !rawClipUrl.trim() ||
    typeof rawTimestampMs !== 'number' ||
    !isFinite(rawTimestampMs) ||
    typeof rawSourceClipId !== 'string' ||
    !rawSourceClipId.trim()
  ) {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const clip_url = rawClipUrl.trim();
  const timestamp_ms = rawTimestampMs;
  const source_clip_id = rawSourceClipId.trim();

  // Owner check
  const { data: sessionRow, error: fetchError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    if (isInvalidUuidCastError(fetchError)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: fetchError.message }, 500);
  }
  if (!sessionRow) return c.json({ error: 'Not found' }, 404);
  if (sessionRow.user_id !== userId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Update quality target
  const { data, error } = await supabase
    .from('sessions')
    .update({
      quality_target: {
        clip_url,
        timestamp_ms,
        source_clip_id,
      },
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('quality_target')
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json({ quality_target: data.quality_target });
});

/** POST /sessions/:id/join — join/upsert a group participant row */
app.post('/:id/join', async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const sessionId = c.req.param('id');
  const body = await c
    .req.json<{ share_token?: string }>()
    .catch(() => ({} as { share_token?: string }));
  const shareTokenBody =
    typeof body?.share_token === 'string' && body.share_token.trim()
      ? body.share_token.trim()
      : null;
  const shareTokenQuery = c.req.query('share_token')?.trim() || null;
  const shareTokenHeader = c.req.header('x-share-token')?.trim() || null;
  const inviteProofToken = shareTokenBody ?? shareTokenQuery ?? shareTokenHeader;

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (sessionError) return c.json({ error: sessionError.message }, 500);
  if (!sessionRow) return c.json({ error: 'Not found' }, 404);

  const { data: existingParticipant, error: existingError } = await supabase
    .from('group_participants')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) return c.json({ error: existingError.message }, 500);

  const isOwner = sessionRow.user_id === userId;
  const hasExistingMembership = Boolean(existingParticipant?.id);
  if (!isOwner && !hasExistingMembership) {
    const hasInviteProof =
      Boolean(inviteProofToken) &&
      (await hasValidSessionShareToken(sessionId, inviteProofToken as string));
    if (!hasInviteProof) {
      return c.json({ error: 'Invite proof required' }, 403);
    }
  }

  if (!userEmail) {
    return c.json({ error: 'User email missing; cannot create profile row' }, 500);
  }

  const { error: userUpsertError } = await supabase
    .from('users')
    .upsert({ id: userId, email: userEmail }, { onConflict: 'id' });
  if (userUpsertError) return c.json({ error: userUpsertError.message }, 500);

  let color = existingParticipant?.color;
  if (!color) {
    const { count, error: countError } = await supabase
      .from('group_participants')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if (countError) return c.json({ error: countError.message }, 500);
    color = GROUP_COLOR_PALETTE[(count ?? 0) % GROUP_COLOR_PALETTE.length];
  }

  const displayName = userEmail.split('@')[0]?.trim() || 'Dancer';
  const role = isOwner ? 'choreographer' : 'dancer';

  const { data: joined, error: joinError } = await supabase
    .from('group_participants')
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        display_name: displayName,
        color,
        role,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,user_id' }
    )
    .select('*')
    .single();
  if (joinError) return c.json({ error: joinError.message }, 500);

  return c.json(joined, 201);
});

/** GET /sessions/:id/dancers — list participants for a session */
app.get('/:id/dancers', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const allowed = await hasSessionAccess(sessionId, userId);
  if (!allowed) return c.json({ error: 'Forbidden' }, 403);

  const { data, error } = await supabase
    .from('group_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ dancers: data ?? [] });
});

/** PUT /sessions/:id/dancers/:dancerId/position — update own participant position */
app.put('/:id/dancers/:dancerId/position', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const dancerId = c.req.param('dancerId');
  const body = await c.req.json<{
    position_x?: number | null;
    position_y?: number | null;
    position_note?: string | null;
    last_seen_at?: string;
  }>();

  const updates: Record<string, unknown> = {
    last_seen_at: body.last_seen_at ?? new Date().toISOString(),
  };

  if (body.position_x !== undefined) updates.position_x = body.position_x;
  if (body.position_y !== undefined) updates.position_y = body.position_y;
  if (body.position_note !== undefined) updates.position_note = body.position_note;

  const { data, error } = await supabase
    .from('group_participants')
    .update(updates)
    .eq('id', dancerId)
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: 'Not found' }, 404);

  return c.json(data);
});

/** POST /sessions/:id/broadcast — create a session broadcast */
app.post('/:id/broadcast', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const body = await c.req.json<{ message?: string }>();
  const message = body?.message?.trim() ?? '';

  if (!message) return c.json({ error: 'Message is required' }, 400);
  if (message.length > 60) return c.json({ error: 'Message must be 60 characters or less' }, 400);

  const allowed = await hasSessionAccess(sessionId, userId);
  if (!allowed) return c.json({ error: 'Forbidden' }, 403);

  const { data, error } = await supabase
    .from('broadcasts')
    .insert({
      session_id: sessionId,
      sender_id: userId,
      message,
    })
    .select('*')
    .single();
  if (error) return c.json({ error: error.message }, 500);

  return c.json(data, 201);
});

/** GET /sessions/:id/broadcasts — list last 50 broadcasts (newest first) */
app.get('/:id/broadcasts', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const allowed = await hasSessionAccess(sessionId, userId);
  if (!allowed) return c.json({ error: 'Forbidden' }, 403);

  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ broadcasts: data ?? [] });
});

/** GET /sessions/:id/moments — list moments for a session */
app.get('/:id/moments', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ moments: data as Moment[] });
});

/** POST /sessions/:id/moments — create a moment in a session */
app.post('/:id/moments', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const parsedBody = await safeReqJson<{ name?: unknown; beat_position_ms?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!name) return c.json({ error: 'name must be a non-empty string' }, 400);

  const beatPositionRaw = body?.beat_position_ms;
  const INT32_MIN = -2147483648;
  const INT32_MAX = 2147483647;

  if (beatPositionRaw === undefined) {
    return c.json({ error: 'beat_position_ms is required' }, 400);
  }
  if (typeof beatPositionRaw !== 'number' || !Number.isFinite(beatPositionRaw)) {
    return c.json({ error: 'beat_position_ms must be a finite number' }, 400);
  }
  if (!Number.isInteger(beatPositionRaw)) {
    return c.json({ error: 'beat_position_ms must be an integer' }, 400);
  }
  if (beatPositionRaw < INT32_MIN || beatPositionRaw > INT32_MAX) {
    return c.json({ error: 'beat_position_ms is out of bounds' }, 400);
  }
  const beatPositionMs = beatPositionRaw;

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  // Verify DB-level uniqueness exists before relying on retry logic.
  // If the unique constraint migration hasn't been applied in this environment,
  // fall back to a single atomic operation (per-session locking) that cannot
  // produce duplicate positions under concurrent requests.
  const MAX_ATTEMPTS = 8;

  const { data: constraintExists, error: constraintCheckError } = await supabase
    .rpc('moments_session_id_position_unique_constraint_exists');

  const hasUniqueConstraint = !constraintCheckError && Boolean(constraintExists);

  if (!hasUniqueConstraint) {
    const { data: atomicData, error: atomicError } = await supabase.rpc(
      'create_moment_atomic_with_position',
      {
        p_session_id: sessionId,
        p_name: name,
        p_beat_position_ms: beatPositionMs,
      }
    );

    if (atomicError) {
      return c.json(
        {
          error:
            'Failed to create moment atomically (unique constraint missing and fallback RPC failed)',
          details: atomicError.message,
        },
        500
      );
    }

    return c.json(atomicData as Moment, 201);
  }

  // Unique constraint exists: retry read-max-then-insert on conflict.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: maxRows, error: maxError } = await supabase
      .from('moments')
      .select('position')
      .eq('session_id', sessionId)
      .order('position', { ascending: false })
      .limit(1);

    if (maxError) return c.json({ error: maxError.message }, 500);

    const maxRow = Array.isArray(maxRows) && maxRows.length > 0 ? maxRows[0] : undefined;
    const position = (maxRow?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('moments')
      .insert({
        session_id: sessionId,
        name,
        beat_position_ms: beatPositionMs,
        position,
        formation: null,
        quality: null,
      })
      .select('*')
      .single();

    if (!error && data) return c.json(data as Moment, 201);

    if (error && isUniqueConstraintViolation(error)) {
      continue; // Another client claimed this (session_id, position); try next.
    }

    if (error) return c.json({ error: error.message }, 500);
  }

  return c.json(
    {
      error: 'Failed to create moment due to concurrent position conflicts',
    },
    500
  );
});

/** PATCH /sessions/:id/moments/:momentId — update a moment name */
app.patch('/:id/moments/:momentId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const parsedBody = await safeReqJson<{ name?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!name) return c.json({ error: 'name must be a non-empty string' }, 400);

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .update({ name })
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json(data as Moment);
});

/** DELETE /sessions/:id/moments/:momentId — delete a moment */
app.delete('/:id/moments/:momentId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .delete()
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.body(null, 204);
});

/** GET /sessions/:id/moments/:momentId/formation — fetch moment formation */
app.get('/:id/moments/:momentId/formation', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .select('formation')
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json({ formation: data.formation as FormationData | null });
});

/** PUT /sessions/:id/moments/:momentId/formation — update moment formation */
app.put('/:id/moments/:momentId/formation', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const parsedBody = await safeReqJson<{ formation?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;
  if (!body || typeof body !== 'object' || !('formation' in body)) {
    return c.json({ error: 'formation is required' }, 400);
  }

  const formationInput = (body as { formation?: unknown }).formation;
  const isPlainObject =
    formationInput !== null &&
    typeof formationInput === 'object' &&
    !Array.isArray(formationInput) &&
    Object.getPrototypeOf(formationInput) === Object.prototype;

  if (formationInput !== null && !isPlainObject) {
    return c.json({ error: 'formation must be an object or null' }, 400);
  }

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .update({ formation: formationInput ?? null })
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .select('formation')
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json({ formation: data.formation as FormationData | null });
});

/** GET /sessions/:id/moments/:momentId/quality — fetch moment quality */
app.get('/:id/moments/:momentId/quality', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .select('quality')
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json({ quality: data.quality as QualityData | null });
});

/** PUT /sessions/:id/moments/:momentId/quality — update moment quality */
app.put('/:id/moments/:momentId/quality', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const momentId = c.req.param('momentId');

  const parsedBody = await safeReqJson<{ quality?: unknown }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;
  if (!body || typeof body !== 'object' || !('quality' in body)) {
    return c.json({ error: 'quality is required' }, 400);
  }

  const qualityInput = (body as { quality?: unknown }).quality;
  const isPlainObject =
    qualityInput !== null &&
    typeof qualityInput === 'object' &&
    !Array.isArray(qualityInput) &&
    Object.getPrototypeOf(qualityInput) === Object.prototype;

  if (qualityInput !== null && !isPlainObject) {
    return c.json({ error: 'quality must be an object or null' }, 400);
  }

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('moments')
    .update({ quality: qualityInput ?? null })
    .eq('id', momentId)
    .eq('session_id', sessionId)
    .select('quality')
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.json({ quality: data.quality as QualityData | null });
});

/** POST /sessions/:id/share-token — create or retrieve session share token */
app.post('/:id/share-token', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    if (isInvalidUuidCastError(sessionError)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: sessionError.message }, 500);
  }
  if (!sessionRow) return c.json({ error: 'Not found' }, 404);

  if (sessionRow.user_id !== userId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Use atomic RPC to create or get session share token
  const { data: tokenData, error } = await supabase.rpc('create_or_get_session_share_token', { 
    p_session_id: sessionId 
  });

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }

  const token = tokenData as string;
  const share_url = `roam://session/${sessionId}?share_token=${token}`;
  return c.json({ token, share_url }, 200);
});

/** GET /sessions/:id/loops — list loops for a session */
app.get('/:id/loops', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const sourceUrl = c.req.query('source_url');

  if (!sourceUrl) {
    return c.json({ error: 'source_url query parameter is required' }, 400);
  }

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('session_id', sessionId)
    .eq('source_url', sourceUrl)
    .order('created_at', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ loops: data as Loop[] });
});

/** POST /sessions/:id/loops — create a loop in a session */
app.post('/:id/loops', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');

  const parsedBody = await safeReqJson<{
    source_url?: unknown;
    start_ms?: unknown;
    end_ms?: unknown;
    color?: unknown;
    name?: unknown;
  }>(c);
  if (!parsedBody.ok) return c.json({ error: 'Malformed JSON' }, 400);
  const body = parsedBody.data;

  // Validate required fields
  if (!body.source_url || typeof body.source_url !== 'string') {
    return c.json({ error: 'source_url is required and must be a string' }, 400);
  }
  if (typeof body.start_ms !== 'number' || !Number.isFinite(body.start_ms) || !Number.isInteger(body.start_ms)) {
    return c.json({ error: 'start_ms must be a finite integer' }, 400);
  }
  if (typeof body.end_ms !== 'number' || !Number.isFinite(body.end_ms) || !Number.isInteger(body.end_ms)) {
    return c.json({ error: 'end_ms must be a finite integer' }, 400);
  }
  if (body.end_ms <= body.start_ms) {
    return c.json({ error: 'end_ms must be greater than start_ms' }, 400);
  }
  if (!body.color || typeof body.color !== 'string' || !body.color.trim()) {
    return c.json({ error: 'color is required and must be a non-empty string' }, 400);
  }
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'name is required and must be a non-empty string' }, 400);
  }

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('loops')
    .insert({
      session_id: sessionId,
      source_url: body.source_url.trim(),
      start_ms: body.start_ms,
      end_ms: body.end_ms,
      color: body.color.trim(),
      name: body.name.trim(),
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as Loop, 201);
});

/** DELETE /sessions/:id/loops/:loopId — delete a loop */
app.delete('/:id/loops/:loopId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('id');
  const loopId = c.req.param('loopId');

  const accessResult = await assertMomentsSessionAccess(sessionId, userId);
  if (accessResult.status !== 200) {
    return c.json({ error: accessResult.error }, accessResult.status);
  }

  const { data, error } = await supabase
    .from('loops')
    .delete()
    .eq('id', loopId)
    .eq('session_id', sessionId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (isInvalidUuidCastError(error)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  if (!data) return c.json({ error: 'Not found' }, 404);
  return c.body(null, 204);
});

type SectionEntry = { label: string; start_ms: number };
type NotePinRow = { id: string; session_id: string; text: string | null; timecode_ms: number | null };

function formatMmSs(timecodeMs: number | null | undefined): string {
  const clamped = Math.max(0, Math.floor((timecodeMs ?? 0) / 1000));
  const mm = Math.floor(clamped / 60);
  const ss = clamped % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function resolveSectionLabel(
  clipId: string,
  sectionByClipId: Map<string, string>,
  sectionEntries: SectionEntry[]
): string {
  const mapped = sectionByClipId.get(clipId);
  if (mapped) return mapped;
  if (sectionEntries.length > 0) return 'Unassigned';
  return 'Unassigned';
}

function sanitizePdfFilename(input: string): string {
  return input.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'session-export';
}

/** GET /sessions/:id/export/pdf — export owner session summary as PDF */
app.get('/:id/export/pdf', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const { data: sessionRow, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id, name, phrase, quality_target, created_at')
    .eq('id', id)
    .maybeSingle();

  if (sessionError) {
    if (isInvalidUuidCastError(sessionError)) return c.json({ error: 'Not found' }, 404);
    return c.json({ error: sessionError.message }, 500);
  }
  if (!sessionRow) return c.json({ error: 'Not found' }, 404);
  if (sessionRow.user_id !== userId) return c.json({ error: 'Forbidden' }, 403);

  const { data: trackRows, error: trackError } = await supabase
    .from('music_tracks')
    .select('sections')
    .eq('session_id', id)
    .limit(1);
  if (trackError) return c.json({ error: trackError.message }, 500);
  const sections = ((trackRows?.[0] as { sections?: SectionEntry[] | null } | undefined)?.sections ?? []) as SectionEntry[];

  const { data: clipRows, error: clipsError } = await supabase
    .from('clips')
    .select('id, label, clip_type, url, session_id, recorded_at')
    .eq('session_id', id)
    .order('recorded_at', { ascending: true });
  if (clipsError) return c.json({ error: clipsError.message }, 500);
  const clips = (clipRows ?? []) as Array<
    Pick<Clip, 'id' | 'label' | 'clip_type' | 'url' | 'session_id' | 'recorded_at'>
  >;

  const { data: sectionClipRows, error: sectionClipsError } = await supabase
    .from('section_clips')
    .select('clip_id, section_label')
    .eq('session_id', id);
  if (sectionClipsError) return c.json({ error: sectionClipsError.message }, 500);
  const sectionByClipId = new Map<string, string>();
  for (const row of sectionClipRows ?? []) {
    const typed = row as { clip_id?: string | null; section_label?: string | null };
    if (typed.clip_id && typed.section_label) sectionByClipId.set(typed.clip_id, typed.section_label);
  }

  const { data: noteRows, error: notesError } = await supabase
    .from('note_pins')
    .select('*')
    .eq('session_id', id)
    .order('timecode_ms', { ascending: true });
  if (notesError) return c.json({ error: notesError.message }, 500);
  const notes = (noteRows ?? []) as NotePinRow[];

  const clipsBySection = new Map<string, typeof clips>();
  for (const clip of clips) {
    const sectionLabel = resolveSectionLabel(clip.id, sectionByClipId, sections);
    if (!clipsBySection.has(sectionLabel)) clipsBySection.set(sectionLabel, []);
    clipsBySection.get(sectionLabel)!.push(clip);
  }

  const notesBySection = new Map<string, NotePinRow[]>();
  for (const note of notes) {
    const noteMs = note.timecode_ms ?? 0;
    let chosenLabel = 'Unassigned';
    if (sections.length > 0) {
      const ordered = [...sections].sort((a, b) => a.start_ms - b.start_ms);
      for (const section of ordered) {
        if (noteMs >= section.start_ms) chosenLabel = section.label;
      }
    }
    if (!notesBySection.has(chosenLabel)) notesBySection.set(chosenLabel, []);
    notesBySection.get(chosenLabel)!.push(note);
  }

  const resolvedSectionLabels: string[] = [];
  for (const section of sections) {
    if (!resolvedSectionLabels.includes(section.label)) resolvedSectionLabels.push(section.label);
  }
  for (const sectionLabel of clipsBySection.keys()) {
    if (sectionLabel === 'Unassigned') continue;
    if (!resolvedSectionLabels.includes(sectionLabel)) resolvedSectionLabels.push(sectionLabel);
  }
  if (clipsBySection.has('Unassigned') && !resolvedSectionLabels.includes('Unassigned')) {
    resolvedSectionLabels.push('Unassigned');
  }

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 57, bottom: 57, left: 57, right: 57 },
  }) as InstanceType<typeof PDFDocument>;

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    const title = sessionRow.name?.trim() || 'Session';
    const createdLabel = sessionRow.created_at
      ? new Date(sessionRow.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

    doc.fontSize(22).font('Helvetica-Bold').text(title, { align: 'left', continued: true });
    doc.fontSize(11).font('Helvetica').text(createdLabel, { align: 'right' });

    if (sessionRow.phrase) {
      doc.moveDown(0.4);
      doc.fontSize(12).font('Helvetica-Oblique').text(sessionRow.phrase);
    }

    const qualityTarget = sessionRow.quality_target as
      | { source_clip_id?: string; clip_url?: string; label?: string }
      | null;
    if (qualityTarget) {
      const fromClip = clips.find((clip) => clip.id === qualityTarget.source_clip_id)?.label?.trim();
      const qualityLabel = fromClip || qualityTarget.label || qualityTarget.clip_url || 'Set';
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(`Quality target: ${qualityLabel}`);
    }

    doc.moveDown(0.6);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

    doc.moveDown(0.8);
    doc.fontSize(14).font('Helvetica-Bold').text('SECTIONS');
    doc.moveDown(0.3);
    if (resolvedSectionLabels.length === 0) {
      doc.fontSize(11).font('Helvetica').text('- No sections');
    } else {
      for (const sectionLabel of resolvedSectionLabels) {
        const sectionClips = clipsBySection.get(sectionLabel) ?? [];
        const sectionNotes = notesBySection.get(sectionLabel) ?? [];
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`- ${sectionLabel} (${sectionClips.length} clips, ${sectionNotes.length} notes)`);
      }
    }

    doc.moveDown(0.6);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

    doc.moveDown(0.8);
    doc.fontSize(14).font('Helvetica-Bold').text('CLIPS');
    doc.moveDown(0.3);
    if (clips.length === 0) {
      doc.fontSize(11).font('Helvetica').text('- No clips');
    } else {
      for (const sectionLabel of resolvedSectionLabels) {
        const sectionClips = clipsBySection.get(sectionLabel) ?? [];
        if (sectionClips.length === 0) continue;
        doc.fontSize(12).font('Helvetica-Bold').text(sectionLabel);
        for (const clip of sectionClips) {
          const clipKind = clip.clip_type === 'REF' ? 'REF' : 'MINE';
          const label = clip.label?.trim() || 'Untitled clip';
          doc.fontSize(11).font('Helvetica').text(`- [${clipKind}] ${label}`);
          if (clip.clip_type === 'REF' && clip.url) {
            doc.fontSize(10).font('Helvetica').fillColor('#555555').text(`  ${clip.url}`);
            doc.fillColor('#000000');
          }
        }
        doc.moveDown(0.2);
      }
    }

    doc.moveDown(0.6);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

    doc.moveDown(0.8);
    doc.fontSize(14).font('Helvetica-Bold').text('NOTES');
    doc.moveDown(0.3);
    if (notes.length === 0) {
      doc.fontSize(11).font('Helvetica').text('- No notes');
    } else {
      for (const note of notes) {
        const ts = formatMmSs(note.timecode_ms);
        const text = note.text?.trim() || '(empty)';
        doc.fontSize(11).font('Helvetica').text(`[${ts}] ${text}`);
      }
    }

    doc.end();
  });

  const safeFileName = sanitizePdfFilename(sessionRow.name || 'session-export');
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFileName}.pdf"`,
    },
  });
});

export const sessionsRoutes = app;
