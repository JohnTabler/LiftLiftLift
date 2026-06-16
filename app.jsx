// app.jsx — Root component, hash routing

// ── GitHub Setup Modal ────────────────────────────────────────
var SetupModal = function(props) {
  var onSave = props.onSave;

  var _1 = React.useState(localStorage.getItem('gh_token')  || ''); var token  = _1[0]; var setToken  = _1[1];
  var _2 = React.useState(localStorage.getItem('gh_owner')  || ''); var owner  = _2[0]; var setOwner  = _2[1];
  var _3 = React.useState(localStorage.getItem('gh_repo')   || ''); var repo   = _3[0]; var setRepo   = _3[1];
  var _4 = React.useState(localStorage.getItem('gh_branch') || 'main'); var branch = _4[0]; var setBranch = _4[1];
  var _5 = React.useState('');    var error   = _5[0]; var setError   = _5[1];
  var _6 = React.useState(false); var testing = _6[0]; var setTesting = _6[1];

  var handleSave = function() {
    if (!token || !owner || !repo) { setError('All fields are required.'); return; }
    setTesting(true); setError('');
    localStorage.setItem('gh_token',  token);
    localStorage.setItem('gh_owner',  owner);
    localStorage.setItem('gh_repo',   repo);
    localStorage.setItem('gh_branch', branch);
    fetch('https://api.github.com/repos/' + owner + '/' + repo, {
      headers: { Authorization: 'Bearer ' + token },
    }).then(function(res) {
      if (!res.ok) throw new Error('Could not reach repo. Check owner/repo name and token permissions.');
      onSave();
    }).catch(function(e) {
      setError(e.message);
    }).finally(function() {
      setTesting(false);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Connect Your Repo</div>
        <p className="modal-sub">
          Lift Log saves data as JSON files in your GitHub repo. Create a{' '}
          <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer"
             style={{ color: 'var(--accent)' }}>Personal Access Token</a>{' '}
          with <strong>repo</strong> scope. Your token is stored only in your browser.
        </p>
        <div className="input-group">
          <label className="label">Personal Access Token</label>
          <input className="input" type="password" placeholder="ghp_xxxxxxxxxxxx"
                 value={token} onChange={function(e){ setToken(e.target.value); }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="input-group">
            <label className="label">GitHub Username</label>
            <input className="input" placeholder="your-username"
                   value={owner} onChange={function(e){ setOwner(e.target.value); }} />
          </div>
          <div className="input-group">
            <label className="label">Repository Name</label>
            <input className="input" placeholder="workout-tracker"
                   value={repo} onChange={function(e){ setRepo(e.target.value); }} />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Branch</label>
          <input className="input" placeholder="main"
                 value={branch} onChange={function(e){ setBranch(e.target.value); }} />
        </div>
        {error ? <p style={{ color: 'var(--danger)', fontSize: 13 }}>⚠ {error}</p> : null}
        <button className="btn btn-primary w-full" onClick={handleSave} disabled={testing}>
          {testing ? 'Testing connection…' : 'Save & Connect'}
        </button>
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────
var Toast = function(props) {
  var message = props.message; var onDone = props.onDone;
  React.useEffect(function() {
    var t = setTimeout(onDone, 2500);
    return function(){ clearTimeout(t); };
  }, []);
  return <div className="toast">{message}</div>;
};

// ── Exercises Page ────────────────────────────────────────────
var ExercisesPage = function() {
  return (
    <div>
      <h2 className="section-heading">Exercise Library</h2>
      <p className="section-sub">208 exercises across 15 muscle groups</p>
      <ExerciseBrowser />
    </div>
  );
};

// ── History Page ──────────────────────────────────────────────
var HistoryPage = function(props) {
  var history = props.history || [];
  return (
    <div>
      <h2 className="section-heading">Workout History</h2>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No workouts logged yet</h3>
          <p>Head to Log Workout to record your first session</p>
        </div>
      ) : (
        <div className="history-list">
          {[...history].reverse().map(function(session, i) {
            return (
              <div key={i} className="history-item">
                <div className="history-item-header">
                  <span className="history-item-name">{session.name || 'Workout'}</span>
                  <span className="history-item-date">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                {session.duration ? (
                  <div className="text-sm text-muted mt-4">
                    ⏱ {Math.round(session.duration / 60)} min
                  </div>
                ) : null}
                <div className="history-item-exercises mt-8">
                  {(session.exercises || []).map(function(ex, j) {
                    return <span key={j} className="tag tag-secondary">{ex.name}</span>;
                  })}
                </div>
                {(session.exercises || []).map(function(ex, j) {
                  return (
                    <div key={j} style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ex.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(ex.sets || []).map(function(set, k) {
                          return (
                            <span key={k} className="tag tag-equipment" style={{ fontSize: 11 }}>
                              {set.weight ? set.weight + ' lbs × ' : ''}{set.reps} reps
                              {set.type && set.type !== 'normal' ? ' (' + set.type + ')' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────
var App = function() {
  var _r  = React.useState(window.location.hash || '#/'); var route     = _r[0];  var setRoute     = _r[1];
  var _ss = React.useState(false);                         var showSetup = _ss[0]; var setShowSetup = _ss[1];
  var _h  = React.useState([]);                            var history   = _h[0];  var setHistory   = _h[1];
  var _b  = React.useState([]);                            var bodyStats = _b[0];  var setBodyStats = _b[1];
  var _t  = React.useState(null);                          var toast     = _t[0];  var setToast     = _t[1];
  var _l  = React.useState(true);                          var loading   = _l[0];  var setLoading   = _l[1];

  React.useEffect(function() {
    var onHash = function(){ setRoute(window.location.hash || '#/'); };
    window.addEventListener('hashchange', onHash);
    return function(){ window.removeEventListener('hashchange', onHash); };
  }, []);

  var navigate = function(path){ window.location.hash = path; };

  var loadData = function() {
    GH.isConfigured().then(function(configured) {
      if (!configured) { setLoading(false); setShowSetup(true); return; }
      Promise.all([
        GH.readFile('data/history.json'),
        GH.readFile('data/body_stats.json'),
      ]).then(function(results) {
        if (results[0]) setHistory(results[0].data);
        if (results[1]) setBodyStats(results[1].data);
        setLoading(false);
      }).catch(function(e) {
        console.warn('Could not load data:', e.message);
        setLoading(false);
      });
    });
  };

  React.useEffect(function(){ loadData(); }, []);

  var showToast = function(msg){ setToast(msg); };

  var saveWorkout = function(session) {
    var updated = history.concat([session]);
    setHistory(updated);
    return GH.writeFile('data/history.json', updated, 'Log workout: ' + session.name)
      .then(function(){ showToast('Workout saved ✓'); })
      .catch(function(e){ showToast('⚠ Save failed: ' + e.message); });
  };

  var saveBodyStat = function(entry) {
    var updated = bodyStats.concat([entry]);
    setBodyStats(updated);
    return GH.writeFile('data/body_stats.json', updated, 'Update body stats')
      .then(function(){ showToast('Stats saved ✓'); })
      .catch(function(e){ showToast('⚠ Save failed: ' + e.message); });
  };

  var handleSetupSave = function() {
    setShowSetup(false);
    setLoading(true);
    loadData();
  };

  var navItems = [
    { label: 'Dashboard',    hash: '#/'         },
    { label: 'Log Workout',  hash: '#/log'       },
    { label: 'Exercises',    hash: '#/exercises' },
    { label: 'Body Stats',   hash: '#/body-stats'},
    { label: 'History',      hash: '#/history'   },
  ];

  var renderPage = function() {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Loading your data…</p>
          </div>
        </div>
      );
    }
    if (route === '#/' || route === '')    return <Dashboard    history={history} bodyStats={bodyStats} />;
    if (route === '#/log')                 return <WorkoutLogger onSave={saveWorkout} />;
    if (route === '#/exercises')           return <ExercisesPage />;
    if (route === '#/body-stats')          return <BodyStats    stats={bodyStats} onSave={saveBodyStat} />;
    if (route === '#/history')             return <HistoryPage  history={history} />;
    return <Dashboard history={history} bodyStats={bodyStats} />;
  };

  return (
    <div className="app-shell">
      {showSetup ? <SetupModal onSave={handleSetupSave} /> : null}

      <header className="topbar">
        <div className="topbar-logo">🏋️ Lift Log</div>
        <nav className="topbar-nav">
          {navItems.map(function(item) {
            return (
              <button key={item.hash}
                      className={'nav-btn ' + (route === item.hash ? 'active' : '')}
                      onClick={function(){ navigate(item.hash); }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={function(){ setShowSetup(true); }}>
            ⚙ GitHub
          </button>
        </div>
      </header>

      <main className="page-content">
        {renderPage()}
      </main>

      {toast ? <Toast message={toast} onDone={function(){ setToast(null); }} /> : null}
    </div>
  );
};

var rootEl  = document.getElementById('root');
var appRoot = ReactDOM.createRoot(rootEl);
appRoot.render(React.createElement(App, null));
