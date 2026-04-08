import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Session, Clip, MusicTrack, SectionEntry } from '@roam/types';
import { ClipPlayer } from './ClipPlayer';
import { MusicPlayer } from './MusicPlayer';

export const dynamic = 'force-dynamic';

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

function youtubeEmbedUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  try {
    const u = new URL(sourceUrl);
    const v = u.searchParams.get('v') ?? (u.hostname === 'youtu.be' ? u.pathname.slice(1) : null);
    return v ? `https://www.youtube.com/embed/${v}` : null;
  } catch {
    return null;
  }
}

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.rpc('get_shared_session', { p_token: token });
  if (error || data === null) notFound();

  const { session, music_track, clips } = data as {
    session: Session;
    music_track: MusicTrack | null;
    clips: Clip[];
  };

  const feedbackOpenByClipId = new Map<string, boolean>(
    await Promise.all(
      clips.map(async (clip) => {
        const { data: fr } = await supabase.rpc('get_feedback_request_for_share', {
          p_token: token,
          p_clip_id: clip.id,
        });
        const status = (fr as { status?: string } | null)?.status;
        return [clip.id, status === 'open'] as const;
      })
    )
  );

  let uploadedAudioUrl: string | null = null;
  if (
    music_track?.source_type === 'upload' &&
    music_track?.analysis_status === 'complete' &&
    music_track.storage_path
  ) {
    const { data: signed } = await supabase.storage
      .from('audio')
      .createSignedUrl(music_track.storage_path, 3600);
    uploadedAudioUrl = signed?.signedUrl ?? null;
  }

  const sections = (music_track?.sections ?? null) as SectionEntry[] | null;
  const qualityTarget = session.quality_target ?? null;
  const qualityTargetClipLabel = qualityTarget?.source_clip_id
    ? clips.find((clip) => clip.id === qualityTarget.source_clip_id)?.move_name ??
      clips.find((clip) => clip.id === qualityTarget.source_clip_id)?.label ??
      null
    : null;
  const youtubeEmbed = music_track?.source_type === 'youtube'
    ? youtubeEmbedUrl(music_track.source_url)
    : null;

  return (
    <div className="min-h-screen bg-roam-ground text-roam-active">
      <header className="p-4 border-b border-roam-border">
        <h1 className="text-xl font-bold font-serif">{session.name}</h1>
        {session.phrase ? (
          <p className="text-roam-active text-sm mt-1 italic">"{session.phrase}"</p>
        ) : null}
        {qualityTarget ? (
          <p className="text-roam-muted text-sm mt-1">
            Quality target: {formatMomentTime(qualityTarget.timestamp_ms)}
            {qualityTargetClipLabel ? ` from ${qualityTargetClipLabel}` : ''}
          </p>
        ) : null}
        <p className="text-roam-muted text-sm mt-1">
          {new Date(session.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      <main className="p-4 space-y-6">
        {/* Music */}
        <section>
          {music_track?.source_type === 'upload' &&
            music_track?.analysis_status === 'complete' &&
            uploadedAudioUrl && (
              <>
                <MusicPlayer src={uploadedAudioUrl!} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {sections?.map((section, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-roam-chrome border border-roam-border text-roam-active"
                    >
                      {section.label} · {formatSectionTime(section.start_ms)}
                    </span>
                  ))}
                </div>
              </>
            )}
          {music_track?.source_type === 'upload' &&
            (music_track?.analysis_status !== 'complete' || !uploadedAudioUrl) && (
              <div className="rounded-lg bg-roam-chrome border border-roam-border p-6 text-roam-muted text-center max-w-2xl">
                Music processing…
              </div>
            )}
          {music_track?.source_type === 'youtube' && youtubeEmbed && (
            <>
              <iframe
                src={youtubeEmbed}
                title="Music"
                className="w-full max-w-2xl aspect-video rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {sections && sections.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {sections.map((section, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-roam-chrome border border-roam-border text-roam-active"
                    >
                      {section.label} · {formatSectionTime(section.start_ms)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
          {!music_track && (
            <div className="rounded-lg bg-roam-chrome border border-roam-border p-6 text-roam-muted text-center max-w-2xl">
              No music added
            </div>
          )}
        </section>

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
                  feedbackOpen={feedbackOpenByClipId.get(clip.id) ?? false}
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
