import type { Context, Next } from 'hono';

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.ROAM_ALLOWED_ORIGINS ?? process.env.SHARE_BASE_URL ?? '';
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(origins);
}

const allowedOrigins = parseAllowedOrigins();

export async function corsPolicy(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  if (origin && allowedOrigins.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, apikey, X-Requested-With'
    );
  }
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  return next();
}
