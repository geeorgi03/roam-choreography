'use client';

export function MusicPlayer({ src }: { src: string }) {
  return (
    <div className="rounded-lg bg-roam-chrome border border-roam-border text-roam-active p-4 max-w-2xl">
      <audio controls src={src} className="w-full" />
    </div>
  );
}
