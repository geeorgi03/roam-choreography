import type { Context } from 'hono';

/** Avoid leaking internal DB / provider errors to clients in production. */
export function publicErrorMessage(internal: string | undefined, fallback: string): string {
  if (process.env.NODE_ENV !== 'production') {
    return internal?.trim() || fallback;
  }
  return fallback;
}

export function jsonSafeError(c: Context, internal: string | undefined, status: 400 | 403 | 404 | 500) {
  const messages: Record<number, string> = {
    400: 'Invalid request',
    403: 'Forbidden',
    404: 'Not found',
    500: 'Internal server error',
  };
  return c.json({ error: publicErrorMessage(internal, messages[status]) }, status);
}
