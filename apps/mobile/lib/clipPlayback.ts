import type { ClipRow } from './database';

/** Server/API rows may use `url`; SQLite uses `source_url`. */
export function resolveSourceUrl(
  row: ClipRow | Record<string, unknown> | null | undefined
): string | null {
  if (!row) return null;
  const r = row as ClipRow & { url?: string | null };
  return r.source_url ?? r.url ?? null;
}

export function getMuxHlsUri(muxPlaybackId: string | null | undefined): string | null {
  if (!muxPlaybackId) return null;
  return `https://stream.mux.com/${muxPlaybackId}.m3u8`;
}

/** Local file or Mux HLS — not external REF URLs (YouTube/Bilibili). */
export function getClipVideoUri(clip: ClipRow | null): string | null {
  if (!clip) return null;
  const mux = getMuxHlsUri(clip.mux_playback_id);
  if (mux) return mux;
  if (clip.file_uri && clip.upload_status !== 'failed') return clip.file_uri;
  return null;
}

export function isExternalRefClip(clip: ClipRow | null): boolean {
  if (!clip) return false;
  const url = resolveSourceUrl(clip);
  if (!url) return false;
  if (clip.mux_playback_id || clip.file_uri) return false;
  return clip.clip_type === 'REF' || /youtube|youtu\.be|bilibili|xiaohongshu|xhslink/i.test(url);
}

export function extractYoutubeVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
  return m?.[1] ?? null;
}

export function isYoutubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function isBilibiliUrl(url: string): boolean {
  return /bilibili\.com|b23\.tv/i.test(url);
}

export function extractBilibiliBvid(url: string): string | null {
  const m =
    url.match(/\/video\/(BV[\w]+)/i) ??
    url.match(/[?&]bvid=(BV[\w]+)/i);
  return m?.[1] ?? null;
}

/** Bilibili embed player when possible; otherwise the share page URL. */
export function bilibiliEmbedUrl(url: string): string | null {
  const bvid = extractBilibiliBvid(url);
  if (!bvid) return null;
  return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&autoplay=0`;
}

export function isXiaohongshuUrl(url: string): boolean {
  return /xiaohongshu\.com|xhslink\.com/i.test(url);
}

export function clipPlayableInCanvas(clip: ClipRow): boolean {
  if (getClipVideoUri(clip)) return true;
  return isExternalRefClip(clip);
}

export function uploadStatusLabel(status: string | null | undefined): string | null {
  if (!status || status === 'ready') return null;
  if (status === 'local' || status === 'uploading') return 'Uploading…';
  if (status === 'processing') return 'Processing…';
  if (status === 'failed') return 'Upload failed';
  return status;
}
