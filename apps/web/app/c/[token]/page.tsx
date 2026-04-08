import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Session, Clip } from '@roam/types';
import { ClipPlayer } from '../../s/[token]/ClipPlayer';

export const dynamic = 'force-dynamic';

function formatMomentTime(startMs: number): string {
  const clampedMs = Number.isFinite(startMs) ? Math.max(0, startMs) : 0;
  const totalSec = Math.floor(clampedMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default async function SharedClipPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('get_shared_clip', { p_token: token });
  if (error || data === null) notFound();

  const { session, clip } = data as { session: Session; clip: Clip };
  if (!clip?.id) notFound();

  const { data: fr } = await supabase.rpc('get_feedback_request_for_share', {
    p_token: token,
    p_clip_id: clip.id,
  });
  const status = (fr as { status?: string } | null)?.status;
  const feedbackOpen = status === 'open';
  const qualityTarget = session.quality_target ?? null;
  const isQualityTargetClip = qualityTarget?.source_clip_id === clip.id;

  return (
    <div className="min-h-screen bg-roam-ground text-roam-active">
      <header className="p-4 border-b border-roam-border">
        <h1 className="text-xl font-bold font-serif">{clip.move_name ?? clip.label ?? 'Clip'}</h1>
        {session.phrase ? (
          <p className="text-roam-active text-sm mt-1 italic">"{session.phrase}"</p>
        ) : null}
        {qualityTarget ? (
          <p className="text-roam-muted text-sm mt-1">
            Quality target: {formatMomentTime(qualityTarget.timestamp_ms)}
            {isQualityTargetClip ? ' from this clip' : ''}
          </p>
        ) : null}
        <p className="text-roam-muted text-sm mt-1">{session?.name ?? 'Session'}</p>
      </header>

      <main className="p-4 space-y-6 max-w-3xl">
        {clip.upload_status === 'ready' && clip.mux_playback_id ? (
          <ClipPlayer
            playbackId={clip.mux_playback_id}
            thumbnailUrl={`https://image.mux.com/${clip.mux_playback_id}/thumbnail.jpg`}
            label={clip.move_name ?? clip.label}
            tags={{
              style: clip.style,
              energy: clip.energy,
              difficulty: clip.difficulty,
            }}
            feedbackOpen={feedbackOpen}
            clipId={clip.id}
            shareToken={token}
          />
        ) : clip.upload_status === 'processing' ? (
          <div className="rounded-lg bg-roam-chrome border border-roam-border aspect-video flex items-center justify-center text-roam-muted text-sm">
            Processing…
          </div>
        ) : (
          <div className="rounded-lg bg-roam-chrome border border-roam-border p-6 text-roam-muted text-center">
            Clip not ready yet
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-roam-muted text-sm">Made with Roam</footer>
    </div>
  );
}

