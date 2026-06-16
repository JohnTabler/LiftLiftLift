// components/Dashboard.jsx
// UMD mode: Recharts is on window.Recharts

const Dashboard = ({ history = [], bodyStats = [] }) => {
  const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = window.Recharts;

  const topLifts = React.useMemo(() => {
    const bests = {};
    history.forEach(session => {
      (session.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(set => {
          const w = parseFloat(set.weight);
          if (!w) return;
          if (!bests[ex.name] || w > bests[ex.name]) bests[ex.name] = w;
        });
      });
    });
    return Object.entries(bests).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [history]);

  const weightData = bodyStats
    .filter(s => s.weight)
    .slice(-30)
    .map(s => ({
      date:   new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(s.weight),
    }));

  const compData = bodyStats
    .filter(s => s.bodyFat)
    .slice(-30)
    .map(s => ({
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bf:   parseFloat(s.bodyFat),
    }));

  const latestStat = bodyStats.length ? bodyStats[bodyStats.length - 1] : null;
  const prevStat   = bodyStats.length > 1 ? bodyStats[bodyStats.length - 2] : null;

  const weightChange = latestStat && prevStat && latestStat.weight && prevStat.weight
    ? (parseFloat(latestStat.weight) - parseFloat(prevStat.weight)).toFixed(1)
    : null;

  const tooltipStyle = {
    backgroundColor: '#1a1d27',
    border: '1px solid #2e3248',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 12,
  };

  return (
    <div>
      <h2 className="section-heading">Dashboard</h2>

      {/* Top stats */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Current Weight</div>
          <div className="stat-value">
            {latestStat?.weight ?? '—'}
            {latestStat?.weight && <span>lbs</span>}
          </div>
          {weightChange !== null && (
            <div className={`stat-change ${weightChange > 0 ? 'pos' : 'neg'}`}>
              {weightChange > 0 ? '▲' : '▼'} {Math.abs(weightChange)} lbs
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Body Fat</div>
          <div className="stat-value">
            {latestStat?.bodyFat ?? '—'}
            {latestStat?.bodyFat && <span>%</span>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Lean Mass</div>
          <div className="stat-value">
            {latestStat?.weight && latestStat?.bodyFat
              ? (parseFloat(latestStat.weight) * (1 - parseFloat(latestStat.bodyFat) / 100)).toFixed(1)
              : '—'}
            {latestStat?.weight && latestStat?.bodyFat && <span>lbs</span>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Workouts Logged</div>
          <div className="stat-value">{history.length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weight</span>
            <span className="text-muted text-sm">Last 30 entries</span>
          </div>
          {weightData.length < 2 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>Log body stats to see your weight chart</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3248" />
                <XAxis dataKey="date" tick={{ fill: '#7a80a0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#7a80a0', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="#00e5c3" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Body Fat %</span>
            <span className="text-muted text-sm">Last 30 entries</span>
          </div>
          {compData.length < 2 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>Log body fat % to see your trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={compData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3248" />
                <XAxis dataKey="date" tick={{ fill: '#7a80a0', fontSize: 10 }} />
                <YAxis tick={{ fill: '#7a80a0', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="bf" stroke="#8899ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top lifts */}
      {topLifts.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">🏆 Top Lifts</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {topLifts.map(([name, weight]) => (
              <div key={name} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px',
              }}>
                <div className="text-muted text-sm" style={{ marginBottom: 4 }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                  {weight} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>lbs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Workouts</span>
        </div>
        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p>No workouts logged yet. Build a plan to get started.</p>
          </div>
        ) : (
          <div className="history-list">
            {[...history].reverse().slice(0, 5).map((session, i) => (
              <div key={i} className="history-item">
                <div className="history-item-header">
                  <span className="history-item-name">{session.name || 'Workout'}</span>
                  <span className="history-item-date">
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="history-item-exercises">
                  {(session.exercises || []).map((ex, j) => (
                    <span key={j} className="tag tag-secondary">{ex.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
