import { notFound } from 'next/navigation';
import { ClipPlayer } from './ClipPlayer';

export const dynamic = 'force-dynamic';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ShareSection {
  label: string;
  start_ms: number;
}

interface ShareQualityTarget {
  source_clip_id: string;
  timestamp_ms: number;
}

interface ShareClip {
  id: string;
  mux_playback_id: string | null;
  upload_status: string;
  move_name: string | null;
  label: string | null;
  style: string | null;
  energy: string | null;
  difficulty: string | null;
}

interface SharePayload {
  session_name: string;
  phrase: string | null;
  quality_target: ShareQualityTarget | null;
  sections: ShareSection[];
  clips: ShareClip[];
}

function formatSectionTime(startMs: number): string {
  const totalSec = Math.floor(startMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatMomentTime(startMs: number): string {
  const clampedMs = Number.isFinite(startMs) ? Math.max(0, startMs) : 0;
  const totalSec = Math.floor(clampedMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(`${API_BASE}/share/${token}`, { cache: 'no-store' });
  if (!response.ok) notFound();

  const data = (await response.json()) as SharePayload | null;
  if (!data) notFound();

  const { session_name, phrase, quality_target, sections, clips } = data;
  const qualityTarget = quality_target ?? null;
  const qualityTargetClipLabel = qualityTarget?.source_clip_id
    ? clips.find((clip) => clip.id === qualityTarget.source_clip_id)?.move_name ??
      clips.find((clip) => clip.id === qualityTarget.source_clip_id)?.label ??
      null
    : null;

  return (
    <div className="min-h-screen bg-roam-ground text-roam-active">
      <header className="p-4 border-b border-roam-border">
        <h1 className="text-xl font-bold font-serif">{session_name}</h1>
        {phrase ? (
          <p className="text-roam-active text-sm mt-1 italic">"{phrase}"</p>
        ) : null}
        {qualityTarget ? (
          <p className="text-roam-muted text-sm mt-1">
            Quality target: {formatMomentTime(qualityTarget.timestamp_ms)}
            {qualityTargetClipLabel ? ` from ${qualityTargetClipLabel}` : ''}
          </p>
        ) : null}
      </header>

      <main className="p-4 space-y-6">
        {sections.length > 0 ? (
          <section>
            <div className="flex flex-wrap gap-2">
              {sections.map((section, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-roam-border text-roam-active"
                >
                  {section.label} · {formatSectionTime(section.start_ms)}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Clips grid */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Clips</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {clips.map((clip) =>
              clip.upload_status === 'ready' && clip.mux_playback_id ? (
                <ClipPlayer
                  key={clip.id}
                  playbackId={clip.mux_playback_id}
                  thumbnailUrl={`https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg`}
                  label={clip.move_name ?? clip.label}
                  tags={{
                    style: clip.style,
                    energy: clip.energy,
                    difficulty: clip.difficulty,
                  }}
                  feedbackOpen={false}
                  clipId={clip.id}
                  shareToken={token}
                />
              ) : clip.upload_status === 'processing' ? (
                <div
                  key={clip.id}
                  className="rounded-lg bg-roam-chrome border border-roam-border aspect-video flex items-center justify-center text-roam-muted text-sm"
                >
                  Processing…
                </div>
              ) : null
            )}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-roam-muted text-sm">
        Made with Roam
      </footer>
    </div>
  );
}
