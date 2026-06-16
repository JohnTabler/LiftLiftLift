// components/MobilityLogger.jsx
// Mobility session logger: body-part filter, hold/rep tracking, sides, rest timer

// ── Helpers ───────────────────────────────────────────────────
var formatTimerDisplay = function(secs) {
  var m = Math.floor(Math.abs(secs) / 60);
  var s = Math.abs(secs) % 60;
  var sign = secs < 0 ? '-' : '';
  if (m > 0) return sign + m + ':' + (s < 10 ? '0' : '') + s;
  return sign + s + 's';
};

var formatDurationMob = function(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
};

var TYPE_COLORS = {
  'Static Stretch':  { bg: 'rgba(0,229,195,0.1)',  border: '#00e5c3', text: '#00e5c3'  },
  'Dynamic Stretch': { bg: 'rgba(136,153,255,0.1)', border: '#8899ff', text: '#8899ff' },
  'Foam Roll':       { bg: 'rgba(245,158,11,0.1)',  border: '#f59e0b', text: '#f59e0b' },
  'Joint Mobility':  { bg: 'rgba(52,211,153,0.1)',  border: '#34d399', text: '#34d399' },
  'PNF':             { bg: 'rgba(255,92,92,0.1)',   border: '#ff5c5c', text: '#ff5c5c' },
  'Yoga':            { bg: 'rgba(167,139,250,0.1)', border: '#a78bfa', text: '#a78bfa' },
};

var typeStyle = function(type) {
  return TYPE_COLORS[type] || { bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', text: 'var(--text-muted)' };
};

// ── Mobility Rest Timer ───────────────────────────────────────
var MobilityRestTimer = function(props) {
  var moveName  = props.moveName;
  var totalSecs = props.totalSecs;
  var onDone    = props.onDone;
  var onSkip    = props.onSkip;

  var _r = React.useState(totalSecs); var remaining = _r[0]; var setRemaining = _r[1];
  var _e = React.useState(false);     var ended     = _e[0]; var setEnded     = _e[1];

  React.useEffect(function() {
    if (remaining <= 0 && !ended) {
      setEnded(true);
      try {
        var ctx  = new (window.AudioContext || window.webkitAudioContext)();
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      } catch(e) {}
      setTimeout(onDone, 1500);
      return;
    }
    var t = setTimeout(function() { setRemaining(function(r){ return r - 1; }); }, 1000);
    return function(){ clearTimeout(t); };
  }, [remaining, ended]);

  var SIZE = 100; var R = 42;
  var CIRC = 2 * Math.PI * R;
  var prog = ended ? 1 : Math.max(0, 1 - remaining / totalSecs);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: 'var(--surface)',
      borderTop: '2px solid #8899ff',
      padding: '16px 24px 24px',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Rest · {moveName}
      </div>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                  stroke={ended ? '#34d399' : '#8899ff'}
                  strokeWidth="5"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - CIRC * prog}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
          color: ended ? '#34d399' : 'var(--text)',
        }}>
          {ended ? '✓' : formatTimerDisplay(remaining)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={function(){ setRemaining(function(r){ return Math.max(0, r - 15); }); }}>−15s</button>
        <button className="btn btn-ghost btn-sm" onClick={function(){ setRemaining(function(r){ return r + 15; }); }}>+15s</button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} onClick={onSkip}>Skip</button>
      </div>
    </div>
  );
};

