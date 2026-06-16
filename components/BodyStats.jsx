// components/BodyStats.jsx

const BodyStats = ({ stats = [], onSave }) => {
  const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = Recharts;

  const [weight, setWeight]   = React.useState('');
  const [bodyFat, setBodyFat] = React.useState('');
  const [notes, setNotes]     = React.useState('');
  const [saving, setSaving]   = React.useState(false);

  const handleSubmit = async () => {
    if (!weight && !bodyFat) return;
    setSaving(true);
    const entry = {
      date:    new Date().toISOString(),
      weight:  weight   ? parseFloat(weight)   : null,
      bodyFat: bodyFat  ? parseFloat(bodyFat)  : null,
      notes,
    };
    await onSave(entry);
    setWeight(''); setBodyFat(''); setNotes('');
    setSaving(false);
  };

  const sorted = [...stats].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted.length ? sorted[sorted.length - 1] : null;

  const chartData = sorted.slice(-60).map(s => ({
    date:    new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight:  s.weight  ? parseFloat(s.weight)  : null,
    bf:      s.bodyFat ? parseFloat(s.bodyFat) : null,
    lean:    s.weight && s.bodyFat
               ? parseFloat((s.weight * (1 - s.bodyFat / 100)).toFixed(1))
               : null,
  }));

  const tooltipStyle = {
    backgroundColor: '#1a1d27',
    border: '1px solid #2e3248',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 12,
  };

  return (
    <div>
      <h2 className="section-heading">Body Stats</h2>

      <div className="stats-layout">
        {/* ── Log form ── */}
        <div className="card card-lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-title">Log Today</div>

          <div className="input-group">
            <label className="label">Weight (lbs)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="e.g. 185.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">Body Fat %</label>
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="e.g. 18.2"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
            />
          </div>

          {/* Lean mass preview */}
          {weight && bodyFat && (
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div className="text-muted text-sm">Estimated Lean Mass</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                {(parseFloat(weight) * (1 - parseFloat(bodyFat) / 100)).toFixed(1)} lbs
              </div>
              <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                Fat: {(parseFloat(weight) * parseFloat(bodyFat) / 100).toFixed(1)} lbs
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              placeholder="e.g. Morning, fasted"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={saving || (!weight && !bodyFat)}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>

        {/* ── Charts + history ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          {latest && (
            <div className="dashboard-grid" style={{ marginBottom: 0 }}>
              {latest.weight && (
                <div className="stat-card">
                  <div className="stat-label">Current Weight</div>
                  <div className="stat-value">{latest.weight} <span>lbs</span></div>
                </div>
              )}
              {latest.bodyFat && (
                <div className="stat-card">
                  <div className="stat-label">Body Fat</div>
                  <div className="stat-value">{latest.bodyFat} <span>%</span></div>
                </div>
              )}
              {latest.weight && latest.bodyFat && (
                <div className="stat-card">
                  <div className="stat-label">Lean Mass</div>
                  <div className="stat-value">
                    {(latest.weight * (1 - latest.bodyFat / 100)).toFixed(1)} <span>lbs</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weight chart */}
          {chartData.filter(d => d.weight).length >= 2 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Weight Trend</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5c3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00e5c3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3248" />
                  <XAxis dataKey="date" tick={{ fill: '#7a80a0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#7a80a0', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} lbs`, 'Weight']} />
                  <Area type="monotone" dataKey="weight" stroke="#00e5c3" strokeWidth={2} fill="url(#wGrad)" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Body fat + lean mass chart */}
          {chartData.filter(d => d.bf).length >= 2 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Body Composition</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5c5c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff5c5c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8899ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8899ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3248" />
                  <XAxis dataKey="date" tick={{ fill: '#7a80a0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#7a80a0', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="bf"   stroke="#ff5c5c" strokeWidth={2} fill="url(#bfGrad)" connectNulls name="Body Fat %" />
                  <Area type="monotone" dataKey="lean" stroke="#8899ff" strokeWidth={2} fill="url(#leanGrad)" connectNulls name="Lean Mass (lbs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History table */}
          {sorted.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Log History</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {[...sorted].reverse().map((s, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span className="text-muted text-sm">
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {s.weight  && <span className="text-sm"><strong style={{ color: 'var(--accent)' }}>{s.weight}</strong> lbs</span>}
                      {s.bodyFat && <span className="text-sm"><strong style={{ color: '#8899ff' }}>{s.bodyFat}</strong> % BF</span>}
                      {s.weight && s.bodyFat && (
                        <span className="text-sm text-muted">
                          {(s.weight * (1 - s.bodyFat / 100)).toFixed(1)} lean
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
