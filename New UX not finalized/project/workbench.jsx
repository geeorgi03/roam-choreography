/* global React, I, Pill, IconBtn, SectionLabel, Waveform, fmtTime, fmtMs, StudioSilhouette */
const uE = React.useEffect;

// ────────────────────────────────────────────────
// WORKBENCH — the main screen choreographers live on.
// Everything important is on one canvas: song, loop, clips, transport.
// No full-screen transitions. Record is an overlay. Save is a drawer.
// ────────────────────────────────────────────────
function Workbench({ state, dispatch }) {
  const { playing, playhead, loopStart, loopEnd, duration, song, clips,
          activeSection, loopCount, loopIdx, takeNum, showClipDetail,
          recording, saving } = state;

  // playhead ticker
  uE(() => {
    if (!playing || recording) return;
    const id = setInterval(() => {
      dispatch({ type: 'tick' });
    }, 60);
    return () => clearInterval(id);
  }, [playing, recording, loopStart, loopEnd]);

  // recording timer
  uE(() => {
    if (!recording) return;
    const start = Date.now();
    const id = setInterval(() => {
      dispatch({ type: 'recTick', t: (Date.now() - start) / 1000 });
    }, 67);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <div style={{
      height: '100%', width: '100%', background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Top bar ───────────────────────────── */}
      <TopBar state={state} dispatch={dispatch}/>

      {/* ── Scrollable main ───────────────────── */}
      <div className="roam-scroll" style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        paddingBottom: 160,
      }}>
        <SongHeader state={state} dispatch={dispatch}/>
        <SectionMap state={state} dispatch={dispatch}/>
        <LoopPanel state={state} dispatch={dispatch}/>
        <ClipsList state={state} dispatch={dispatch}/>
      </div>

      {/* ── Persistent transport ──────────────── */}
      <TransportDock state={state} dispatch={dispatch}/>

      {/* ── Recording overlay ─────────────────── */}
      {recording && <RecordingOverlay state={state} dispatch={dispatch}/>}

      {/* ── Save drawer ───────────────────────── */}
      {saving && <SaveDrawer state={state} dispatch={dispatch}/>}

      {/* ── Clip detail sheet ─────────────────── */}
      {showClipDetail != null && <ClipDetailSheet state={state} dispatch={dispatch}/>}
    </div>
  );
}

