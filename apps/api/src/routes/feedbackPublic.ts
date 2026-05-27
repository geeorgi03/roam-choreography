import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import { clampString, isUuid } from '../lib/sanitize.js';
import { jsonSafeError } from '../middleware/safeErrors.js';

const app = new Hono();

/** POST /feedback — submit feedback (no auth); body: { clip_id, timecode_ms, text, commenter_name, share_token } */
app.post('/', async (c) => {
  let body: {
    clip_id?: string;
    timecode_ms?: number;
    text?: string;
    category?: string;
    commenter_name?: string;
    share_token?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const clip_id = typeof body?.clip_id === 'string' && isUuid(body.clip_id) ? body.clip_id.trim() : null;
  const timecode_ms = body?.timecode_ms;
  const text = clampString(body?.text, 4000);
  const category = clampString(body?.category, 64) ?? '';
  const commenter_name = clampString(body?.commenter_name, 120);
  const share_token =
    typeof body?.share_token === 'string' && isUuid(body.share_token)
      ? body.share_token.trim()
      : null;

  if (!clip_id || typeof timecode_ms !== 'number' || !Number.isFinite(timecode_ms) || !text) {
    return c.json({ error: 'clip_id, timecode_ms, and text are required' }, 400);
  }

  if (timecode_ms < 0 || timecode_ms > 86_400_000) {
    return c.json({ error: 'Invalid timecode_ms' }, 400);
  }

  if (!share_token) {
    return c.json({ error: 'share_token is required' }, 400);
  }

  const trimmedShareToken = share_token;

  const { data: clipRow, error: clipError } = await supabase
    .from('clips')
    .select('id, session_id')
    .eq('id', clip_id)
    .single();

  if (clipError || !clipRow) {
    return c.json({ error: 'Clip not found' }, 404);
  }

  const { data: shareTokenRow, error: tokenError } = await supabase
    .from('share_tokens')
    .select('session_id, clip_id')
    .eq('token', trimmedShareToken)
    .is('revoked_at', null)
    .maybeSingle();

  if (tokenError) return c.json({ error: 'Invalid or expired share token' }, 403);

  if (!shareTokenRow) return c.json({ error: 'Invalid or expired share token' }, 403);

  // Clip-scoped tokens must match the requested clip_id exactly.
  if (shareTokenRow.clip_id) {
    if (shareTokenRow.clip_id !== clip_id) {
      return c.json({ error: 'Invalid or expired share token' }, 403);
    }
  } else {
    // Legacy session-level tokens: allow any clip within the session.
    if (!clipRow.session_id || shareTokenRow.session_id !== clipRow.session_id) {
      return c.json({ error: 'Invalid or expired share token' }, 403);
    }
  }

  const { data: openRequests, error: fetchError } = await supabase
    .from('feedback_requests')
    .select('id, session_id')
    .eq('clip_id', clip_id)
    .eq('status', 'open')
    .limit(1);

  if (fetchError) return jsonSafeError(c, fetchError.message, 500);
  const openRequest = openRequests?.[0] ?? null;
  if (!openRequest) {
    return c.json({ error: 'Feedback not open for this clip' }, 403);
  }

  const normalizedCategory = ['Idea', 'Timing', 'Spacing', 'Energy'].includes(category)
    ? category
    : null;
  const normalizedText = normalizedCategory ? `[${normalizedCategory}] ${text.trim()}` : text.trim();

  const { error } = await supabase
    .from('clip_comments')
    .insert({
      clip_id,
      session_id: openRequest.session_id,
      timecode_ms,
      text: normalizedText,
      commenter_name,
    });

  if (error) return jsonSafeError(c, error.message, 500);
  return c.json({ ok: true, feedback_category: normalizedCategory, feedback_text: text.trim() }, 201);
});

export const publicFeedbackRoutes = app;
