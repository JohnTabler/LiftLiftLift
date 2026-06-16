// components/BodyStats.jsx — uses window.MiniChart

const BodyStats = ({ stats, onSave }) => {
  stats = stats || [];

  const [weight,  setWeight]  = React.useState('');
  const [bodyFat, setBodyFat] = React.useState('');
  const [notes,   setNotes]   = React.useState('');
  const [saving,  setSaving]  = React.useState(false);

  const handleSubmit = function() {
    if (!weight && !bodyFat) return;
    setSaving(true);
    var entry = {
      date:    new Date().toISOString(),
      weight:  weight  ? parseFloat(weight)  : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      notes:   notes,
    };
    Promise.resolve(onSave(entry)).then(function() {
      setWeight(''); setBodyFat(''); setNotes('');
      setSaving(false);
    });
  };

  var sorted  = [...stats].sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
  var latest  = sorted.length ? sorted[sorted.length - 1] : null;

  var chartData = sorted.slice(-60).map(function(s) {
    return {
      date:   new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: s.weight  ? parseFloat(s.weight)  : null,
      bf:     s.bodyFat ? parseFloat(s.bodyFat) : null,
      lean:   s.weight && s.bodyFat
                ? parseFloat((s.weight * (1 - s.bodyFat / 100)).toFixed(1))
                : null,
    };
  });

  var leanMassPreview = weight && bodyFat
    ? (parseFloat(weight) * (1 - parseFloat(bodyFat) / 100)).toFixed(1)
    : null;

  var leanMassCurrent = latest && latest.weight && latest.bodyFat
    ? (latest.weight * (1 - latest.bodyFat / 100)).toFixed(1)
    : null;

  return (
    <div>
      <h2 className="section-heading">Body Stats</h2>

      <div className="stats-layout">
        {/* Log form */}
        <div className="card card-lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-title">Log Today</div>

          <div className="input-group">
            <label className="label">Weight (lbs)</label>
            <input className="input" type="number" step="0.1" placeholder="e.g. 185.5"
                   value={weight} onChange={function(e){ setWeight(e.target.value); }} />
          </div>

          <div className="input-group">
            <label className="label">Body Fat %</label>
            <input className="input" type="number" step="0.1" placeholder="e.g. 18.2"
                   value={bodyFat} onChange={function(e){ setBodyFat(e.target.value); }} />
          </div>

          {leanMassPreview && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div className="text-muted text-sm">Estimated Lean Mass</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                {leanMassPreview} lbs
              </div>
              <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                Fat: {(parseFloat(weight) * parseFloat(bodyFat) / 100).toFixed(1)} lbs
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="e.g. Morning, fasted"
                   value={notes} onChange={function(e){ setNotes(e.target.value); }} />
          </div>

          <button className="btn btn-primary w-full"
                  onClick={handleSubmit}
                  disabled={saving || (!weight && !bodyFat)}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>

        {/* Charts + history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary cards */}
          {latest && (
            <div className="dashboard-grid" style={{ marginBottom: 0 }}>
              {latest.weight ? (
                <div className="stat-card">
                  <div className="stat-label">Current Weight</div>
                  <div className="stat-value">{latest.weight} <span>lbs</span></div>
                </div>
              ) : null}
              {latest.bodyFat ? (
                <div className="stat-card">
                  <div className="stat-label">Body Fat</div>
                  <div className="stat-value">{latest.bodyFat} <span>%</span></div>
                </div>
              ) : null}
              {leanMassCurrent ? (
                <div className="stat-card">
                  <div className="stat-label">Lean Mass</div>
                  <div className="stat-value">{leanMassCurrent} <span>lbs</span></div>
                </div>
              ) : null}
            </div>
          )}

          {/* Weight chart */}
          <div className="card">
            <div className="card-header"><span className="card-title">Weight Trend</span></div>
            <MiniChart data={chartData} dataKey="weight" color="#00e5c3" height={180} unit=" lbs" label="Weight trend" />
          </div>

          {/* Body comp chart */}
          <div className="card">
            <div className="card-header"><span className="card-title">Body Fat %</span></div>
            <MiniChart data={chartData} dataKey="bf" color="#ff5c5c" height={180} unit="%" label="Body fat trend" />
          </div>

          {/* Lean mass chart */}
          <div className="card">
            <div className="card-header"><span className="card-title">Lean Mass</span></div>
            <MiniChart data={chartData} dataKey="lean" color="#8899ff" height={180} unit=" lbs" label="Lean mass trend" />
          </div>

          {/* History log */}
          {sorted.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Log History</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {[...sorted].reverse().map(function(s, i) {
                  var leanVal = s.weight && s.bodyFat
                    ? (s.weight * (1 - s.bodyFat / 100)).toFixed(1)
                    : null;
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span className="text-muted text-sm">
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        {s.weight  ? <span className="text-sm"><strong style={{ color: 'var(--accent)' }}>{s.weight}</strong> lbs</span> : null}
                        {s.bodyFat ? <span className="text-sm"><strong style={{ color: '#8899ff' }}>{s.bodyFat}</strong>% BF</span> : null}
                        {leanVal   ? <span className="text-sm text-muted">{leanVal} lean</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No data yet</h3>
              <p>Log your first entry to start tracking trends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.BodyStats = BodyStats;
