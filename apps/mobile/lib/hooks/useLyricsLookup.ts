import { useCallback, useState } from 'react';
import { apiRequest, ApiRequestError } from '../api';
import { useSession } from './useSession';
import { useSessionContext } from '../contexts/SessionContext';

export type LyricLine = { timeMs: number; text: string };

function parseLyrics(text: string): LyricLine[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const span = 4000;
  return lines.map((textLine, i) => ({
    timeMs: i * span,
    text: textLine.trim(),
  }));
}

export function useLyricsLookup() {
  const { session } = useSession();
  const { sessionId } = useSessionContext();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LyricLine[]>([]);

  const fetch = useCallback(async () => {
    if (!sessionId || !session?.access_token) return;
    const q = query.trim();
    if (!q) {
      setError('Enter artist - title');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(
        `/sessions/${sessionId}/music/lyrics?query=${encodeURIComponent(q)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          timeoutMs: 8_000,
          retries: 1,
        }
      );
      const data = (await res.json()) as { lyrics?: string; error?: string };
      if (!res.ok || !data.lyrics) {
        setLines([]);
        setError(data.error ?? 'Lyrics not found');
        return;
      }
      setLines(parseLyrics(data.lyrics));
    } catch (e) {
      setLines([]);
      setError(e instanceof ApiRequestError && e.reason === 'timeout' ? 'Timeout' : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }, [query, sessionId, session?.access_token]);

  return { query, setQuery, loading, error, lines, fetch };
}
