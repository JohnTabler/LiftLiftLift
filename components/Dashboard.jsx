// components/Dashboard.jsx — uses window.MiniChart, no external chart lib

const Dashboard = ({ history, bodyStats }) => {
  history   = history   || [];
  bodyStats = bodyStats || [];

  const topLifts = React.useMemo(() => {
    const bests = {};
    history.forEach(function(session) {
      (session.exercises || []).forEach(function(ex) {
        (ex.sets || []).forEach(function(set) {
          var w = parseFloat(set.weight);
          if (!w) return;
          if (!bests[ex.name] || w > bests[ex.name]) bests[ex.name] = w;
        });
      });
    });
    return Object.entries(bests).sort(function(a,b){ return b[1]-a[1]; }).slice(0, 6);
  }, [history]);

  const sorted     = React.useMemo(() =>
    [...bodyStats].sort(function(a,b){ return new Date(a.date)-new Date(b.date); }),
    [bodyStats]
  );
  const latestStat = sorted.length ? sorted[sorted.length - 1] : null;
  const prevStat   = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const weightChange = latestStat && prevStat && latestStat.weight && prevStat.weight
    ? (parseFloat(latestStat.weight) - parseFloat(prevStat.weight)).toFixed(1)
    : null;

  const chartData = sorted.slice(-30).map(function(s) {
    return {
      date:   new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: s.weight  ? parseFloat(s.weight)  : null,
      bf:     s.bodyFat ? parseFloat(s.bodyFat) : null,
    };
  });

  return (
    <div>
      <h2 className="section-heading">Dashboard</h2>

      {/* Stat cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Current Weight</div>
          <div className="stat-value">
            {latestStat && latestStat.weight ? latestStat.weight : '—'}
            {latestStat && latestStat.weight ? <span>lbs</span> : null}
          </div>
          {weightChange !== null && (
            <div className={'stat-change ' + (weightChange > 0 ? 'pos' : 'neg')}>
              {weightChange > 0 ? '▲' : '▼'} {Math.abs(weightChange)} lbs
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Body Fat</div>
          <div className="stat-value">
            {latestStat && latestStat.bodyFat ? latestStat.bodyFat : '—'}
            {latestStat && latestStat.bodyFat ? <span>%</span> : null}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Lean Mass</div>
          <div className="stat-value">
            {latestStat && latestStat.weight && latestStat.bodyFat
              ? (parseFloat(latestStat.weight) * (1 - parseFloat(latestStat.bodyFat) / 100)).toFixed(1)
              : '—'}
            {latestStat && latestStat.weight && latestStat.bodyFat ? <span>lbs</span> : null}
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
          <MiniChart data={chartData} dataKey="weight" color="#00e5c3" height={200} unit=" lbs" label="Weight trend" />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Body Fat %</span>
            <span className="text-muted text-sm">Last 30 entries</span>
          </div>
          <MiniChart data={chartData} dataKey="bf" color="#8899ff" height={200} unit="%" label="Body fat trend" />
        </div>
      </div>

      {/* Top lifts */}
      {topLifts.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">🏆 Top Lifts</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {topLifts.map(function(entry) {
              var name = entry[0], weight = entry[1];
              return (
                <div key={name} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  <div className="text-muted text-sm" style={{ marginBottom: 4 }}>{name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                    {weight} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>lbs</span>
                  </div>
                </div>
              );
            })}
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
            <p>No workouts logged yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {[...history].reverse().slice(0, 5).map(function(session, i) {
              return (
                <div key={i} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-name">{session.name || 'Workout'}</span>
                    <span className="history-item-date">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="history-item-exercises">
                    {(session.exercises || []).map(function(ex, j) {
                      return <span key={j} className="tag tag-secondary">{ex.name}</span>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
