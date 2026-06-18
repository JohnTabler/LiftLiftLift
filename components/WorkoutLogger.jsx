// components/WorkoutLogger.jsx
// Hevy-style workout logger: exercises, sets, rest timer, supersets

// ── Helpers ───────────────────────────────────────────────────
var SUPERSET_COLORS = ['#00e5c3','#8899ff','#f59e0b','#ff5c5c','#a78bfa','#34d399'];

var formatTime = function(secs) {
  var m = Math.floor(Math.abs(secs) / 60);
  var s = Math.abs(secs) % 60;
  var sign = secs < 0 ? '-' : '';
  return sign + (m > 0 ? m + ':' + (s < 10 ? '0' : '') + s : s + 's');
};

var formatDuration = function(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  var s = secs % 60;
  if (h > 0) return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
};

var makeId = function() {
  return Math.random().toString(36).slice(2, 8);
};

// ── Rest Timer Overlay ────────────────────────────────────────
var RestTimer = function(props) {
  var exerciseName = props.exerciseName;
  var totalSecs    = props.totalSecs;
  var onDone       = props.onDone;
  var onSkip       = props.onSkip;

  var _r = React.useState(totalSecs); var remaining = _r[0]; var setRemaining = _r[1];
  var _a = React.useState(false);     var ended     = _a[0]; var setEnded     = _a[1];

  React.useEffect(function() {
    if (remaining <= 0 && !ended) {
      setEnded(true);
      // Beep
      try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } catch(e) {}
      setTimeout(onDone, 1500);
      return;
    }
    var t = setTimeout(function() { setRemaining(function(r){ return r - 1; }); }, 1000);
    return function() { clearTimeout(t); };
  }, [remaining, ended]);

  // SVG arc progress
  var SIZE    = 120;
  var RADIUS  = 50;
  var CIRC    = 2 * Math.PI * RADIUS;
  var progress = ended ? 1 : Math.max(0, 1 - remaining / totalSecs);
  var dash     = CIRC * progress;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: 'var(--surface)',
      borderTop: '2px solid var(--accent)',
      padding: '20px 24px 28px',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Rest · {exerciseName}
      </div>

      {/* Arc timer */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
                  fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS}
                  fill="none"
                  stroke={ended ? '#34d399' : 'var(--accent)'}
                  strokeWidth="6"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - dash}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
          color: ended ? '#34d399' : 'var(--text)',
        }}>
          {ended ? '✓' : formatTime(remaining)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm"
                onClick={function(){ setRemaining(function(r){ return Math.max(0, r - 15); }); }}>
          −15s
        </button>
        <button className="btn btn-ghost btn-sm"
                onClick={function(){ setRemaining(function(r){ return r + 15; }); }}>
          +15s
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onSkip}
                style={{ color: 'var(--text-muted)' }}>
          Skip
        </button>
      </div>
    </div>
  );
};

// ── Add Exercise Modal ────────────────────────────────────────
var AddExerciseModal = function(props) {
  var onAdd   = props.onAdd;
  var onClose = props.onClose;

  return (
    <div className="modal-overlay" onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>Add Exercise</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <ExerciseBrowser onAdd={function(ex){ onAdd(ex); onClose(); }} addLabel="+ Add" compact={false} />
        </div>
      </div>
    </div>
  );
};

