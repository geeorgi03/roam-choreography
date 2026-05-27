import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import {
  MARKING_SAMPLE_TIMES_SEC,
  MARKING_FINGERPRINT_DIMS,
  rankBySimilarity,
} from '@roam/marking-fingerprint';
import {
  fingerprintFromImageBuffers,
  fetchMuxThumbnail,
  muxThumbnailUrl,
  parseFingerprintJson,
} from '../lib/markingFingerprintImages.js';
import type { Clip } from '@roam/types';

const app = new Hono<{ Variables: { userId: string } }>().use('*', requireAuth);

async function getOwnedClip(clipId: string, userId: string): Promise<Clip | null> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('id', clipId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Clip;
}

async function fingerprintFromMuxPlayback(playbackId: string): Promise<number[]> {
  const buffers: Buffer[] = [];
  for (const t of MARKING_SAMPLE_TIMES_SEC) {
    const url = muxThumbnailUrl(playbackId, t);
    buffers.push(await fetchMuxThumbnail(url));
  }
  return fingerprintFromImageBuffers(buffers);
}

async function upsertFingerprint(userId: string, clipId: string, fingerprint: number[]): Promise<void> {
  const { error } = await supabase.from('clip_marking_fingerprints').upsert(
    {
      clip_id: clipId,
      user_id: userId,
      fingerprint,
      dims: MARKING_FINGERPRINT_DIMS,
      source: 'mux_thumbnails',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'clip_id' }
  );
  if (error) throw new Error(error.message);
}

/** POST /library/marking-search/index — index one ready clip from Mux thumbnails */
app.post('/index', async (c) => {
  const userId = c.get('userId');
  let body: { clip_id?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const clipId = body?.clip_id;
  if (!clipId) return c.json({ error: 'clip_id is required' }, 400);

  const clip = await getOwnedClip(clipId, userId);
  if (!clip) return c.json({ error: 'Clip not found' }, 404);
  if (clip.upload_status !== 'ready' || !clip.mux_playback_id) {
    return c.json({ error: 'Clip must be ready with Mux playback' }, 400);
  }

  try {
    const fingerprint = await fingerprintFromMuxPlayback(clip.mux_playback_id);
    await upsertFingerprint(userId, clipId, fingerprint);
    return c.json({ clip_id: clipId, indexed: true, dims: MARKING_FINGERPRINT_DIMS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Index failed';
    return c.json({ error: msg }, 500);
  }
});

/** POST /library/marking-search/index-all — index unindexed ready clips (batch) */
app.post('/index-all', async (c) => {
  const userId = c.get('userId');
  const url = new URL(c.req.url);
  const rawLimit = Number(url.searchParams.get('limit') ?? '25');
  const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 25));

  const { data: clips, error } = await supabase
    .from('clips')
    .select('id, mux_playback_id, upload_status')
    .eq('user_id', userId)
    .eq('upload_status', 'ready')
    .not('mux_playback_id', 'is', null)
    .order('recorded_at', { ascending: false })
    .limit(limit * 2);

  if (error) return c.json({ error: error.message }, 500);

  const { data: existing } = await supabase
    .from('clip_marking_fingerprints')
    .select('clip_id')
    .eq('user_id', userId);

  const indexed = new Set((existing ?? []).map((r) => r.clip_id as string));
  const toIndex = (clips ?? []).filter((cl) => !indexed.has(cl.id as string)).slice(0, limit);

  const results: { clip_id: string; ok: boolean; error?: string }[] = [];
  for (const cl of toIndex) {
    const playbackId = cl.mux_playback_id as string;
    try {
      const fingerprint = await fingerprintFromMuxPlayback(playbackId);
      await upsertFingerprint(userId, cl.id as string, fingerprint);
      results.push({ clip_id: cl.id as string, ok: true });
    } catch (e) {
      results.push({
        clip_id: cl.id as string,
        ok: false,
        error: e instanceof Error ? e.message : 'failed',
      });
    }
  }

  return c.json({
    indexed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
});

type SearchBody = {
  clip_id?: string;
  fingerprint?: number[];
  thumbnails_base64?: string[];
  limit?: number;
  exclude_clip_id?: string;
};

/** POST /library/marking-search — find similar choreography in indexed library */
app.post('/', async (c) => {
  const userId = c.get('userId');
  let body: SearchBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const rawLimit = Number(body.limit ?? 12);
  const limit = Math.min(30, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 12));
  const excludeClipId = body.exclude_clip_id ?? body.clip_id ?? null;

  let queryVector: number[] | null = null;

  if (body.fingerprint) {
    queryVector = parseFingerprintJson(body.fingerprint);
    if (!queryVector) return c.json({ error: 'Invalid fingerprint array' }, 400);
  } else if (body.thumbnails_base64?.length) {
    try {
      const buffers = body.thumbnails_base64.slice(0, 8).map((b64) => Buffer.from(b64, 'base64'));
      queryVector = await fingerprintFromImageBuffers(buffers);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not read thumbnails';
      return c.json({ error: msg }, 400);
    }
  } else if (body.clip_id) {
    const clip = await getOwnedClip(body.clip_id, userId);
    if (!clip) return c.json({ error: 'Clip not found' }, 404);
    if (!clip.mux_playback_id) return c.json({ error: 'Clip has no playback id' }, 400);
    try {
      queryVector = await fingerprintFromMuxPlayback(clip.mux_playback_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not build query fingerprint';
      return c.json({ error: msg }, 500);
    }
  } else {
    return c.json({ error: 'Provide clip_id, fingerprint, or thumbnails_base64' }, 400);
  }

  const { data: rows, error } = await supabase
    .from('clip_marking_fingerprints')
    .select('clip_id, fingerprint')
    .eq('user_id', userId);

  if (error) return c.json({ error: error.message }, 500);

  const candidates = (rows ?? [])
    .map((row) => ({
      clip_id: row.clip_id as string,
      fingerprint: parseFingerprintJson(row.fingerprint) ?? [],
    }))
    .filter((row) => row.fingerprint.length === MARKING_FINGERPRINT_DIMS)
    .filter((row) => !excludeClipId || row.clip_id !== excludeClipId);

  const ranked = rankBySimilarity(queryVector, candidates, limit);
  const clipIds = ranked.map((r) => r.clip_id);
  if (clipIds.length === 0) {
    return c.json({
      matches: [],
      indexed_count: candidates.length,
      hint: candidates.length === 0 ? 'index_library_first' : undefined,
    });
  }

  const { data: clipRows, error: clipsError } = await supabase
    .from('clips')
    .select('*')
    .in('id', clipIds);

  if (clipsError) return c.json({ error: clipsError.message }, 500);

  const byId = new Map((clipRows ?? []).map((cl) => [cl.id as string, cl as Clip]));
  const matches = ranked
    .map((r) => {
      const clip = byId.get(r.clip_id);
      if (!clip) return null;
      return { clip, score: r.score };
    })
    .filter(Boolean);

  return c.json({
    matches,
    indexed_count: candidates.length,
  });
});

export const markingSearchRoutes = app;
