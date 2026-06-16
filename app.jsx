// app.jsx — Root component with hash routing
// UMD mode: React/ReactDOM are on window, no imports needed

// ── Setup / GitHub config modal ──────────────────────────────
const SetupModal = ({ onSave }) => {
  const [token,   setToken]   = React.useState(localStorage.getItem('gh_token')  || '');
  const [owner,   setOwner]   = React.useState(localStorage.getItem('gh_owner')  || '');
  const [repo,    setRepo]    = React.useState(localStorage.getItem('gh_repo')   || '');
  const [branch,  setBranch]  = React.useState(localStorage.getItem('gh_branch') || 'main');
  const [error,   setError]   = React.useState('');
  const [testing, setTesting] = React.useState(false);

  const handleSave = async () => {
    if (!token || !owner || !repo) { setError('All fields are required.'); return; }
    setTesting(true); setError('');
    localStorage.setItem('gh_token',  token);
    localStorage.setItem('gh_owner',  owner);
    localStorage.setItem('gh_repo',   repo);
    localStorage.setItem('gh_branch', branch);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Could not reach repo. Check owner/repo name and token permissions.');
      onSave();
    } catch (e) {
      setError(e.message);
    }
    setTesting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Connect Your Repo</div>
        <p className="modal-sub">
          Lift Log saves your data as JSON files in your GitHub repo. Create a{' '}
          <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer"
             style={{ color: 'var(--accent)' }}>
            Personal Access Token
          </a>{' '}
          with <strong>repo</strong> scope, then paste it below. Your token stays in your browser only.
        </p>

        <div className="input-group">
          <label className="label">Personal Access Token</label>
          <input className="input" type="password" placeholder="ghp_xxxxxxxxxxxx"
                 value={token} onChange={e => setToken(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group">
            <label className="label">GitHub Username</label>
            <input className="input" placeholder="your-username"
                   value={owner} onChange={e => setOwner(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Repository Name</label>
            <input className="input" placeholder="workout-tracker"
                   value={repo} onChange={e => setRepo(e.target.value)} />
          </div>
        </div>

        <div className="input-group">
          <label className="label">Branch</label>
          <input className="input" placeholder="main"
                 value={branch} onChange={e => setBranch(e.target.value)} />
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>⚠ {error}</p>}

        <button className="btn btn-primary w-full" onClick={handleSave} disabled={testing}>
          {testing ? 'Testing connection…' : 'Save & Connect'}
        </button>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ message, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="toast">{message}</div>;
};

// ── Exercises page ────────────────────────────────────────────
const ExercisesPage = () => (
  <div>
    <h2 className="section-heading">Exercise Library</h2>
    <p className="section-sub">208 exercises across 15 muscle groups</p>
    <ExerciseBrowser />
  </div>
);

// ── History page ──────────────────────────────────────────────
const HistoryPage = ({ history }) => (
  <div>
    <h2 className="section-heading">Workout History</h2>
    {history.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No workouts logged yet</h3>
        <p>Complete a workout session to see it here</p>
      </div>
    ) : (
      <div className="history-list">
        {[...history].reverse().map((session, i) => (
          <div key={i} className="history-item">
            <div className="history-item-header">
              <span className="history-item-name">{session.name || 'Workout'}</span>
              <span className="history-item-date">
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
            {session.duration && (
              <div className="text-sm text-muted mt-4">⏱ {Math.round(session.duration / 60)} min</div>
            )}
            <div className="history-item-exercises mt-8">
              {(session.exercises || []).map((ex, j) => (
                <span key={j} className="tag tag-secondary">{ex.name}</span>
              ))}
            </div>
            {(session.exercises || []).map((ex, j) => (
              <div key={j} style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ex.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(ex.sets || []).map((set, k) => (
                    <span key={k} className="tag tag-equipment" style={{ fontSize: 11 }}>
                      {set.weight ? `${set.weight} lbs × ` : ''}{set.reps} reps
                      {set.type && set.type !== 'normal' ? ` (${set.type})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Root App ──────────────────────────────────────────────────
const App = () => {
  const [route,     setRoute]     = React.useState(window.location.hash || '#/');
  const [showSetup, setShowSetup] = React.useState(false);
  const [history,   setHistory]   = React.useState([]);
  const [bodyStats, setBodyStats] = React.useState([]);
  const [toast,     setToast]     = React.useState(null);
  const [loading,   setLoading]   = React.useState(true);

  // Hash routing
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (path) => { window.location.hash = path; };

  // Load data on mount
  React.useEffect(() => {
    const load = async () => {
      const configured = await GH.isConfigured();
      if (!configured) { setLoading(false); setShowSetup(true); return; }
      try {
        const [h, b] = await Promise.all([
          GH.readFile('data/history.json'),
          GH.readFile('data/body_stats.json'),
        ]);
        if (h) setHistory(h.data);
        if (b) setBodyStats(b.data);
      } catch (e) {
        console.warn('Could not load data:', e.message);
      }
      setLoading(false);
    };
    load();
  }, []);

  const showToast = (msg) => setToast(msg);

  const saveHistory = React.useCallback(async (newHistory) => {
    setHistory(newHistory);
    try {
      await GH.writeFile('data/history.json', newHistory, 'Update workout history');
      showToast('Workout saved ✓');
    } catch (e) {
      showToast('⚠ Save failed: ' + e.message);
    }
  }, []);

  const saveBodyStat = React.useCallback(async (entry) => {
    const updated = [...bodyStats, entry];
    setBodyStats(updated);
    try {
      await GH.writeFile('data/body_stats.json', updated, 'Update body stats');
      showToast('Stats saved ✓');
    } catch (e) {
      showToast('⚠ Save failed: ' + e.message);
    }
  }, [bodyStats]);

  const handleSetupSave = () => {
    setShowSetup(false);
    setLoading(true);
    const reload = async () => {
      try {
        const [h, b] = await Promise.all([
          GH.readFile('data/history.json'),
          GH.readFile('data/body_stats.json'),
        ]);
        if (h) setHistory(h.data);
        if (b) setBodyStats(b.data);
      } catch (_) {}
      setLoading(false);
    };
    reload();
  };

  const navItems = [
    { label: 'Dashboard',  hash: '#/' },
    { label: 'Exercises',  hash: '#/exercises' },
    { label: 'Body Stats', hash: '#/body-stats' },
    { label: 'History',    hash: '#/history' },
  ];

  const renderPage = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Loading your data…</p>
        </div>
      </div>
    );

    switch (route) {
      case '#/':          return <Dashboard  history={history} bodyStats={bodyStats} />;
      case '#/exercises': return <ExercisesPage />;
      case '#/body-stats':return <BodyStats  stats={bodyStats} onSave={saveBodyStat} />;
      case '#/history':   return <HistoryPage history={history} />;
      default:            return <Dashboard  history={history} bodyStats={bodyStats} />;
    }
  };

  return (
    <div className="app-shell">
      {showSetup && <SetupModal onSave={handleSetupSave} />}

      <header className="topbar">
        <div className="topbar-logo">🏋️ Lift Log</div>

        <nav className="topbar-nav">
          {navItems.map(item => (
            <button key={item.hash}
                    className={`nav-btn ${route === item.hash ? 'active' : ''}`}
                    onClick={() => navigate(item.hash)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSetup(true)} title="GitHub settings">
            ⚙ GitHub
          </button>
        </div>
      </header>

      <main className="page-content">
        {renderPage()}
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
};

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
