/* global React, I, Pill, IconBtn, SectionLabel, Waveform, fmtTime, fmtMs, StudioSilhouette */

// ────────────────────────────────────────────────
// Persistent transport dock — always present
// ────────────────────────────────────────────────
function TransportDock({ state, dispatch }) {
  const { playing, playhead, duration, song, recording } = state;
  const php = (playhead / duration) * 100;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'rgba(20,18,15,0.88)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderTop: '0.5px solid var(--hair-2)',
      padding: '10px 14px 12px',
      zIndex: 30,
    }}>
      {/* mini progress */}
      <div style={{ height: 2, background: 'var(--hair)', borderRadius: 2, position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${php}%`,
          background: 'var(--accent)', borderRadius: 2 }}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* time */}
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', width: 40 }}>
          {fmtTime(playhead)}
        </span>
        {/* transport */}
        <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <IconBtn icon={<I.skipB size={15}/>} onClick={() => dispatch({type: 'jumpLoop', v: 'start'})}/>
          <button onClick={() => dispatch({type: 'togglePlay'})} style={{
            width: 40, height: 40, borderRadius: 999, border: 'none',
            background: 'var(--text)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            {playing ? <I.pause size={16}/> : <I.play c="var(--bg)" size={16}/>}
          </button>
          <IconBtn icon={<I.loop size={15}/>} active onClick={() => {}}/>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', width: 40, textAlign: 'right' }}>
          -{fmtTime(duration - playhead)}
        </span>
        {/* REC */}
        <button onClick={() => dispatch({type: 'startRec'})} style={{
          marginLeft: 6, height: 40, padding: '0 14px', borderRadius: 999, border: 'none',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(224,110,63,0.35)',
          fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: 0.1,
          fontWeight: 600, textTransform: 'uppercase',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: '#fff' }}/>
          Rec
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Recording overlay — full-screen but workbench alive underneath
// ────────────────────────────────────────────────
function RecordingOverlay({ state, dispatch }) {
  const { recT = 0, loopCount, loopIdx, song } = state;
  const beatsPerBar = 4;
  const secPerBeat = 60 / song.bpm;
  const currentBeat = Math.floor(recT / secPerBeat) % beatsPerBar;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#000', display: 'flex', flexDirection: 'column',
    }}>
      {/* camera feed */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <StudioSilhouette opacity={0.6}/>
      </div>

      {/* HUD — top */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '14px 16px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{
          background: 'rgba(14,12,10,0.7)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(244,235,214,0.15)',
          borderRadius: 10, padding: '8px 12px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: 0.14,
            color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700,
            marginBottom: 4,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)',
              animation: 'recPulse 1s infinite' }}/>
            Capturing
          </div>
          <div className="mono" style={{ fontSize: 22, color: '#fff', letterSpacing: 0.5 }}>
            {fmtMs(recT)}
          </div>
          <div className="mono-xs" style={{ color: 'rgba(244,235,214,0.45)', marginTop: 2 }}>
            verse · take {state.takeNum.toString().padStart(2,'0')}
          </div>
        </div>
        <button onClick={() => dispatch({type: 'cancelRec'})} style={{
          background: 'rgba(14,12,10,0.7)', backdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(244,235,214,0.15)', borderRadius: 10,
          padding: 10, cursor: 'pointer', color: '#fff',
        }}><I.x size={16} c="#fff"/></button>
      </div>

      {/* Loop progress ribbon */}
      <div style={{ position: 'relative', zIndex: 2, padding: '6px 16px' }}>
        <div style={{
          background: 'rgba(14,12,10,0.7)', backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(244,235,214,0.15)',
          borderRadius: 10, padding: '10px 12px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--f-mono)', fontSize: 9.5, letterSpacing: 0.12,
            color: 'rgba(244,235,214,0.5)', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            <span>Loop {loopIdx + 1} / {loopCount}</span>
            <span>{song.bpm} bpm</span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({length: loopCount * 4}).map((_, i) => {
              const bar = Math.floor(i / 4);
              const beat = i % 4;
              const past = bar < loopIdx || (bar === loopIdx && beat < currentBeat);
              const cur = bar === loopIdx && beat === currentBeat;
              const isBarStart = beat === 0;
              return (
                <div key={i} style={{
                  flex: 1,
                  height: cur ? 18 : isBarStart ? 13 : 8,
                  borderRadius: 2,
                  background: cur ? 'var(--accent)' : past ? 'rgba(244,235,214,0.6)' : 'rgba(244,235,214,0.12)',
                  transition: 'height 0.1s, background 0.1s',
                }}/>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid overlay */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: '20px' }}>
          {[33, 66].map(p => (
            <React.Fragment key={'h'+p}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`,
                height: 0.5, background: 'rgba(244,235,214,0.12)' }}/>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`,
                width: 0.5, background: 'rgba(244,235,214,0.12)' }}/>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '20px 24px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'rgba(14,12,10,0.7)', backdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(244,235,214,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
        }}><I.flip c="#fff"/></div>

        <button onClick={() => dispatch({type: 'stopRec'})} style={{
          width: 76, height: 76, borderRadius: 999, border: 'none',
          background: '#fff', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 4px rgba(255,255,255,0.12), 0 0 28px rgba(224,110,63,0.4)',
        }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--accent)' }}/>
        </button>

        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'rgba(14,12,10,0.7)', backdropFilter: 'blur(14px)',
          border: '0.5px solid rgba(244,235,214,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
        }}><I.grid c="#fff"/></div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Save drawer — inline, not full-screen
// Two paths: keep here (assign to section + tag) or send to inbox
// ────────────────────────────────────────────────
function SaveDrawer({ state, dispatch }) {
  const { pendingClip } = state;
  const [section, setSection] = React.useState('verse');
  const [tags, setTags] = React.useState(['heavy', 'floorwork']);
  const [note, setNote] = React.useState('');
  const [keeper, setKeeper] = React.useState(false);

  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(14,12,10,0.5)',
        backdropFilter: 'blur(4px)', zIndex: 90,
      }} onClick={() => dispatch({type: 'discardPending'})}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 91,
        background: 'var(--bg-2)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        border: '0.5px solid var(--hair-2)', borderBottom: 'none',
        padding: '12px 16px 24px',
        maxHeight: '78%', overflowY: 'auto',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }} className="roam-scroll">
        {/* grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hair-2)' }}/>
        </div>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, flexShrink: 0,
            background: '#0a0907', position: 'relative', overflow: 'hidden',
          }}>
            <StudioSilhouette opacity={0.5}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="9" viewBox="0 0 8 9"><path d="M1 1l6 3.5L1 8z" fill="#111"/></svg>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono-xs" style={{ color: 'var(--text-4)', marginBottom: 2 }}>
              Take {pendingClip.take} · {pendingClip.dur} · {pendingClip.loops} loops
            </div>
            <div style={{
              fontFamily: 'var(--f-serif)', fontSize: 19, lineHeight: 1.1,
              color: 'var(--text)', letterSpacing: -0.1,
            }}>Keep this one?</div>
          </div>
          <IconBtn icon={<I.x/>} onClick={() => dispatch({type: 'discardPending'})}/>
        </div>

        {/* Section assign */}
        <Field label="Section" value={section} onValue={setSection}
          options={[
            { v: 'intro', label: 'intro' },
            { v: 'verse', label: 'verse' },
            { v: 'chorus', label: 'chorus' },
            { v: 'bridge', label: 'bridge' },
            { v: 'outro', label: 'outro' },
          ]}/>

        <Field label="Tags" multi value={tags} onValue={setTags}
          options={[
            { v: 'floorwork', label: 'floorwork' },
            { v: 'duet', label: 'duet' },
            { v: 'heavy', label: 'heavy' },
            { v: 'release', label: 'release' },
            { v: 'rough', label: 'rough' },
            { v: 'keeper', label: 'keeper' },
            { v: '+', label: '＋ new' },
          ]}/>

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Note</SectionLabel>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-m)',
            border: '0.5px solid var(--hair)', padding: '10px 12px',
          }}>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Lift on the 3. Don't rush the turn."
              style={{
                width: '100%', border: 'none', outline: 'none',
                background: 'transparent', color: 'var(--text)',
                fontFamily: 'var(--f-serif)', fontSize: 15, fontStyle: 'italic',
                padding: 0,
              }}/>
          </div>
        </div>

        {/* Keeper */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: 'var(--surface)',
          borderRadius: 'var(--r-m)', border: '0.5px solid var(--hair)',
          marginBottom: 18, cursor: 'pointer',
        }} onClick={() => setKeeper(k => !k)}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 1 }}>Mark as keeper</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Pins to top of session</div>
          </div>
          <div style={{
            width: 36, height: 20, borderRadius: 999,
            background: keeper ? 'var(--accent)' : 'var(--hair-strong)',
            position: 'relative', transition: 'background 0.15s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: keeper ? 18 : 2,
              width: 16, height: 16, borderRadius: 999, background: '#fff',
              transition: 'left 0.15s',
            }}/>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => dispatch({type: 'sendInbox'})} style={{
            flex: 1, height: 44, borderRadius: 10,
            background: 'transparent', border: '0.5px solid var(--hair-strong)',
            color: 'var(--text)', cursor: 'pointer',
            fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: 0.12,
            textTransform: 'uppercase', fontWeight: 600,
          }}>→ Inbox</button>
          <button onClick={() => dispatch({type: 'saveClip', section, tags, note, keeper})} style={{
            flex: 1.5, height: 44, borderRadius: 10,
            background: 'var(--accent)', border: 'none', color: '#fff',
            cursor: 'pointer',
            fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: 0.12,
            textTransform: 'uppercase', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(224,110,63,0.3)',
          }}>
            <I.check size={14} c="#fff"/> Save to session
          </button>
        </div>
      </div>
    </>
  );
}

// Field — label + chip row (single or multi select)
function Field({ label, value, onValue, options, multi }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(o => {
          const selected = multi ? value.includes(o.v) : value === o.v;
          return (
            <button key={o.v}
              onClick={() => {
                if (multi) {
                  onValue(selected ? value.filter(v => v !== o.v) : [...value, o.v]);
                } else onValue(o.v);
              }}
              style={{
                padding: '6px 11px', borderRadius: 7,
                background: selected ? 'var(--text)' : 'var(--surface)',
                color: selected ? 'var(--bg)' : 'var(--text-2)',
                border: `0.5px solid ${selected ? 'transparent' : 'var(--hair)'}`,
                fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: 0.04,
                fontWeight: selected ? 700 : 500, textTransform: 'lowercase',
                cursor: 'pointer',
              }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Clip detail sheet — review take, with loop comparison
// ────────────────────────────────────────────────
function ClipDetailSheet({ state, dispatch }) {
  const clip = state.clips[state.showClipDetail];
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(14,12,10,0.6)',
        backdropFilter: 'blur(4px)', zIndex: 90,
      }} onClick={() => dispatch({type: 'closeClip'})}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 91,
        background: 'var(--bg-2)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        border: '0.5px solid var(--hair-2)', borderBottom: 'none',
        padding: '12px 16px 24px', maxHeight: '82%', overflowY: 'auto',
      }} className="roam-scroll">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hair-2)' }}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 12 }}>
          <div>
            <div className="mono-xs" style={{ color: 'var(--text-4)', marginBottom: 2 }}>
              Take {String(clip.take).padStart(2,'0')} · {clip.timestamp}
            </div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 22, lineHeight: 1,
              color: 'var(--text)', letterSpacing: -0.2 }}>
              {clip.section}
              {clip.note && <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}> · "{clip.note}"</span>}
            </div>
          </div>
          <IconBtn icon={<I.x/>} onClick={() => dispatch({type: 'closeClip'})}/>
        </div>

        {/* video */}
        <div style={{
          aspectRatio: '9/11', background: '#0a0907', borderRadius: 12,
          position: 'relative', overflow: 'hidden', marginBottom: 14,
        }}>
          <StudioSilhouette opacity={0.6}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 999,
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="22" viewBox="0 0 20 22"><path d="M2 2l16 9-16 9z" fill="#111"/></svg>
            </div>
          </div>
          {/* overlay scrub */}
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono-sm" style={{ color: '#fff' }}>0:00</span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}>
              <div style={{ width: '0%', height: '100%', background: 'var(--accent)', borderRadius: 2 }}/>
            </div>
            <span className="mono-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{clip.dur}</span>
          </div>
          {/* loop markers on video */}
          <div style={{ position: 'absolute', top: 12, right: 12,
            display: 'flex', gap: 3 }}>
            {Array.from({length: clip.loops || 4}).map((_, i) => (
              <div key={i} style={{
                width: 14, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.5)',
              }}/>
            ))}
          </div>
        </div>

        {/* tags & meta */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {clip.tags.map(t => (
            <Pill key={t} tone="solid" size="sm">{t}</Pill>
          ))}
          <Pill tone="ghost" size="sm" icon={<I.plus size={10}/>}>tag</Pill>
        </div>

        {/* actions row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6,
          padding: '10px 0', borderTop: '0.5px solid var(--hair)',
          borderBottom: '0.5px solid var(--hair)', marginBottom: 14,
        }}>
          <MiniAction icon={<I.loop/>} label="Loop"/>
          <MiniAction icon={<I.scissors/>} label="Trim"/>
          <MiniAction icon={<I.share/>} label="Share"/>
          <MiniAction icon={<I.bookmark/>} label="Keep"/>
        </div>

        {/* comparison row */}
        <SectionLabel right="3 in section">Other takes · verse</SectionLabel>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              width: 78, flexShrink: 0, borderRadius: 6,
              overflow: 'hidden', position: 'relative',
              border: i === 2 ? '1.5px solid var(--accent)' : '0.5px solid var(--hair)',
              aspectRatio: '9/11',
              background: '#0a0907',
            }}>
              <StudioSilhouette opacity={0.5}/>
              <div style={{ position: 'absolute', bottom: 4, left: 4,
                fontFamily: 'var(--f-mono)', fontSize: 9, color: '#fff',
                background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 2 }}>
                T0{i}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MiniAction({ icon, label }) {
  return (
    <button style={{
      padding: '10px 4px', borderRadius: 8, border: 'none',
      background: 'var(--surface)', color: 'var(--text-2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      cursor: 'pointer',
    }}>
      {icon}
      <span className="mono-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
    </button>
  );
}

Object.assign(window, { TransportDock, RecordingOverlay, SaveDrawer, ClipDetailSheet });
