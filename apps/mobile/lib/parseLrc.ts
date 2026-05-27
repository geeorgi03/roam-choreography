export type LyricLine = { timeMs: number; text: string };

/** Parse LRC synced lyrics into timed lines. */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/);
    if (!m) continue;
    const min = Number.parseInt(m[1]!, 10);
    const sec = Number.parseInt(m[2]!, 10);
    const fracRaw = m[3] ?? '0';
    // LRC typically encodes centiseconds as `[mm:ss.xx]`, but some sources use
    // tenths as `[mm:ss.x]`. Normalize both into milliseconds.
    const fracMs =
      fracRaw.length === 1
        ? Number.parseInt(fracRaw, 10) * 100
        : fracRaw.length === 2
          ? Number.parseInt(fracRaw, 10) * 10
          : Number.parseInt(fracRaw.padEnd(3, '0').slice(0, 3), 10);
    const timeMs = (min * 60 + sec) * 1000 + fracMs;
    const text = (m[4] ?? '').trim();
    if (text) lines.push({ timeMs, text });
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

export function looksLikeLrc(text: string): boolean {
  return /^\[\d{1,2}:\d{2}/m.test(text);
}
