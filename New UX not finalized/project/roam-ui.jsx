/* global React */

// ────────────────────────────────────────────────
// Icon set — linework, 1.6px, consistent
// ────────────────────────────────────────────────
const I = (() => {
  const s = (d, sw = 1.6, size = 16) => ({ c, size: sz = size } = {}) =>
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d={d} stroke={c || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
  return {
    play:  s('M7 5v14l12-7z', 1.6),
    pause: (props = {}) => <svg width={props.size||16} height={props.size||16} viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="0.6" fill={props.c||'currentColor'}/><rect x="13.5" y="5" width="3.5" height="14" rx="0.6" fill={props.c||'currentColor'}/></svg>,
    skipB: s('M6 4v16M20 5L9 12l11 7V5z'),
    skipF: s('M18 4v16M4 5l11 7-11 7V5z'),
    loop:  s('M17 2l4 4-4 4M3 13v-1a4 4 0 014-4h14M7 22l-4-4 4-4M21 11v1a4 4 0 01-4 4H3'),
    mic:   s('M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3'),
    cam:   s('M3 8h4l2-3h6l2 3h4v12H3V8zM12 17a4 4 0 100-8 4 4 0 000 8z'),
    more:  (props = {}) => <svg width={props.size||16} height={props.size||16} viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill={props.c||'currentColor'}/><circle cx="12" cy="12" r="1.6" fill={props.c||'currentColor'}/><circle cx="19" cy="12" r="1.6" fill={props.c||'currentColor'}/></svg>,
    chev:  s('M9 6l6 6-6 6'),
    chevD: s('M6 9l6 6 6-6'),
    chevU: s('M6 15l6-6 6 6'),
    x:     s('M6 6l12 12M18 6L6 18'),
    check: s('M5 12l5 5 9-11'),
    plus:  s('M12 5v14M5 12h14'),
    flip:  s('M4 12a8 8 0 0114-5l3-2v6h-6M20 12a8 8 0 01-14 5l-3 2v-6h6'),
    grid:  s('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'),
    tag:   s('M3 12V4h8l10 10-8 8L3 12zM8 8l.01 0'),
    fold:  s('M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z'),
    music: s('M9 18V5l11-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM20 16a3 3 0 11-3-3 3 3 0 013 3z'),
    search: s('M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-3.5-3.5'),
    sliders: s('M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M18 18h2M16 4v4M8 10v4M16 16v4'),
    share: s('M18 8a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM8.5 10.5l7-4M8.5 13.5l7 4'),
    clock: s('M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2'),
    bookmark: s('M6 3h12v18l-6-4-6 4V3z'),
    hand: s('M8 11V5a2 2 0 014 0v6M12 11V4a2 2 0 014 0v7M16 11V6a2 2 0 014 0v10a6 6 0 01-6 6h-2a6 6 0 01-6-6v-1l-2-3a2 2 0 013-3l2 2'),
    trash: s('M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14'),
    scissors: s('M6 3L18 21M18 3L6 21M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6z'),
    waveIcon: s('M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0'),
    arrowR: s('M5 12h14M13 6l6 6-6 6'),
    arrowDown: s('M12 5v14M5 12l7 7 7-7'),
    folder2: s('M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'),
    plusBig: s('M12 4v16M4 12h16', 2),
    grip: (props={}) => <svg width={props.size||12} height={props.size||12} viewBox="0 0 12 12"><circle cx="3" cy="3" r="1" fill={props.c||'currentColor'}/><circle cx="9" cy="3" r="1" fill={props.c||'currentColor'}/><circle cx="3" cy="6" r="1" fill={props.c||'currentColor'}/><circle cx="9" cy="6" r="1" fill={props.c||'currentColor'}/><circle cx="3" cy="9" r="1" fill={props.c||'currentColor'}/><circle cx="9" cy="9" r="1" fill={props.c||'currentColor'}/></svg>,
  };
})();

// ────────────────────────────────────────────────
// Pill — compact, tool-grade
// ────────────────────────────────────────────────
function Pill({ children, tone = 'ghost', size = 'sm', onClick, style = {}, active, icon }) {
  const tones = {
    ghost:   { bg: 'transparent', fg: 'var(--text-2)', bd: 'var(--hair-2)' },
    solid:   { bg: 'var(--surface-3)', fg: 'var(--text)', bd: 'transparent' },
    ink:     { bg: 'var(--text)', fg: 'var(--bg)', bd: 'transparent' },
    accent:  { bg: 'var(--accent)', fg: '#fff', bd: 'transparent' },
    soft:    { bg: 'var(--accent-soft)', fg: 'var(--accent)', bd: 'transparent' },
    sage:    { bg: 'rgba(143,168,142,0.15)', fg: 'var(--sage)', bd: 'transparent' },
    gold:    { bg: 'rgba(201,164,107,0.14)', fg: 'var(--gold)', bd: 'transparent' },
    plum:    { bg: 'rgba(154,111,132,0.15)', fg: 'var(--plum)', bd: 'transparent' },
  };
  const t = tones[tone];
  const sizes = {
    xs: { h: 18, px: 7,  fs: 9.5 },
    sm: { h: 22, px: 9,  fs: 10 },
    md: { h: 28, px: 12, fs: 11 },
  };
  const sz = sizes[size];
  return (
    <button type="button" onClick={onClick} style={{
      height: sz.h, padding: `0 ${sz.px}px`,
      background: active ? 'var(--accent)' : t.bg,
      color: active ? '#fff' : t.fg,
      border: `1px solid ${active ? 'transparent' : t.bd}`,
      borderRadius: 999,
      cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'var(--f-mono)', fontSize: sz.fs,
      fontWeight: 500, letterSpacing: 0.06, textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      lineHeight: 1, whiteSpace: 'nowrap', ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// ────────────────────────────────────────────────
// IconBtn — square
// ────────────────────────────────────────────────
function IconBtn({ icon, onClick, active, size = 32, tone = 'ghost' }) {
  const bg = active ? 'var(--accent-soft)' : tone === 'filled' ? 'var(--surface-2)' : 'transparent';
  const fg = active ? 'var(--accent)' : 'var(--text-2)';
  return (
    <button type="button" onClick={onClick} style={{
      width: size, height: size, borderRadius: 8,
      background: bg, border: 'none', color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0, transition: 'background 0.12s',
    }}>{icon}</button>
  );
}

// ────────────────────────────────────────────────
// Section label (for data grouping)
// ────────────────────────────────────────────────
function SectionLabel({ children, right, style }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '0 4px 6px', ...style,
    }}>
      <div className="mono-xs" style={{ color: 'var(--text-4)' }}>{children}</div>
      {right && <div className="mono-xs" style={{ color: 'var(--text-3)' }}>{right}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────
// Waveform — SVG, deterministic
// ────────────────────────────────────────────────
function Waveform({ bars = 140, height = 52, playhead = 0, loopStart, loopEnd, duration = 222, onChangeLoop, dense = false }) {
  // loopStart/End in seconds
  const lp = loopStart != null ? (loopStart / duration) * 100 : null;
  const rp = loopEnd != null ? (loopEnd / duration) * 100 : null;
  const php = (playhead / duration) * 100;
  const color = 'var(--text-2)';

  const rects = React.useMemo(() => {
    return Array.from({length: bars}, (_, i) => {
      const t = i / bars;
      const h = 4 + Math.abs(Math.sin(i * 0.63) * 18 + Math.cos(i * 0.27) * 12 + Math.sin(i * 0.15) * 8);
      return { x: t * 100, h: Math.min(h, height * 0.9) };
    });
  }, [bars, height]);

  return (
    <div style={{ position: 'relative', height, width: '100%', userSelect: 'none' }}>
      <svg width="100%" height={height} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        {rects.map((r, i) => {
          const inLoop = lp != null && r.x >= lp && r.x <= rp;
          const past = r.x <= php;
          const fill = inLoop ? 'var(--accent)' : past ? 'var(--text-2)' : 'var(--text-4)';
          return (
            <rect key={i} x={`${r.x}%`} y={height/2 - r.h/2}
                  width={dense ? 0.5 : 0.9} height={r.h}
                  rx={0.3} fill={fill} style={{ opacity: inLoop ? 0.95 : past ? 0.6 : 0.35 }}/>
          );
        })}
      </svg>
      {lp != null && (
        <>
          {/* loop region */}
          <div style={{
            position: 'absolute', left: `${lp}%`, width: `${rp - lp}%`,
            top: -2, bottom: -2,
            background: 'var(--accent-soft)',
            borderLeft: '1.5px solid var(--accent)',
            borderRight: '1.5px solid var(--accent)',
            pointerEvents: 'none',
          }}/>
          {/* handles */}
          <div style={{ position: 'absolute', left: `${lp}%`, top: -6, width: 8, height: 8, borderRadius: 2,
            background: 'var(--accent)', transform: 'translateX(-4px)' }}/>
          <div style={{ position: 'absolute', left: `${rp}%`, bottom: -6, width: 8, height: 8, borderRadius: 2,
            background: 'var(--accent)', transform: 'translateX(-4px)' }}/>
        </>
      )}
      {/* playhead */}
      <div style={{
        position: 'absolute', left: `${php}%`, top: -4, bottom: -4,
        width: 1, background: 'var(--text)', transform: 'translateX(-0.5px)',
      }}>
        <div style={{ position: 'absolute', top: -3, left: -3, width: 7, height: 7, borderRadius: 999,
          background: 'var(--text)' }}/>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Timecode helpers
// ────────────────────────────────────────────────
function fmtTime(s) {
  if (s == null) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2,'0')}`;
}
function fmtMs(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${ms}`;
}

// ────────────────────────────────────────────────
// Studio silhouette — shared placeholder
// ────────────────────────────────────────────────
function StudioSilhouette({ opacity = 0.55 }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="studioRad" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#3a2d24" stopOpacity="1"/>
          <stop offset="70%" stopColor="#14120F" stopOpacity="1"/>
        </radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#studioRad)"/>
      <line x1="0" y1="330" x2="300" y2="330" stroke="rgba(224,110,63,0.2)" strokeWidth="0.5"/>
      <g opacity="0.1" stroke="rgba(244,235,214,0.4)" strokeWidth="0.5">
        <line x1="40"  y1="330" x2="0"   y2="400"/>
        <line x1="100" y1="330" x2="80"  y2="400"/>
        <line x1="160" y1="330" x2="160" y2="400"/>
        <line x1="220" y1="330" x2="240" y2="400"/>
        <line x1="280" y1="330" x2="320" y2="400"/>
      </g>
      <g transform="translate(150 250)" stroke={`rgba(244,235,214,${opacity})`} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <circle cx="0" cy="-78" r="13" fill={`rgba(244,235,214,${opacity * 0.75})`} stroke="none"/>
        <path d="M-4 -63 Q0 -32 -28 -8"/>
        <path d="M5 -63 Q22 -42 48 -58"/>
        <path d="M0 -63 L-4 22"/>
        <path d="M-4 22 L-32 74"/>
        <path d="M-4 22 L24 74"/>
      </g>
    </svg>
  );
}

Object.assign(window, {
  I, Pill, IconBtn, SectionLabel, Waveform, fmtTime, fmtMs, StudioSilhouette,
});
