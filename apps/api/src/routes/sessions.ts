import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { checkSessionLimit } from '../lib/planGate.js';
import type { Session, MusicTrack, Clip } from '@roam/types';

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
    .select('id, user_id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ sessions: data as Session[] });
});

/** POST /sessions — create a session */
app.post('/', checkSessionLimit, async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const body = await c.req.json<{ name?: string }>();
  const name = typeof body?.name === 'string' ? body.name.trim() || 'Untitled Session' : 'Untitled Session';

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

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, name })
    .select('id, user_id, name, created_at')
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Session, 201);
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

/** POST /sessions/:id/join — join/upsert a group participant row */
app.post('/:id/join', async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const sessionId = c.req.param('id');
  const body = await c.req.json<{ share_token?: string }>().catch(() => ({}));
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

export const sessionsRoutes = app;