// ────────────────────────────────────────────────
// Top bar — session breadcrumb · time · menu
// ────────────────────────────────────────────────
function TopBar({ state, dispatch }) {
  return (
    <div style={{
      padding: '14px 16px 10px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '0.5px solid var(--hair)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <IconBtn icon={<I.fold/>} size={30}/>
        <div style={{ minWidth: 0 }}>
          <div className="mono-xs" style={{ color: 'var(--text-4)', marginBottom: 1 }}>
            Session · 03
          </div>
          <div style={{
            fontFamily: 'var(--f-serif)', fontSize: 17, lineHeight: 1,
            letterSpacing: -0.1, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 200,
          }}>
            Heavy arms, <span style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>light feet.</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Pill tone="ghost" size="xs" icon={<I.clock size={10}/>}>47:12</Pill>
        <IconBtn icon={<I.share/>} size={30}/>
        <IconBtn icon={<I.more/>} size={30}/>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Song header — album art, title, source badge
// ────────────────────────────────────────────────
function SongHeader({ state, dispatch }) {
  return (
    <div style={{ padding: '14px 16px 8px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <AlbumArt/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono-xs" style={{ color: 'var(--accent)', marginBottom: 3 }}>
          <span style={{
            display: 'inline-block', width: 5, height: 5, borderRadius: 999,
            background: 'var(--accent)', marginRight: 6, verticalAlign: 'middle',
          }}/>
          Spotify · synced
        </div>
        <div style={{
          fontFamily: 'var(--f-serif)', fontSize: 21, lineHeight: 1.1,
          letterSpacing: -0.2, color: 'var(--text)',
        }}>{state.song.title}</div>
        <div style={{
          fontSize: 12, color: 'var(--text-3)', marginTop: 2,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <span>{state.song.artist}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="mono" style={{ fontSize: 11 }}>{state.song.bpm} BPM</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span className="mono" style={{ fontSize: 11 }}>{state.song.key}</span>
        </div>
      </div>
    </div>
  );
}

function AlbumArt() {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 6, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #3a2f24 0%, #1a1612 100%)',
      border: '0.5px solid var(--hair-2)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(135deg, transparent 0 5px, rgba(244,235,214,0.04) 5px 6px)',
      }}/>
      <div style={{
        position: 'absolute', bottom: 6, right: 7,
        fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 13,
        color: 'rgba(244,235,214,0.4)',
      }}>A.</div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Section map — the song as a colored strip
// ────────────────────────────────────────────────
function SectionMap({ state, dispatch }) {
  const { song, playhead, duration, activeSection } = state;
  const sections = song.sections;
  const php = (playhead / duration) * 100;

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <SectionLabel right="3:42 total">Song map</SectionLabel>
      <div style={{
        display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden',
        border: '0.5px solid var(--hair-2)', position: 'relative',
        background: 'var(--surface)',
      }}>
        {sections.map((s, i) => {
          const isActive = activeSection === i;
          const tone = s.tone;
          const bg = {
            sage: 'rgba(143,168,142,0.18)',
            accent: 'rgba(224,110,63,0.18)',
            gold: 'rgba(201,164,107,0.16)',
            plum: 'rgba(154,111,132,0.16)',
            ghost: 'rgba(244,235,214,0.06)',
          }[tone];
          const fg = {
            sage: 'var(--sage)', accent: 'var(--accent)',
            gold: 'var(--gold)', plum: 'var(--plum)',
            ghost: 'var(--text-3)',
          }[tone];
          return (
            <button key={i}
              onClick={() => dispatch({ type: 'jumpSection', i })}
              style={{
                flex: s.end - s.start,
                background: isActive ? fg : bg,
                color: isActive ? 'var(--bg)' : fg,
                border: 'none', padding: '0 7px',
                borderRight: i < sections.length - 1 ? '0.5px solid var(--bg)' : 'none',
                display: 'flex', alignItems: 'center',
                fontFamily: 'var(--f-mono)', fontSize: 9.5, letterSpacing: 0.8,
                textTransform: 'uppercase', fontWeight: 600,
                minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}>
              {s.label}
            </button>
          );
        })}
        <div style={{
          position: 'absolute', top: -2, bottom: -2, left: `${php}%`,
          width: 1, background: 'var(--text)', pointerEvents: 'none',
        }}/>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Loop panel — waveform, in/out, loop count, tempo
// ────────────────────────────────────────────────
function LoopPanel({ state, dispatch }) {
  const { playhead, loopStart, loopEnd, duration, loopCount, loopIdx, song } = state;
  const loopLenSec = loopEnd - loopStart;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <SectionLabel right={<span>{loopIdx + 1} / {loopCount} loops</span>}>Loop · verse</SectionLabel>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-m)',
        border: '0.5px solid var(--hair)', padding: 12,
      }}>
        <Waveform
          playhead={playhead}
          loopStart={loopStart} loopEnd={loopEnd}
          duration={duration}
          height={56}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 10,
        }}>
          <TimeChip label="in" value={fmtTime(loopStart)}/>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span className="mono-sm" style={{ color: 'var(--text-3)' }}>
              {fmtTime(loopLenSec)}
            </span>
            <span style={{ color: 'var(--text-4)' }}>·</span>
            <span className="mono-sm" style={{ color: 'var(--text-3)' }}>
              {Math.round(loopLenSec / (60 / song.bpm))} bars
            </span>
          </div>
          <TimeChip label="out" value={fmtTime(loopEnd)}/>
        </div>

        {/* loop dots */}
        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '0.5px solid var(--hair)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({length: loopCount}).map((_, i) => (
              <div key={i} style={{
                width: i <= loopIdx ? 22 : 8, height: 3, borderRadius: 2,
                background: i < loopIdx ? 'var(--accent)' : i === loopIdx ? 'var(--accent)' : 'var(--hair-2)',
                transition: 'width 0.3s ease',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Pill tone="ghost" size="xs" onClick={() => dispatch({type: 'loopCount', v: Math.max(1, loopCount - 1)})}>−</Pill>
            <Pill tone="ghost" size="xs">{loopCount}×</Pill>
            <Pill tone="ghost" size="xs" onClick={() => dispatch({type: 'loopCount', v: loopCount + 1})}>+</Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeChip({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="mono-xs" style={{ color: 'var(--text-4)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, color: 'var(--text)', letterSpacing: 0.4 }}>
        {value}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────
// Clips list — takes captured in this session
// ────────────────────────────────────────────────
function ClipsList({ state, dispatch }) {
  const { clips } = state;
  return (
    <div style={{ padding: '18px 16px 0' }}>
      <SectionLabel right={<span>{clips.length} clips · this session</span>}>Takes</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {clips.map((c, i) => (
          <ClipRow key={c.id} clip={c} dispatch={dispatch} idx={i}/>
        ))}
      </div>
    </div>
  );
}

function ClipRow({ clip, dispatch, idx }) {
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'openClip', i: idx })}
      style={{
        background: clip.keeper ? 'var(--surface-2)' : 'var(--surface)',
        border: `0.5px solid ${clip.keeper ? 'var(--hair-strong)' : 'var(--hair)'}`,
        borderRadius: 'var(--r-m)',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', width: '100%', textAlign: 'left',
        color: 'inherit',
      }}>
      {/* thumb */}
      <div style={{
        width: 46, height: 46, borderRadius: 6, flexShrink: 0,
        background: '#0a0907', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
          <StudioSilhouette opacity={0.4}/>
        </div>
        <div style={{
          position: 'absolute', bottom: 3, right: 3,
          fontFamily: 'var(--f-mono)', fontSize: 8.5,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          padding: '1px 4px', borderRadius: 2, letterSpacing: 0.3,
        }}>{clip.dur}</div>
      </div>
      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2,
        }}>
          <span className="mono-sm" style={{ color: 'var(--text)', fontWeight: 600 }}>
            T{String(clip.take).padStart(2,'0')}
          </span>
          <span className="mono-xs" style={{ color: 'var(--text-4)' }}>·</span>
          <span className="mono-xs" style={{ color: 'var(--text-3)' }}>
            {clip.section} · {clip.timestamp}
          </span>
          {clip.loops && (
            <>
              <span className="mono-xs" style={{ color: 'var(--text-4)' }}>·</span>
              <span className="mono-xs" style={{ color: 'var(--text-3)' }}>×{clip.loops}</span>
            </>
          )}
        </div>
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {clip.tags.map(t => (
            <span key={t} className="mono-xs" style={{
              color: 'var(--text-2)',
              background: 'var(--surface-3)',
              padding: '2px 6px', borderRadius: 3,
            }}>{t}</span>
          ))}
          {clip.note && (
            <span style={{
              fontFamily: 'var(--f-serif)', fontStyle: 'italic',
              fontSize: 12, color: 'var(--text-3)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 160,
            }}>"{clip.note}"</span>
          )}
        </div>
      </div>
      {/* dots */}
      <div style={{ display: 'flex', gap: 2 }}>
        {clip.keeper && <div style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--accent)' }}/>}
      </div>
    </button>
  );
}

Object.assign(window, {
  Workbench, TopBar, SongHeader, SectionMap, LoopPanel, ClipsList,
});
