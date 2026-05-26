import type { Context, Next } from 'hono';

const MAX_BODY_BYTES = Number(process.env.ROAM_MAX_BODY_BYTES ?? 1_048_576);

const BLOCKED_PATH_PREFIXES = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login',
  '/phpmyadmin',
  '/admin',
];

export async function requestGuards(c: Context, next: Next) {
  const path = c.req.path.toLowerCase();
  if (BLOCKED_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return c.body(null, 404);
  }

  const contentLength = c.req.header('content-length');
  if (contentLength) {
    const bytes = Number(contentLength);
    if (Number.isFinite(bytes) && bytes > MAX_BODY_BYTES) {
      return c.json({ error: 'Payload too large' }, 413);
    }
  }

  return next();
}
