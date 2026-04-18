import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { evaluateClipLimit } from '../lib/planGate.js';
import type { Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>()
  .use('*', requireAuth);

/** Ensure session belongs to user; returns session id or null */
async function getSessionForUser(sessionId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

async function hasSessionAccessForClips(sessionId: string, userId: string): Promise<boolean> {
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

type JsonReqContext = { req: { json: () => Promise<unknown> } };

async function safeReqJson<T>(
  c: JsonReqContext
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const data = await c.req.json();
    return { ok: true, data: data as T };
  } catch {
    return { ok: false };
  }
}

/** GET /sessions/:sessionId/clips — list clips for a session */
app.get('/:sessionId/clips', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ clips: data as Clip[] });
});

/** POST /sessions/:sessionId/clips — create a clip */
app.post('/:sessionId/clips', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const limitResult = await evaluateClipLimit(userId);
  if (!limitResult.allowed) return c.json(limitResult.body, limitResult.status);

  const body = await c.req.json<{
    local_id: string;
    label?: string | null;
    recorded_at: string;
    mux_upload_id?: string | null;
    mux_playback_id?: string | null;
    mux_asset_id?: string | null;
    mux_passthrough?: Record<string, unknown> | null;
    upload_status?: Clip['upload_status'];
    move_name?: string | null;
    style?: string | null;
    energy?: string | null;
    difficulty?: string | null;
    bpm?: number | null;
    notes?: string | null;
    url?: string | null;
    thumbnail_url?: string | null;
    clip_type?: 'MINE' | 'REF' | 'voice_memo' | null;
    type?: 'MINE' | 'REF' | 'voice_memo' | null; // Alias for clip_type for documented contract
    title?: string | null;
    start_ms?: number | null;
  }>();

  if (!body?.local_id || typeof body.recorded_at !== 'string') {
    return c.json({ error: 'local_id and recorded_at are required' }, 400);
  }

  // Normalize type to clip_type for documented contract compatibility
  const normalizedClipType = body.type || body.clip_type;
  
  const row = {
    user_id: userId,
    session_id: sessionId,
    local_id: body.local_id,
    label: body.title || body.label || 'Clip', // Use title if provided, fallback to label
    recorded_at: body.recorded_at,
    mux_upload_id: body.mux_upload_id ?? null,
    mux_playback_id: body.mux_playback_id ?? null,
    mux_asset_id: body.mux_asset_id ?? null,
    mux_passthrough: body.mux_passthrough ?? null,
    upload_status: body.upload_status ?? 'local',
    move_name: body.move_name ?? null,
    style: body.style ?? null,
    energy: body.energy ?? null,
    difficulty: body.difficulty ?? null,
    bpm: body.bpm ?? null,
    notes: body.notes ?? null,
    url: body.url ?? null,
    thumbnail_url: body.thumbnail_url ?? null,
    clip_type: normalizedClipType ?? null,
    start_ms: body.start_ms ?? null,
  };

  const { data, error } = await supabase
    .from('clips')
    .insert(row)
    .select('*')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as Clip, 201);
});

/** GET /sessions/:sessionId/clips/:clipId — get one clip */
app.get('/:sessionId/clips/:clipId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Clip);
});

/** PATCH /sessions/:sessionId/clips/:clipId — update a clip */
app.patch('/:sessionId/clips/:clipId', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Partial<{
    label: string | null;
    mux_upload_id: string | null;
    mux_playback_id: string | null;
    mux_asset_id: string | null;
    mux_passthrough: Record<string, unknown> | null;
    upload_status: Clip['upload_status'];
    move_name: string | null;
    style: string | null;
    energy: string | null;
    difficulty: string | null;
    bpm: number | null;
    notes: string | null;
    recorded_at: string;
  }>>();

  const updates: Record<string, unknown> = {};
  if (body && typeof body === 'object') {
    const allowed = [
      'label', 'mux_upload_id', 'mux_playback_id', 'mux_asset_id', 'mux_passthrough',
      'upload_status', 'move_name', 'style', 'energy', 'difficulty', 'bpm', 'notes', 'recorded_at',
    ] as const;
    for (const key of allowed) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    const { data: existing } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .eq('session_id', sessionId)
      .single();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    return c.json(existing as Clip);
  }

  const { data, error } = await supabase
    .from('clips')
    .update(updates)
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return c.json({ error: 'Not found' }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json(data as Clip);
});

