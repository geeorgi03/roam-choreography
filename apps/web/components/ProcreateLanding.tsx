'use client';

import Link from 'next/link';
import { useState } from 'react';

type Tile = {
  id: string;
  title: string;
  subtitle: string;
  background: string;
  badge?: string;
  href?: string;
};

const TILES: Tile[] = [
  {
    id: 'sessions',
    title: 'Sessions',
    subtitle: 'Song · sections · takes',
    background:
      'linear-gradient(135deg, #6a1fa5 0%, #c44bff 40%, #ff6eb4 70%, #1a3a7a 100%)',
  },
  {
    id: 'loops',
    title: 'A–B loops',
    subtitle: 'Waveform · speed · mirror',
    background:
      'linear-gradient(160deg, #e8a650 0%, #b35c1a 30%, #1a0d00 60%, #3d2200 100%)',
  },
  {
    id: 'map',
    title: 'Song map',
    subtitle: 'Intro · verse · chorus',
    background:
      'linear-gradient(135deg, #0a1628 0%, #1a3870 40%, #2255b8 60%, #3388ff 100%)',
  },
  {
    id: 'capture',
    title: 'Capture',
    subtitle: 'MINE & REF clips',
    background:
      'linear-gradient(145deg, #ff7c3a 0%, #ff4466 40%, #1a1a4a 70%, #0a0a2a 100%)',
  },
  {
    id: 'practice',
    title: 'Practice',
    subtitle: 'Loupe · reference video',
    background:
      'linear-gradient(135deg, #1a2a4a 0%, #2255b8 50%, #44aaff 100%)',
    badge: '24 fps',
  },
  {
    id: 'draw',
    title: 'Draw & compose',
    subtitle: 'Overlay · timeline',
    background:
      'linear-gradient(135deg, #0a1a0a 0%, #1a5c1a 50%, #44ff88 100%)',
  },
  {
    id: 'library',
    title: 'Library',
    subtitle: 'Search · marking recall',
    background:
      'linear-gradient(135deg, #2a0a1a 0%, #ff2d6b 45%, #09090e 100%)',
  },
  {
    id: 'share',
    title: 'Share packs',
    subtitle: 'Feedback · collaborators',
    background:
      'linear-gradient(135deg, #1a1a2e 0%, #4a3a6a 50%, #8b7cf8 100%)',
    href: '/s/demo',
  },
];

export function ProcreateLanding() {
  const [filter, setFilter] = useState<'all' | 'studio' | 'capture'>('all');

  const visible =
    filter === 'all'
      ? TILES
      : filter === 'studio'
        ? TILES.filter((t) => ['sessions', 'map', 'loops', 'draw', 'library'].includes(t.id))
        : TILES.filter((t) => ['capture', 'practice', 'share'].includes(t.id));

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-roam-shell text-roam-active">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6">
        <div className="flex items-baseline gap-3">
          <h1
            className="font-display text-[28px] font-bold leading-none tracking-tight text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            ROAM
          </h1>
          <span className="hidden text-[11px] font-medium uppercase tracking-widest text-roam-muted sm:inline">
            Choreography studio
          </span>
        </div>
        <nav className="flex items-center gap-4 md:gap-5">
          <Link
            href="/s/demo"
            className="text-[15px] font-medium text-roam-muted-mid transition-colors hover:text-white"
          >
            Demo
          </Link>
          <Link
            href="/privacy"
            className="hidden text-[15px] font-medium text-roam-muted-mid transition-colors hover:text-white sm:inline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hidden text-[15px] font-medium text-roam-muted-mid transition-colors hover:text-white sm:inline"
          >
            Terms
          </Link>
          <a
            href="mailto:hello@roam.app"
            className="text-[15px] font-medium text-roam-muted-mid transition-colors hover:text-white"
          >
            Contact
          </a>
          <a
            href="mailto:hello@roam.app?subject=Roam%20Android%20preview"
            className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            aria-label="Get the app"
            title="Request Android preview"
          >
            <span className="text-lg leading-none text-white">+</span>
          </a>
        </nav>
      </header>

      <div className="border-b border-white/5 px-4 pb-3 md:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-roam-muted-mid md:text-[15px]">
          Roam remembers so the choreographer doesn&apos;t have to. Capture movement, loop sections,
          and return to your work exactly where you left it — a calm studio tool, not a coach.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['studio', 'Studio'],
              ['capture', 'Capture'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                filter === id
                  ? 'bg-roam-primary/20 text-white ring-1 ring-roam-primary'
                  : 'bg-white/[0.06] text-roam-muted-mid hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-10 pt-4 md:px-6 md:pb-12">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((tile) => {
            const inner = (
              <>
                <div
                  className="relative mb-2 aspect-square overflow-hidden rounded-2xl shadow-tile transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]"
                  style={{ background: tile.background }}
                >
                  {tile.badge ? (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 backdrop-blur-sm">
                      <span className="font-mono text-[10px] text-white">{tile.badge}</span>
                    </div>
                  ) : null}
                  <div className="absolute inset-0 rounded-2xl bg-white/0 transition-colors group-hover:bg-white/5" />
                </div>
                <div className="px-0.5">
                  <p className="truncate text-[13px] font-medium leading-snug text-white/90">
                    {tile.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-roam-muted">{tile.subtitle}</p>
                </div>
              </>
            );

            if (tile.href) {
              return (
                <Link key={tile.id} href={tile.href} className="group cursor-pointer">
                  {inner}
                </Link>
              );
            }

            return (
              <div key={tile.id} className="group cursor-default">
                {inner}
              </div>
            );
          })}

          <a
            href="mailto:hello@roam.app?subject=Roam%20beta"
            className="group cursor-pointer"
          >
            <div
              className="mb-2 flex aspect-square items-center justify-center rounded-2xl border-[1.5px] border-dashed border-white/15 shadow-tile-soft transition-colors group-hover:border-white/25"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-3xl text-white/30 transition-colors group-hover:text-white/50">
                +
              </span>
            </div>
            <div className="px-0.5">
              <p className="text-[13px] font-medium leading-snug text-white/40 transition-colors group-hover:text-white/60">
                Get the app
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-roam-muted">Android preview</p>
            </div>
          </a>
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/5 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-roam-muted">
          <p>© {new Date().getFullYear()} Roam</p>
          <p className="font-mono uppercase tracking-wider">Shows the work — never scores it</p>
        </div>
      </footer>
    </div>
  );
}