// ── Rest Timer Edit Popover ───────────────────────────────────
var RestEditPopover = function(props) {
  var current  = props.current;
  var onChange = props.onChange;
  var onClose  = props.onClose;

  var PRESETS = [30, 60, 90, 120, 180, 240];
  var _v = React.useState(current); var val = _v[0]; var setVal = _v[1];

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 200,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 14, minWidth: 200,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div className="label" style={{ marginBottom: 8 }}>Rest Duration</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {PRESETS.map(function(p) {
          return (
            <button key={p}
                    className={'chip ' + (val === p ? 'active' : '')}
                    onClick={function(){ setVal(p); }}>
              {formatTime(p)}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" type="number" value={val}
               onChange={function(e){ setVal(parseInt(e.target.value)||0); }}
               style={{ width: 80 }} />
        <span style={{ lineHeight: '36px', color: 'var(--text-muted)', fontSize: 12 }}>sec</span>
        <button className="btn btn-primary btn-sm"
                onClick={function(){ onChange(val); onClose(); }}>
          Set
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

// ── Single Exercise Block ─────────────────────────────────────
var ExerciseBlock = function(props) {
  var ex             = props.ex;
  var exIdx          = props.exIdx;
  var supersetColor  = props.supersetColor || null;
  var supersetLabel  = props.supersetLabel || null;
  var isLinkingFrom  = props.isLinkingFrom;
  var canLink        = props.canLink;
  var onCompleteSet  = props.onCompleteSet;
  var onAddSet       = props.onAddSet;
  var onUpdateSet    = props.onUpdateSet;
  var onRemoveSet    = props.onRemoveSet;
  var onRemoveEx     = props.onRemoveEx;
  var onRestChange   = props.onRestChange;
  var onStartLink    = props.onStartLink;
  var onFinishLink   = props.onFinishLink;
  var onCancelLink   = props.onCancelLink;
  var onUnlink       = props.onUnlink;

  var _p = React.useState(false); var showRest = _p[0]; var setShowRest = _p[1];

  var borderStyle = supersetColor
    ? '3px solid ' + supersetColor
    : '1px solid var(--border)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: borderStyle,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 2,
    }}>
      {/* Exercise header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px',
        background: supersetColor ? supersetColor + '12' : 'transparent',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {supersetLabel && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 99, border: '1px solid ' + supersetColor,
              color: supersetColor, letterSpacing: '0.5px',
            }}>
              {supersetLabel}
            </span>
          )}
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            {ex.name}
          </span>
          <span className="tag tag-primary" style={{ fontSize: 10 }}>{ex.primaryMuscle}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Rest timer button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={function(){ setShowRest(function(s){ return !s; }); }}
              style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⏱ {formatTime(ex.restSeconds || 90)}
            </button>
            {showRest && (
              <RestEditPopover
                current={ex.restSeconds || 90}
                onChange={function(v){ onRestChange(exIdx, v); }}
                onClose={function(){ setShowRest(false); }}
              />
            )}
          </div>
          <button className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: 18, padding: '2px 6px' }}
                  onClick={function(){ onRemoveEx(exIdx); }}
                  title="Remove exercise">
            ×
          </button>
        </div>
      </div>

      {/* Sets table */}
      <div style={{ padding: '10px 14px' }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 36px',
          gap: 6, marginBottom: 6, paddingBottom: 6,
          borderBottom: '1px solid var(--border)',
        }}>
          <span className="label">SET</span>
          <span className="label">WEIGHT</span>
          <span className="label">REPS</span>
          <span className="label">TYPE</span>
          <span className="label" style={{ textAlign: 'center' }}>✓</span>
        </div>

        {/* Set rows */}
        {ex.sets.map(function(set, sIdx) {
          return (
            <div key={sIdx} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 36px',
              gap: 6, marginBottom: 6, alignItems: 'center',
              opacity: set.completed ? 0.55 : 1,
            }}>
              {/* Set number */}
              <span style={{
                fontWeight: 700, fontSize: 13,
                color: set.completed ? 'var(--accent)' : 'var(--text-muted)',
                textAlign: 'center',
              }}>
                {sIdx + 1}
              </span>

              {/* Weight */}
              <input
                className="input"
                type="number"
                step="2.5"
                placeholder="lbs"
                value={set.weight}
                disabled={set.completed}
                onChange={function(e){ onUpdateSet(exIdx, sIdx, 'weight', e.target.value); }}
                style={{ textAlign: 'center', padding: '6px 8px' }}
              />

              {/* Reps */}
              <input
                className="input"
                type="number"
                placeholder="reps"
                value={set.reps}
                disabled={set.completed}
                onChange={function(e){ onUpdateSet(exIdx, sIdx, 'reps', e.target.value); }}
                style={{ textAlign: 'center', padding: '6px 8px' }}
              />

              {/* Type */}
              <select
                className="input"
                value={set.type}
                disabled={set.completed}
                onChange={function(e){ onUpdateSet(exIdx, sIdx, 'type', e.target.value); }}
                style={{ padding: '6px 8px', cursor: 'pointer' }}>
                <option value="normal">Normal</option>
                <option value="warmup">Warm-up</option>
                <option value="dropset">Drop Set</option>
                <option value="failure">To Failure</option>
              </select>

              {/* Complete checkbox */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={function(){ onCompleteSet(exIdx, sIdx); }}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '2px solid ' + (set.completed ? 'var(--accent)' : 'var(--border)'),
                    background: set.completed ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: set.completed ? '#0f1117' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}>
                  ✓
                </button>
              </div>
            </div>
          );
        })}

        {/* Add set / remove last */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={function(){ onAddSet(exIdx); }}>
            + Add Set
          </button>
          {ex.sets.length > 1 && (
            <button className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={function(){ onRemoveSet(exIdx); }}>
              − Remove Last
            </button>
          )}
        </div>
      </div>

      {/* Superset controls */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {ex.supersetId ? (
          <button className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: 11 }}
                  onClick={function(){ onUnlink(exIdx); }}>
            Unlink Superset
          </button>
        ) : isLinkingFrom ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>Linking from above — tap an exercise to pair it</span>
            <button className="btn btn-ghost btn-sm" onClick={onCancelLink}>Cancel</button>
          </div>
        ) : canLink ? (
          <button className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, color: 'var(--accent)' }}
                  onClick={function(){ onFinishLink(exIdx); }}>
            ⟵ Pair with exercise above as Superset
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={function(){ onStartLink(exIdx); }}>
            + Link as Superset
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main WorkoutLogger ────────────────────────────────────────
var WorkoutLogger = function(props) {
  var onSave  = props.onSave;

  var _wn = React.useState('My Workout');   var workoutName = _wn[0]; var setWorkoutName = _wn[1];
  var _ex = React.useState([]);             var exercises   = _ex[0]; var setExercises   = _ex[1];
  var _sh = React.useState(false);          var showAdd     = _sh[0]; var setShowAdd     = _sh[1];
  var _rt = React.useState(null);           var restTimer   = _rt[0]; var setRestTimer   = _rt[1];
  var _du = React.useState(0);              var duration    = _du[0]; var setDuration    = _du[1];
  var _st = React.useState(null);           var startTime   = _st[0]; var setStartTime   = _st[1];
  var _lf = React.useState(null);           var linkingFrom = _lf[0]; var setLinkingFrom = _lf[1];
  var _sv = React.useState(false);          var saving      = _sv[0]; var setSaving      = _sv[1];
  var _dn = React.useState(false);          var done        = _dn[0]; var setDone        = _dn[1];
  var _sp = React.useState({ lastMeal: '', preWorkout: false, postProtein: '' });
  var supplements = _sp[0]; var setSupplements = _sp[1];
  var _so = React.useState(false);          var suppOpen    = _so[0]; var setSuppOpen    = _so[1];

  // Workout clock
  React.useEffect(function() {
    if (!startTime) return;
    var t = setInterval(function() {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return function(){ clearInterval(t); };
  }, [startTime]);

  // Auto-start clock on first exercise added
  var ensureStarted = function() {
    if (!startTime) setStartTime(Date.now());
  };

  // Add exercise from browser
  var handleAddExercise = function(ex) {
    ensureStarted();
    setExercises(function(prev) {
      return prev.concat([{
        id:          ex.id,
        name:        ex.name,
        primaryMuscle: ex.primaryMuscle,
        equipment:   ex.equipment,
        restSeconds: 90,
        supersetId:  null,
        sets: [{ weight: '', reps: '', type: 'normal', completed: false }],
      }]);
    });
  };

  // Set operations
  var handleAddSet = function(exIdx) {
    setExercises(function(prev) {
      var next = prev.map(function(e,i) {
        if (i !== exIdx) return e;
        var lastSet = e.sets[e.sets.length - 1];
        return Object.assign({}, e, {
          sets: e.sets.concat([{
            weight: lastSet.weight,
            reps:   lastSet.reps,
            type:   lastSet.type,
            completed: false,
          }]),
        });
      });
      return next;
    });
  };

  var handleRemoveSet = function(exIdx) {
    setExercises(function(prev) {
      return prev.map(function(e,i) {
        if (i !== exIdx || e.sets.length <= 1) return e;
        return Object.assign({}, e, { sets: e.sets.slice(0, -1) });
      });
    });
  };

  var handleUpdateSet = function(exIdx, sIdx, field, value) {
    setExercises(function(prev) {
      return prev.map(function(e,i) {
        if (i !== exIdx) return e;
        var newSets = e.sets.map(function(s, si) {
          if (si !== sIdx) return s;
          return Object.assign({}, s, { [field]: value });
        });
        return Object.assign({}, e, { sets: newSets });
      });
    });
  };

  var handleCompleteSet = function(exIdx, sIdx) {
    var ex = exercises[exIdx];
    var set = ex.sets[sIdx];
    var nowCompleted = !set.completed;

    setExercises(function(prev) {
      return prev.map(function(e,i) {
        if (i !== exIdx) return e;
        return Object.assign({}, e, {
          sets: e.sets.map(function(s, si) {
            if (si !== sIdx) return s;
            return Object.assign({}, s, { completed: nowCompleted });
          }),
        });
      });
    });

    if (nowCompleted) {
      setRestTimer({ exerciseName: ex.name, totalSecs: ex.restSeconds || 90 });
    } else {
      setRestTimer(null);
    }
  };

  var handleRemoveExercise = function(exIdx) {
    setExercises(function(prev) { return prev.filter(function(_,i){ return i !== exIdx; }); });
    if (linkingFrom === exIdx) setLinkingFrom(null);
  };

  var handleRestChange = function(exIdx, val) {
    setExercises(function(prev) {
      return prev.map(function(e,i) {
        if (i !== exIdx) return e;
        return Object.assign({}, e, { restSeconds: val });
      });
    });
  };

  // Superset logic
  var handleStartLink = function(exIdx) { setLinkingFrom(exIdx); };
  var handleCancelLink = function()     { setLinkingFrom(null); };

  var handleFinishLink = function(targetIdx) {
    if (linkingFrom === null) return;
    var fromIdx = linkingFrom;
    setLinkingFrom(null);
    setExercises(function(prev) {
      // Find or create a superset ID
      var fromEx   = prev[fromIdx];
      var targetEx = prev[targetIdx];
      var ssId = fromEx.supersetId || targetEx.supersetId || ('ss_' + makeId());
      return prev.map(function(e, i) {
        if (i === fromIdx || i === targetIdx) {
          return Object.assign({}, e, { supersetId: ssId });
        }
        return e;
      });
    });
  };

  var handleUnlink = function(exIdx) {
    setExercises(function(prev) {
      var ssId = prev[exIdx].supersetId;
      // If only 2 in the superset, clear both; else just this one
      var count = prev.filter(function(e){ return e.supersetId === ssId; }).length;
      return prev.map(function(e, i) {
        if (i === exIdx || (count === 2 && e.supersetId === ssId)) {
          return Object.assign({}, e, { supersetId: null });
        }
        return e;
      });
    });
  };

  // Build superset color/label map
  var ssColorMap = React.useMemo(function() {
    var map = {};
    var colorIdx = 0;
    exercises.forEach(function(e) {
      if (e.supersetId && !map[e.supersetId]) {
        map[e.supersetId] = {
          color: SUPERSET_COLORS[colorIdx % SUPERSET_COLORS.length],
          label: 'SUPERSET ' + String.fromCharCode(65 + colorIdx),
        };
        colorIdx++;
      }
    });
    return map;
  }, [exercises]);

  // Finish workout
  var handleFinish = function() {
    var completedAny = exercises.some(function(e) {
      return e.sets.some(function(s){ return s.completed; });
    });
    if (!completedAny && exercises.length === 0) return;
    setSaving(true);
    var session = {
      name:      workoutName,
      date:      new Date().toISOString(),
      duration:  duration,
      supplements: {
        lastMeal:    supplements.lastMeal,
        preWorkout:  supplements.preWorkout,
        postProtein: supplements.postProtein,
      },
      exercises: exercises.map(function(e) {
        return {
          id:          e.id,
          name:        e.name,
          primaryMuscle: e.primaryMuscle,
          supersetId:  e.supersetId,
          restSeconds: e.restSeconds,
          sets: e.sets.filter(function(s){ return s.completed; }).map(function(s) {
            return { weight: parseFloat(s.weight)||0, reps: parseInt(s.reps)||0, type: s.type };
          }),
        };
      }).filter(function(e){ return e.sets.length > 0; }),
    };
    Promise.resolve(onSave(session)).then(function() {
      setSaving(false);
      setDone(true);
      setExercises([]);
      setDuration(0);
      setStartTime(null);
      setWorkoutName('My Workout');
      setSupplements({ lastMeal: '', preWorkout: false, postProtein: '' });
      setSuppOpen(false);
    });
  };

  // ── Render: Done screen ──────────────────────────────────
  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
          Workout Complete!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Great work. Your session has been saved to history.
        </p>
        <button className="btn btn-primary" onClick={function(){ setDone(false); }}>
          Start Another Workout
        </button>
      </div>
    );
  }

  // ── Render: Main logger ──────────────────────────────────
  var completedSets = exercises.reduce(function(acc, e) {
    return acc + e.sets.filter(function(s){ return s.completed; }).length;
  }, 0);

  return (
    <div style={{ paddingBottom: restTimer ? 180 : 0 }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <input
            className="input"
            value={workoutName}
            onChange={function(e){ setWorkoutName(e.target.value); }}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              background: 'transparent', border: 'none', padding: '0',
              color: 'var(--text)', width: 'auto', minWidth: 200,
            }}
          />
          <div style={{ marginTop: 4, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)', fontWeight: 600 }}>
              {formatDuration(duration)}
            </span>
            {completedSets > 0 && (
              <span className="text-muted text-sm">{completedSets} set{completedSets !== 1 ? 's' : ''} done</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={function(){ setShowAdd(true); }}>
            + Add Exercise
          </button>
          {exercises.length > 0 && (
            <button className="btn btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? 'Saving…' : 'Finish Workout'}
            </button>
          )}
        </div>
      </div>

      {/* Supplements & Nutrition */}
      <div style={{
        marginBottom: 20,
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <button
          onClick={function(){ setSuppOpen(function(o){ return !o; }); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--surface2)',
            border: 'none', cursor: 'pointer', color: 'var(--text)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            🥗 Supplements &amp; Nutrition
            {(supplements.lastMeal || supplements.preWorkout || supplements.postProtein) && (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 700,
                background: 'var(--accent)', color: '#0f1117',
                borderRadius: 99, padding: '2px 7px',
              }}>logged</span>
            )}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{suppOpen ? '▲' : '▼'}</span>
        </button>

        {suppOpen && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Last meal */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="label">Last meal eaten and when</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Chicken + rice, 2 hours ago"
                value={supplements.lastMeal}
                onChange={function(e){ setSupplements(function(s){ return Object.assign({}, s, { lastMeal: e.target.value }); }); }}
              />
            </div>

            {/* Pre-workout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="preworkout-check"
                type="checkbox"
                checked={supplements.preWorkout}
                onChange={function(e){ setSupplements(function(s){ return Object.assign({}, s, { preWorkout: e.target.checked }); }); }}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="preworkout-check" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Pre-workout taken?
              </label>
            </div>

            {/* Post-workout protein */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="label">Post-workout protein</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. 40g whey shake"
                value={supplements.postProtein}
                onChange={function(e){ setSupplements(function(s){ return Object.assign({}, s, { postProtein: e.target.value }); }); }}
              />
            </div>

          </div>
        )}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">💪</div>
          <h3>No exercises yet</h3>
          <p>Tap "Add Exercise" to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exercises.map(function(ex, exIdx) {
            var ssInfo  = ex.supersetId ? ssColorMap[ex.supersetId] : null;
            var prevEx  = exIdx > 0 ? exercises[exIdx - 1] : null;
            var isNewSS = ssInfo && (!prevEx || prevEx.supersetId !== ex.supersetId);

            // Spacer between superset groups and standalone exercises
            var showGroupDivider = exIdx > 0 && (
              (prevEx && prevEx.supersetId && ex.supersetId !== prevEx.supersetId) ||
              (prevEx && !prevEx.supersetId && ex.supersetId)
            );

            return (
              <div key={exIdx}>
                {showGroupDivider && <div style={{ height: 12 }} />}

                {/* Superset label banner */}
                {isNewSS && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
                    color: ssInfo.color, marginBottom: 4, paddingLeft: 14,
                  }}>
                    {ssInfo.label}
                  </div>
                )}

                <ExerciseBlock
                  ex={ex}
                  exIdx={exIdx}
                  supersetColor={ssInfo ? ssInfo.color : null}
                  supersetLabel={ssInfo ? ssInfo.label : null}
                  isLinkingFrom={linkingFrom === exIdx}
                  canLink={linkingFrom !== null && linkingFrom !== exIdx && !ex.supersetId}
                  onCompleteSet={handleCompleteSet}
                  onAddSet={handleAddSet}
                  onUpdateSet={handleUpdateSet}
                  onRemoveSet={handleRemoveSet}
                  onRemoveEx={handleRemoveExercise}
                  onRestChange={handleRestChange}
                  onStartLink={handleStartLink}
                  onFinishLink={handleFinishLink}
                  onCancelLink={handleCancelLink}
                  onUnlink={handleUnlink}
                />
              </div>
            );
          })}

          {/* Bottom add */}
          <button className="btn btn-ghost w-full"
                  style={{ marginTop: 12 }}
                  onClick={function(){ setShowAdd(true); }}>
            + Add Another Exercise
          </button>
        </div>
      )}

      {/* Add exercise modal */}
      {showAdd && (
        <AddExerciseModal
          onAdd={handleAddExercise}
          onClose={function(){ setShowAdd(false); }}
        />
      )}

      {/* Rest timer overlay */}
      {restTimer && (
        <RestTimer
          exerciseName={restTimer.exerciseName}
          totalSecs={restTimer.totalSecs}
          onDone={function(){ setRestTimer(null); }}
          onSkip={function(){ setRestTimer(null); }}
        />
      )}
    </div>
  );
};

window.WorkoutLogger = WorkoutLogger;
