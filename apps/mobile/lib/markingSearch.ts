import { apiRequest } from './api';
import type { Clip } from '@roam/types';

export type MarkingSearchMatch = {
  clip: Clip;
  score: number;
};

export type MarkingSearchResponse = {
  matches: MarkingSearchMatch[];
  indexed_count: number;
  hint?: string;
};

export async function indexMarkingClip(
  token: string,
  clipId: string
): Promise<{ clip_id: string; indexed: boolean }> {
  const res = await apiRequest('/library/marking-search/index', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clip_id: clipId }),
    timeoutMs: 60_000,
  });
  return res.json() as Promise<{ clip_id: string; indexed: boolean }>;
}

export async function indexAllMarkingClips(
  token: string,
  limit = 25
): Promise<{ indexed: number; failed: number }> {
  const res = await apiRequest(`/library/marking-search/index-all?limit=${limit}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 120_000,
  });
  const data = (await res.json()) as { indexed: number; failed: number };
  return data;
}

export async function searchByClipId(
  token: string,
  clipId: string,
  limit = 12
): Promise<MarkingSearchResponse> {
  const res = await apiRequest('/library/marking-search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clip_id: clipId, limit, exclude_clip_id: clipId }),
    timeoutMs: 90_000,
  });
  return res.json() as Promise<MarkingSearchResponse>;
}

export async function searchByThumbnails(
  token: string,
  thumbnailsBase64: string[],
  limit = 12
): Promise<MarkingSearchResponse> {
  const res = await apiRequest('/library/marking-search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ thumbnails_base64: thumbnailsBase64, limit }),
    timeoutMs: 90_000,
  });
  return res.json() as Promise<MarkingSearchResponse>;
}