/** POST /sessions/:sessionId/clips/:clipId/trim — trim a clip and create new REF clip */
app.post('/:sessionId/clips/:clipId/trim', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  // Parse and validate request body
  const body = await c.req.json<{ start_ms: number; end_ms: number; section_label?: string }>();
  if (!Number.isFinite(body.start_ms) || !Number.isFinite(body.end_ms) || body.end_ms <= body.start_ms) {
    return c.json({ error: 'start_ms and end_ms must be finite numbers with end_ms > start_ms' }, 400);
  }

  // Fetch source clip and verify ownership and MINE type
  const { data: sourceClip, error: sourceError } = await supabase
    .from('clips')
    .select('*')
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .single();

  if (sourceError) {
    if (sourceError.code === 'PGRST116') return c.json({ error: 'Clip not found' }, 404);
    return c.json({ error: sourceError.message }, 500);
  }

  // Verify clip is MINE or NULL (owner clip)
  if (sourceClip.clip_type === 'REF') {
    return c.json({ error: 'Cannot trim REF clips' }, 403);
  }

  // Verify clip has mux_asset_id
  if (!sourceClip.mux_asset_id) {
    return c.json({ error: 'Clip not yet processed by Mux' }, 422);
  }

  // Call Mux trim API
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    return c.json({ error: 'Mux not configured' }, 502);
  }

  const authHeader = `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`;

  const muxRes = await fetch('https://api.mux.com/video/v1/assets', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [{
        url: `mux://assets/${sourceClip.mux_asset_id}`,
        start_time: body.start_ms / 1000,
        end_time: body.end_ms / 1000,
      }],
      playback_policy: ['public'],
    }),
  });

  if (!muxRes.ok) {
    return c.json(
      { error: 'Mux trim failed', detail: await muxRes.text() },
      502
    );
  }

  let muxData: { id?: string; playback_ids?: Array<{ id: string }> };
  try {
    const muxJson = await muxRes.json();
    muxData = muxJson?.data ?? muxJson;
  } catch {
    return c.json({ error: 'Invalid Mux response' }, 502);
  }

  const newMuxAssetId = muxData?.id;
  const newMuxPlaybackId = muxData?.playback_ids?.[0]?.id ?? null;

  if (!newMuxAssetId) {
    return c.json({ error: 'Mux response missing asset ID' }, 502);
  }

  // Insert new REF clip
  const { data: newClip, error: insertError } = await supabase
    .from('clips')
    .insert({
      user_id: userId,
      session_id: sessionId,
      local_id: crypto.randomUUID(),
      label: `${sourceClip.label || 'Clip'} (trim)`,
      recorded_at: new Date().toISOString(),
      mux_asset_id: newMuxAssetId,
      mux_playback_id: newMuxPlaybackId,
      upload_status: newMuxPlaybackId ? 'ready' : 'processing',
      clip_type: 'REF',
      url: null,
      thumbnail_url: null,
      start_ms: body.start_ms,
      trimmed_from_clip_id: clipId,
      parent_clip_id: clipId,
    })
    .select('*')
    .single();

  if (insertError) {
    return c.json({ error: insertError.message }, 500);
  }

  // If section_label provided, create section_clips association
  let sectionClip = null;
  if (body.section_label) {
    const { data: newSectionClip, error: sectionError } = await supabase
      .from('section_clips')
      .insert({
        session_id: sessionId,
        clip_id: newClip.id,
        section_label: body.section_label,
      })
      .select('*')
      .single();

    if (sectionError) {
      // Log error but don't fail the request - the clip was still created
      console.error('Failed to create section association:', sectionError);
    } else {
      sectionClip = newSectionClip;
    }
  }

  return c.json({ clip: newClip, sectionClip }, 201);
});

/** POST /sessions/:sessionId/clips/:clipId/feedback — create structured feedback */
app.post('/:sessionId/clips/:clipId/feedback', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const clipId = c.req.param('clipId');

  const allowed = await hasSessionAccessForClips(sessionId, userId);
  if (!allowed) return c.json({ error: 'Forbidden' }, 403);

  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', clipId)
    .eq('session_id', sessionId)
    .maybeSingle();
  if (clipError) return c.json({ error: clipError.message }, 500);
  if (!clip) return c.json({ error: 'Not found' }, 404);

  const parsed = await safeReqJson<{
    statement?: string;
    questions?: string;
    observations?: string;
    opinions?: string;
  }>(c);
  if (!parsed.ok) return c.json({ error: 'Invalid JSON body' }, 400);

  const body = parsed.data ?? {};

  const { data, error } = await supabase
    .from('structured_feedback')
    .insert({
      session_id: sessionId,
      clip_id: clipId,
      user_id: userId,
      statement: typeof body.statement === 'string' ? body.statement : null,
      questions: typeof body.questions === 'string' ? body.questions : null,
      observations: typeof body.observations === 'string' ? body.observations : null,
      opinions: typeof body.opinions === 'string' ? body.opinions : null,
    })
    .select('id, created_at')
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data as { id: string; created_at: string }, 201);
});

/** POST /sessions/:sessionId/section_clips — assign clip to section */
app.post('/:sessionId/section_clips', async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.param('sessionId');
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<{
    clip_id: string;
    section_label?: string;
    section_id?: string;
  }>();

  if (!body?.clip_id) {
    return c.json({ error: 'clip_id is required' }, 400);
  }

  if (!body?.section_label && !body?.section_id) {
    return c.json({ error: 'section_label or section_id is required' }, 400);
  }

  // Verify clip belongs to the session
  const { error: clipError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', body.clip_id)
    .eq('session_id', sessionId)
    .single();

  if (clipError) {
    if (clipError.code === 'PGRST116') return c.json({ error: 'Clip not found' }, 404);
    return c.json({ error: clipError.message }, 500);
  }

  // Create section_clips association
  const { data: sectionClip, error: sectionError } = await supabase
    .from('section_clips')
    .insert({
      session_id: sessionId,
      clip_id: body.clip_id,
      section_label: body.section_label || null,
      section_id: body.section_id || null,
    })
    .select('*')
    .single();

  if (sectionError) {
    return c.json({ error: sectionError.message }, 500);
  }

  return c.json(sectionClip, 201);
});

export const clipsRoutes = app;
