/* global React, I, Pill, IconBtn, SectionLabel, StudioSilhouette */

// ────────────────────────────────────────────────
// Session library — past sessions with this song + all sessions
// Opened from top bar
// ────────────────────────────────────────────────
function SessionLibrary({ onClose }) {
  const [tab, setTab] = React.useState('this');
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,12,10,0.5)',
        backdropFilter: 'blur(4px)', zIndex: 90 }} onClick={onClose}/>
      <div className="roam-scroll" style={{
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 91,
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '14px 16px 10px', borderBottom: '0.5px solid var(--hair)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="mono-xs" style={{ color: 'var(--text-4)', marginBottom: 2 }}>Library</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 20, letterSpacing: -0.2 }}>
              Sessions
            </div>
          </div>
          <IconBtn icon={<I.x/>} onClick={onClose}/>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: '0.5px solid var(--hair)' }}>
          <Pill tone={tab === 'this' ? 'ink' : 'ghost'} size="sm" onClick={() => setTab('this')}>
            This song · 4
          </Pill>
          <Pill tone={tab === 'all' ? 'ink' : 'ghost'} size="sm" onClick={() => setTab('all')}>
            All · 27
          </Pill>
          <Pill tone={tab === 'fav' ? 'ink' : 'ghost'} size="sm" onClick={() => setTab('fav')}>
            Keepers
          </Pill>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {MOCK_SESSIONS.map((s, i) => (
            <SessionRow key={i} s={s} current={i === 0}/>
          ))}
        </div>
      </div>
    </>
  );
}

const MOCK_SESSIONS = [
  { date: 'Today', time: '4:20p', title: 'Heavy arms, light feet.', dur: '47:12', clips: 12, keepers: 3, active: true },
  { date: 'Yesterday', time: '10:14a', title: 'Running the bridge.', dur: '28:04', clips: 8, keepers: 2 },
  { date: 'Mar 14', time: '6:02p', title: 'Duet rehearsal w/ Mara.', dur: '1:12:40', clips: 21, keepers: 5 },
  { date: 'Mar 10', time: '8:45a', title: 'First pass, just shapes.', dur: '19:30', clips: 4, keepers: 1 },
];

function SessionRow({ s, current }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '0.5px solid var(--hair)',
      alignItems: 'center', cursor: 'pointer',
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 6, overflow: 'hidden',
        position: 'relative', background: '#0a0907', flexShrink: 0 }}>
        <StudioSilhouette opacity={0.45}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono-xs" style={{ color: current ? 'var(--accent)' : 'var(--text-4)', marginBottom: 2 }}>
          {current && <span style={{ marginRight: 6 }}>●</span>}
          {s.date} · {s.time}
        </div>
        <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 15,
          color: 'var(--text)', letterSpacing: -0.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.title}
        </div>
        <div style={{ marginTop: 3, display: 'flex', gap: 8,
          fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--text-3)',
          letterSpacing: 0.05 }}>
          <span>{s.dur}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{s.clips} clips</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{s.keepers} keepers</span>
        </div>
      </div>
      <I.chev size={14} c="var(--text-4)"/>
    </div>
  );
}

Object.assign(window, { SessionLibrary });
