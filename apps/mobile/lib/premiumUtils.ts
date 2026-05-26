import type { SectionEntry } from '@roam/types';

export type SectionTone = 'sage' | 'accent' | 'gold' | 'plum' | 'ghost';

const SECTION_TONES: SectionTone[] = ['sage', 'accent', 'gold', 'plum', 'ghost'];

export function sectionToneForIndex(index: number): SectionTone {
  return SECTION_TONES[index % SECTION_TONES.length] ?? 'ghost';
}

export function formatTimecode(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

export function formatDurationSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

export function sectionsWithSpan(
  sections: SectionEntry[],
  durationMs: number
): Array<SectionEntry & { flex: number; end_ms: number }> {
  if (sections.length === 0) return [];
  const total = Math.max(durationMs, 1);
  return sections.map((section, index) => {
    const nextStart = sections[index + 1]?.start_ms ?? total;
    const end_ms = Math.min(total, Math.max(section.start_ms + 1, nextStart));
    const span = Math.max(0.05, (end_ms - section.start_ms) / total);
    return { ...section, flex: span, end_ms };
  });
}

export function clipTags(clip: {
  move_name?: string | null;
  style?: string | null;
  energy?: string | null;
  difficulty?: string | null;
}): string[] {
  const tags: string[] = [];
  if (clip.move_name) tags.push(clip.move_name);
  if (clip.style) tags.push(clip.style);
  if (clip.energy) tags.push(clip.energy);
  if (clip.difficulty) tags.push(clip.difficulty);
  return tags;
}

export function isKeeperClip(clip: {
  notes?: string | null;
  move_name?: string | null;
}): boolean {
  const hay = `${clip.notes ?? ''} ${clip.move_name ?? ''}`.toLowerCase();
  return hay.includes('keeper');
}