// ── Add Movement Modal ────────────────────────────────────────
var AddMovementModal = function(props) {
  var movements  = props.movements;
  var onAdd      = props.onAdd;
  var onClose    = props.onClose;

  var BODY_PARTS = ['All', 'Hips', 'Hamstrings', 'Quadriceps', 'Calves & Ankles',
                    'Thoracic Spine', 'Shoulders', 'Neck', 'Wrists & Forearms',
                    'Glutes', 'Lower Back', 'Full Body'];
  var TYPES = ['All', 'Static Stretch', 'Dynamic Stretch', 'Foam Roll', 'Joint Mobility', 'PNF', 'Yoga'];

  var _bp = React.useState('All'); var bodyPart = _bp[0]; var setBodyPart = _bp[1];
  var _tp = React.useState('All'); var typeFilter = _tp[0]; var setTypeFilter = _tp[1];
  var _sr = React.useState('');    var search = _sr[0];   var setSearch    = _sr[1];

  var filtered = movements.filter(function(m) {
    var matchPart   = bodyPart    === 'All' || m.bodyPart === bodyPart;
    var matchType   = typeFilter  === 'All' || m.type     === typeFilter;
    var matchSearch = !search     || m.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    return matchPart && matchType && matchSearch;
  });

  return (
    <div className="modal-overlay" onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="modal-title" style={{ margin: 0 }}>Add Movement</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Body part filter */}
        <div className="chip-bar" style={{ marginBottom: 8 }}>
          {BODY_PARTS.map(function(bp) {
            return (
              <button key={bp} className={'chip ' + (bodyPart === bp ? 'active' : '')}
                      onClick={function(){ setBodyPart(bp); }} style={{ fontSize: 11 }}>
                {bp}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="chip-bar" style={{ marginBottom: 10 }}>
          {TYPES.map(function(t) {
            var ts = typeStyle(t);
            return (
              <button key={t}
                      onClick={function(){ setTypeFilter(t); }}
                      style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer',
                        background: typeFilter === t ? ts.bg : 'transparent',
                        border: '1px solid ' + (typeFilter === t ? ts.border : 'var(--border)'),
                        color: typeFilter === t ? ts.text : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="search-bar-wrap" style={{ marginBottom: 10 }}>
          <span className="search-icon">⌕</span>
          <input className="input" placeholder="Search movements…"
                 value={search} onChange={function(e){ setSearch(e.target.value); }} />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          {filtered.length} movement{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Movement list */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div className="empty-state"><p>No movements match your filters</p></div>
          ) : (
            filtered.map(function(m) {
              var ts = typeStyle(m.type);
              return (
                <div key={m.id} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderLeft: '3px solid ' + ts.border,
                  borderRadius: 8, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className="tag tag-primary" style={{ fontSize: 10 }}>{m.bodyPart}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: ts.bg, border: '1px solid ' + ts.border, color: ts.text,
                      }}>{m.type}</span>
                      {m.sides && <span className="tag tag-secondary" style={{ fontSize: 10 }}>Both sides</span>}
                      {m.defaultHold && (
                        <span className="tag tag-secondary" style={{ fontSize: 10 }}>Hold {m.defaultHold}s</span>
                      )}
                      {m.defaultReps && (
                        <span className="tag tag-secondary" style={{ fontSize: 10 }}>{m.defaultReps} reps</span>
                      )}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{m.description}</div>
                    )}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}
                          onClick={function(){ onAdd(m); }}>
                    + Add
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ── Movement Row ──────────────────────────────────────────────
var MovementRow = function(props) {
  var mov       = props.mov;
  var idx       = props.idx;
  var onUpdate  = props.onUpdate;
  var onRemove  = props.onRemove;
  var onComplete = props.onComplete;

  var ts = typeStyle(mov.type);
  var isHold    = mov.trackMode === 'hold';
  var isReps    = mov.trackMode === 'reps';

  var handleSideToggle = function(side) {
    onUpdate(idx, 'side', side);
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid ' + ts.border,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: mov.completed ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px',
        background: ts.bg,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{mov.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
            background: ts.bg, border: '1px solid ' + ts.border, color: ts.text,
          }}>{mov.type}</span>
          <span className="tag tag-primary" style={{ fontSize: 10 }}>{mov.bodyPart}</span>
        </div>
        <button style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 18, cursor: 'pointer', padding: '0 4px',
        }} onClick={function(){ onRemove(idx); }}>×</button>
      </div>

      {/* Controls */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Track mode toggle */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="label" style={{ marginBottom: 0 }}>Track by:</span>
          <button
            className={'chip ' + (isHold ? 'active' : '')}
            onClick={function(){ onUpdate(idx, 'trackMode', 'hold'); }}
            style={{ fontSize: 11 }}>
            ⏱ Hold (secs)
          </button>
          <button
            className={'chip ' + (isReps ? 'active' : '')}
            onClick={function(){ onUpdate(idx, 'trackMode', 'reps'); }}
            style={{ fontSize: 11 }}>
            🔄 Reps
          </button>
        </div>

        {/* Duration / reps input */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {isHold ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-muted text-sm">Hold:</span>
              <input
                className="input" type="number" min="5" step="5"
                value={mov.holdSeconds}
                disabled={mov.completed}
                onChange={function(e){ onUpdate(idx, 'holdSeconds', parseInt(e.target.value)||0); }}
                style={{ width: 72, textAlign: 'center', padding: '6px 8px' }}
              />
              <span className="text-muted text-sm">sec</span>
              {/* Quick presets */}
              {[20,30,45,60,90].map(function(p) {
                return (
                  <button key={p}
                          className={'chip ' + (mov.holdSeconds === p ? 'active' : '')}
                          style={{ fontSize: 10, padding: '2px 8px' }}
                          disabled={mov.completed}
                          onClick={function(){ onUpdate(idx, 'holdSeconds', p); }}>
                    {p}s
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="text-muted text-sm">Reps:</span>
              <input
                className="input" type="number" min="1"
                value={mov.reps}
                disabled={mov.completed}
                onChange={function(e){ onUpdate(idx, 'reps', parseInt(e.target.value)||0); }}
                style={{ width: 72, textAlign: 'center', padding: '6px 8px' }}
              />
            </div>
          )}
        </div>

        {/* Sides selector */}
        {mov.hasSides && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="label" style={{ marginBottom: 0 }}>Side:</span>
            {['left','right','both'].map(function(s) {
              return (
                <button key={s}
                        className={'chip ' + (mov.side === s ? 'active' : '')}
                        style={{ fontSize: 11, textTransform: 'capitalize' }}
                        disabled={mov.completed}
                        onClick={function(){ handleSideToggle(s); }}>
                  {s === 'left' ? '← Left' : s === 'right' ? 'Right →' : '↔ Both'}
                </button>
              );
            })}
          </div>
        )}

        {/* Notes */}
        <input
          className="input"
          placeholder="Notes (optional)…"
          value={mov.notes}
          disabled={mov.completed}
          onChange={function(e){ onUpdate(idx, 'notes', e.target.value); }}
          style={{ fontSize: 13, padding: '6px 10px' }}
        />

        {/* Complete button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={function(){ onComplete(idx); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 8, border: '2px solid',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              transition: 'all 0.15s',
              borderColor: mov.completed ? 'var(--accent)' : 'var(--border)',
              background:  mov.completed ? 'var(--accent)' : 'transparent',
              color:       mov.completed ? '#0f1117' : 'var(--text-muted)',
            }}>
            {mov.completed ? '✓ Done' : 'Mark Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main MobilityLogger ───────────────────────────────────────
var MobilityLogger = function(props) {
  var onSave = props.onSave;

  var _sn  = React.useState('Mobility Session'); var sessionName = _sn[0]; var setSessionName = _sn[1];
  var _mv  = React.useState([]);                 var movements   = _mv[0]; var setMovements   = _mv[1];
  var _all = React.useState([]);                 var allMoves    = _all[0]; var setAllMoves    = _all[1];
  var _sh  = React.useState(false);              var showAdd     = _sh[0]; var setShowAdd     = _sh[1];
  var _rt  = React.useState(null);               var restTimer   = _rt[0]; var setRestTimer   = _rt[1];
  var _du  = React.useState(0);                  var duration    = _du[0]; var setDuration    = _du[1];
  var _st  = React.useState(null);               var startTime   = _st[0]; var setStartTime   = _st[1];
  var _sv  = React.useState(false);              var saving      = _sv[0]; var setSaving      = _sv[1];
  var _dn  = React.useState(false);              var done        = _dn[0]; var setDone        = _dn[1];

  // Load mobility database
  React.useEffect(function() {
    fetch('data/mobility.json')
      .then(function(r){ return r.json(); })
      .then(setAllMoves)
      .catch(function(){ console.error('Could not load mobility.json'); });
  }, []);

  // Session clock
  React.useEffect(function() {
    if (!startTime) return;
    var t = setInterval(function() {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return function(){ clearInterval(t); };
  }, [startTime]);

  var ensureStarted = function() {
    if (!startTime) setStartTime(Date.now());
  };

  // Add movement from modal
  var handleAddMovement = function(m) {
    ensureStarted();
    var isHoldDefault = m.defaultHold != null;
    setMovements(function(prev) {
      return prev.concat([{
        id:          m.id,
        name:        m.name,
        bodyPart:    m.bodyPart,
        type:        m.type,
        hasSides:    m.sides || false,
        trackMode:   isHoldDefault ? 'hold' : 'reps',
        holdSeconds: m.defaultHold  || 30,
        reps:        m.defaultReps  || 10,
        side:        m.sides ? 'both' : null,
        notes:       '',
        completed:   false,
      }]);
    });
  };

  // Update a field on a movement
  var handleUpdate = function(idx, field, value) {
    setMovements(function(prev) {
      return prev.map(function(m, i) {
        if (i !== idx) return m;
        return Object.assign({}, m, { [field]: value });
      });
    });
  };

  // Remove movement
  var handleRemove = function(idx) {
    setMovements(function(prev) { return prev.filter(function(_, i){ return i !== idx; }); });
  };

  // Complete a movement → trigger rest timer
  var handleComplete = function(idx) {
    var mov = movements[idx];
    var nowDone = !mov.completed;
    handleUpdate(idx, 'completed', nowDone);
    if (nowDone) {
      setRestTimer({ moveName: mov.name, totalSecs: 20 });
    }
  };

  // Finish session
  var handleFinish = function() {
    setSaving(true);
    var session = {
      name:      sessionName,
      date:      new Date().toISOString(),
      duration:  duration,
      movements: movements.map(function(m) {
        return {
          id:          m.id,
          name:        m.name,
          bodyPart:    m.bodyPart,
          type:        m.type,
          trackMode:   m.trackMode,
          holdSeconds: m.trackMode === 'hold' ? m.holdSeconds : null,
          reps:        m.trackMode === 'reps' ? m.reps : null,
          side:        m.side,
          notes:       m.notes,
          completed:   m.completed,
        };
      }),
    };
    Promise.resolve(onSave(session)).then(function() {
      setSaving(false);
      setDone(true);
      setMovements([]);
      setDuration(0);
      setStartTime(null);
      setSessionName('Mobility Session');
    });
  };

  // ── Summary stats ────────────────────────────────────────
  var completedCount = movements.filter(function(m){ return m.completed; }).length;
  var totalCount     = movements.length;
  var bodyPartCounts = React.useMemo(function() {
    var counts = {};
    movements.forEach(function(m) {
      counts[m.bodyPart] = (counts[m.bodyPart] || 0) + 1;
    });
    return counts;
  }, [movements]);

  // ── Done screen ──────────────────────────────────────────
  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🧘</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#8899ff', marginBottom: 8 }}>
          Session Complete!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Great mobility work. Session saved to history.
        </p>
        <button className="btn btn-primary" onClick={function(){ setDone(false); }}>
          Start Another Session
        </button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <div style={{ paddingBottom: restTimer ? 180 : 0 }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <input
            className="input"
            value={sessionName}
            onChange={function(e){ setSessionName(e.target.value); }}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              background: 'transparent', border: 'none', padding: 0,
              color: 'var(--text)', minWidth: 220,
            }}
          />
          <div style={{ marginTop: 4, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#8899ff', fontWeight: 600 }}>
              {formatDurationMob(duration)}
            </span>
            {totalCount > 0 && (
              <span className="text-muted text-sm">
                {completedCount}/{totalCount} done
              </span>
            )}
            {/* Body parts in session */}
            {Object.keys(bodyPartCounts).map(function(bp) {
              return (
                <span key={bp} className="tag tag-primary" style={{ fontSize: 10 }}>{bp}</span>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={function(){ setShowAdd(true); }}>
            + Add Movement
          </button>
          {movements.length > 0 && (
            <button className="btn btn-primary" onClick={handleFinish} disabled={saving}
                    style={{ background: '#8899ff', color: '#0f1117' }}>
              {saving ? 'Saving…' : 'Finish Session'}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: (completedCount / totalCount * 100) + '%',
              background: '#8899ff',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 4 }}>
            {completedCount} of {totalCount} movements completed
          </div>
        </div>
      )}

      {/* Movements list */}
      {movements.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">🧘</div>
          <h3>No movements yet</h3>
          <p>Tap "Add Movement" to build your mobility session</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {movements.map(function(mov, idx) {
            return (
              <MovementRow
                key={idx}
                mov={mov}
                idx={idx}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onComplete={handleComplete}
              />
            );
          })}

          <button className="btn btn-ghost w-full" style={{ marginTop: 8 }}
                  onClick={function(){ setShowAdd(true); }}>
            + Add Another Movement
          </button>
        </div>
      )}

      {/* Add movement modal */}
      {showAdd && (
        <AddMovementModal
          movements={allMoves}
          onAdd={function(m){ handleAddMovement(m); setShowAdd(false); }}
          onClose={function(){ setShowAdd(false); }}
        />
      )}

      {/* Rest timer */}
      {restTimer && (
        <MobilityRestTimer
          moveName={restTimer.moveName}
          totalSecs={restTimer.totalSecs}
          onDone={function(){ setRestTimer(null); }}
          onSkip={function(){ setRestTimer(null); }}
        />
      )}
    </div>
  );
};

window.MobilityLogger = MobilityLogger;
