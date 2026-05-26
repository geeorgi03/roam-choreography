import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ClipRow } from '../database';
import { useSessionContext } from './SessionContext';

export type CanvasMode = 'video' | 'practice' | 'draw' | 'compose';
export type FloatingPanelId = 'sections' | 'lyrics' | 'takes' | 'drawTools' | null;

type ChoreographyWorkbenchContextValue = {
  canvasMode: CanvasMode;
  setCanvasMode: (mode: CanvasMode) => void;
  floatingPanel: FloatingPanelId;
  togglePanel: (id: Exclude<FloatingPanelId, null>) => void;
  closePanel: () => void;
  mirror: boolean;
  setMirror: (v: boolean) => void;
  canvasClip: ClipRow | null;
  setCanvasClip: (clip: ClipRow | null) => void;
  loupe: { x: number; y: number } | null;
  setLoupe: (p: { x: number; y: number } | null) => void;
};

const ChoreographyWorkbenchContext = createContext<ChoreographyWorkbenchContextValue | null>(
  null
);

export function ChoreographyWorkbenchProvider({ children }: { children: React.ReactNode }) {
  const { clips, activeSection } = useSessionContext();
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('video');
  const [floatingPanel, setFloatingPanel] = useState<FloatingPanelId>(null);
  const [mirror, setMirror] = useState(false);
  const [canvasClip, setCanvasClip] = useState<ClipRow | null>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number } | null>(null);

  const sectionClips = useMemo(
    () =>
      clips.filter((c) => {
        if (!c.mux_playback_id) return false;
        const sec = (c as { section?: string }).section;
        if (!activeSection || activeSection === 'Section') return true;
        return sec === activeSection || !sec;
      }),
    [clips, activeSection]
  );

  useEffect(() => {
    if (canvasClip && sectionClips.some((c) => c.local_id === canvasClip.local_id)) return;
    const preferred =
      sectionClips.find((c) => c.clip_type !== 'REF') ?? sectionClips[0] ?? null;
    setCanvasClip(preferred);
  }, [sectionClips, canvasClip]);

  const togglePanel = useCallback((id: Exclude<FloatingPanelId, null>) => {
    setFloatingPanel((prev) => (prev === id ? null : id));
  }, []);

  const closePanel = useCallback(() => setFloatingPanel(null), []);

  const value = useMemo(
    () => ({
      canvasMode,
      setCanvasMode,
      floatingPanel,
      togglePanel,
      closePanel,
      mirror,
      setMirror,
      canvasClip,
      setCanvasClip,
      loupe,
      setLoupe,
    }),
    [
      canvasMode,
      floatingPanel,
      togglePanel,
      closePanel,
      mirror,
      canvasClip,
      loupe,
    ]
  );

  return (
    <ChoreographyWorkbenchContext.Provider value={value}>
      {children}
    </ChoreographyWorkbenchContext.Provider>
  );
}

export function useChoreographyWorkbench() {
  const ctx = useContext(ChoreographyWorkbenchContext);
  if (!ctx) {
    throw new Error('useChoreographyWorkbench must be used within ChoreographyWorkbenchProvider');
  }
  return ctx;
}
