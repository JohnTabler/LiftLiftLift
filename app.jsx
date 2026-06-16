// app.jsx — Root component with hash routing + mobile bottom nav

// ── Profile Picker Modal ──────────────────────────────────────
var PROFILES = ['John', 'Ariana'];

var ProfilePicker = function(props) {
  var onSelect = props.onSelect;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
        <div className="modal-title">Who's working out?</div>
        <p className="modal-sub" style={{ marginBottom: 24 }}>Choose your profile to load your data.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROFILES.map(function(name) {
            return (
              <button key={name} className="btn btn-primary w-full" style={{ fontSize: 16, padding: '14px' }}
                      onClick={function(){ onSelect(name); }}>
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
      if (!res.ok) throw new Error('Could not reach repo. Check owner, repo name, and token scope.');
      onSave();
    }).catch(function(e) {
      setError(e.message);
    }).finally(function() { setTesting(false); });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Connect Your Repo</div>
        <p className="modal-sub">
          Lift Log saves data as JSON files in your GitHub repo. Create a{' '}
          <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer"
             style={{ color: 'var(--accent)' }}>Personal Access Token</a>{' '}
          with <strong>repo</strong> scope. Token stays in your browser only.
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

// ── More Drawer (mobile) ──────────────────────────────────────
var MoreDrawer = function(props) {
  var onNavigate  = props.onNavigate;
  var onClose     = props.onClose;
  var onGitHub    = props.onGitHub;

  var activeProfile = props.activeProfile;
  var onSwitchProfile = props.onSwitchProfile;

  var items = [
    { icon: '📚', label: 'Exercise Library', action: 'nav',     hash: '#/exercises' },
    { icon: '📋', label: 'History',          action: 'nav',     hash: '#/history'   },
    { icon: '👤', label: 'Switch Profile (' + (activeProfile === 'John' ? 'Ariana' : 'John') + ')', action: 'profile', hash: null },
    { icon: '⚙',  label: 'GitHub Settings',  action: 'github',  hash: null          },
  ];

  return (
    <div className="more-drawer-overlay" onClick={function(e){ if(e.target===e.currentTarget) onClose(); }}>
      <div className="more-drawer">
        <div className="more-drawer-handle" />
        {items.map(function(item) {
          return (
            <button key={item.label} className="more-drawer-item"
                    onClick={function(){
                      if      (item.action === 'nav')     { onNavigate(item.hash); }
                      else if (item.action === 'profile') { onSwitchProfile(); }
                      else                                { onGitHub(); }
                      onClose();
                    }}>
              <span className="more-drawer-item-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Bottom Nav ────────────────────────────────────────────────
var BottomNav = function(props) {
  var route      = props.route;
  var onNavigate = props.onNavigate;
  var onMore     = props.onMore;
  var moreOpen   = props.moreOpen;

  var tabs = [
    { icon: '🏠', label: 'Home',     hash: '#/'         },
    { icon: '💪', label: 'Workout',  hash: '#/log'      },
    { icon: '🧘', label: 'Mobility', hash: '#/mobility' },
    { icon: '📊', label: 'Stats',    hash: '#/body-stats'},
    { icon: '⋯',  label: 'More',     hash: null         },
  ];

  // "More" is active when on a page not in the main tabs
  var mainHashes = ['#/', '#/log', '#/mobility', '#/body-stats'];
  var moreActive = moreOpen || mainHashes.indexOf(route) === -1;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(function(tab) {
          var isActive = tab.hash ? route === tab.hash : moreActive;
          return (
            <button key={tab.label}
                    className={'bottom-nav-btn ' + (isActive ? 'active' : '')}
                    onClick={function(){
                      if (tab.hash) onNavigate(tab.hash);
                      else          onMore();
                    }}>
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ── Exercises page ────────────────────────────────────────────
var ExercisesPage = function() {
  return (
    <div>
      <h2 className="section-heading">Exercise Library</h2>
      <p className="section-sub">208 exercises across 15 muscle groups</p>
      <ExerciseBrowser />
    </div>
  );
};

// ── History page ──────────────────────────────────────────────
var HistoryPage = function(props) {
  var history    = props.history    || [];
  var mobHistory = props.mobHistory || [];

  var _tab = React.useState('workouts'); var tab = _tab[0]; var setTab = _tab[1];

  return (
    <div>
      <h2 className="section-heading">History</h2>
      <div className="chip-bar" style={{ marginBottom: 20 }}>
        <button className={'chip ' + (tab === 'workouts' ? 'active' : '')}
                onClick={function(){ setTab('workouts'); }}>
          💪 Workouts ({history.length})
        </button>
        <button className={'chip ' + (tab === 'mobility' ? 'active' : '')}
                onClick={function(){ setTab('mobility'); }}>
          🧘 Mobility ({mobHistory.length})
        </button>
      </div>

      {tab === 'workouts' && (
        history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No workouts logged yet</h3>
            <p>Head to Log Workout to start</p>
          </div>
        ) : (
          <div className="history-list">
            {[...history].reverse().map(function(session, i) {
              return (
                <div key={i} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-name">{session.name || 'Workout'}</span>
                    <span className="history-item-date">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {session.duration ? <div className="text-sm text-muted mt-4">⏱ {Math.round(session.duration/60)} min</div> : null}
                  <div className="history-item-exercises mt-8">
                    {(session.exercises||[]).map(function(ex,j){ return <span key={j} className="tag tag-secondary">{ex.name}</span>; })}
                  </div>
                  {(session.exercises||[]).map(function(ex,j) {
                    return (
                      <div key={j} style={{ marginTop: 10 }}>
                        <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{ex.name}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {(ex.sets||[]).map(function(set,k) {
                            return (
                              <span key={k} className="tag tag-equipment" style={{ fontSize:11 }}>
                                {set.weight ? set.weight+' lbs × ' : ''}{set.reps} reps
                                {set.type && set.type!=='normal' ? ' ('+set.type+')' : ''}
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
        )
      )}

      {tab === 'mobility' && (
        mobHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧘</div>
            <h3>No mobility sessions yet</h3>
            <p>Head to Log Mobility to start</p>
          </div>
        ) : (
          <div className="history-list">
            {[...mobHistory].reverse().map(function(session, i) {
              var completed = (session.movements||[]).filter(function(m){ return m.completed; }).length;
              return (
                <div key={i} className="history-item">
                  <div className="history-item-header">
                    <span className="history-item-name">{session.name || 'Mobility Session'}</span>
                    <span className="history-item-date">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {session.duration ? (
                    <div className="text-sm text-muted mt-4">
                      ⏱ {Math.round(session.duration/60)} min · {completed}/{(session.movements||[]).length} done
                    </div>
                  ) : null}
                  <div className="history-item-exercises mt-8">
                    {(session.movements||[]).map(function(m,j) {
                      return (
                        <span key={j} className="tag" style={{
                          fontSize:11, padding:'2px 8px', borderRadius:99,
                          border:'1px solid '+(m.completed ? 'var(--accent)' : 'var(--border)'),
                          color: m.completed ? 'var(--accent)' : 'var(--text-muted)',
                          background:'transparent',
                        }}>
                          {m.name}
                          {m.trackMode==='hold'&&m.holdSeconds ? ' · '+m.holdSeconds+'s' : ''}
                          {m.trackMode==='reps'&&m.reps ? ' · '+m.reps+' reps' : ''}
                          {m.side&&m.side!=='both' ? ' · '+m.side : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────
var App = function() {
  var _r   = React.useState(window.location.hash || '#/'); var route      = _r[0];   var setRoute      = _r[1];
  var _ss  = React.useState(false);                         var showSetup  = _ss[0];  var setShowSetup  = _ss[1];
  var _mo  = React.useState(false);                         var moreOpen   = _mo[0];  var setMoreOpen   = _mo[1];
  var _h   = React.useState([]);                            var history    = _h[0];   var setHistory    = _h[1];
  var _mh  = React.useState([]);                            var mobHistory = _mh[0];  var setMobHistory = _mh[1];
  var _b   = React.useState([]);                            var bodyStats  = _b[0];   var setBodyStats  = _b[1];
  var _t   = React.useState(null);                          var toast      = _t[0];   var setToast      = _t[1];
  var _l   = React.useState(true);                          var loading    = _l[0];   var setLoading    = _l[1];
  var _pr  = React.useState(localStorage.getItem('gh_profile') || null); var activeProfile = _pr[0]; var setActiveProfile = _pr[1];
  var _sp  = React.useState(false);                         var showProfilePicker = _sp[0]; var setShowProfilePicker = _sp[1];

  // Hash routing
  React.useEffect(function() {
    var onHash = function(){ setRoute(window.location.hash || '#/'); };
    window.addEventListener('hashchange', onHash);
    return function(){ window.removeEventListener('hashchange', onHash); };
  }, []);

  var navigate = function(path){
    window.location.hash = path;
    setMoreOpen(false);
  };

  var handleSelectProfile = function(name) {
    localStorage.setItem('gh_profile', name);
    setActiveProfile(name);
    setShowProfilePicker(false);
    setLoading(true);
    loadData();
  };

  var switchProfile = function() {
    var next = activeProfile === 'John' ? 'Ariana' : 'John';
    handleSelectProfile(next);
    setMoreOpen(false);
  };

  // Load data
  var loadData = function() {
    GH.isConfigured().then(function(configured) {
      if (!configured) { setLoading(false); setShowSetup(true); return; }
      if (!localStorage.getItem('gh_profile')) { setLoading(false); setShowProfilePicker(true); return; }
      Promise.all([
        GH.readFile('data/history.json'),
        GH.readFile('data/body_stats.json'),
        GH.readFile('data/mobility_history.json'),
      ]).then(function(results) {
        if (results[0]) setHistory(results[0].data);
        if (results[1]) setBodyStats(results[1].data);
        if (results[2]) setMobHistory(results[2].data);
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

  var saveMobility = function(session) {
    var updated = mobHistory.concat([session]);
    setMobHistory(updated);
    return GH.writeFile('data/mobility_history.json', updated, 'Log mobility: ' + session.name)
      .then(function(){ showToast('Mobility session saved ✓'); })
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

  // Desktop top nav items
  var desktopNavItems = [
    { label: 'Dashboard',    hash: '#/'          },
    { label: 'Log Workout',  hash: '#/log'        },
    { label: 'Log Mobility', hash: '#/mobility'   },
    { label: 'Exercises',    hash: '#/exercises'  },
    { label: 'Body Stats',   hash: '#/body-stats' },
    { label: 'History',      hash: '#/history'    },
  ];

  var renderPage = function() {
    if (loading) {
      return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
          <div style={{ textAlign:'center', color:'var(--text-muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            <p>Loading your data…</p>
          </div>
        </div>
      );
    }
    if (route === '#/' || route === '')  return <Dashboard     history={history} bodyStats={bodyStats} />;
    if (route === '#/log')               return <WorkoutLogger  onSave={saveWorkout} />;
    if (route === '#/mobility')          return <MobilityLogger onSave={saveMobility} />;
    if (route === '#/exercises')         return <ExercisesPage />;
    if (route === '#/body-stats')        return <BodyStats      stats={bodyStats} onSave={saveBodyStat} />;
    if (route === '#/history')           return <HistoryPage    history={history} mobHistory={mobHistory} />;
    return <Dashboard history={history} bodyStats={bodyStats} />;
  };

  return (
    <div className="app-shell">
      {showSetup ? <SetupModal onSave={handleSetupSave} /> : null}
      {showProfilePicker ? <ProfilePicker onSelect={handleSelectProfile} /> : null}

      {/* Top bar — visible on desktop, logo-only on mobile */}
      <header className="topbar">
        <div className="topbar-logo">🏋️ Lift Log</div>
        {/* Desktop nav */}
        <nav className="topbar-nav">
          {desktopNavItems.map(function(item) {
            return (
              <button key={item.hash}
                      className={'nav-btn ' + (route === item.hash ? 'active' : '')}
                      onClick={function(){ navigate(item.hash); }}>
                {item.label}
              </button>
            );
          })}
        </nav>
        {/* Desktop actions */}
        <div className="topbar-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeProfile && (
            <button className="btn btn-ghost btn-sm" onClick={function(){ setShowProfilePicker(true); }}
                    style={{ fontWeight: 700 }}>
              👤 {activeProfile}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={function(){ setShowSetup(true); }}>
            ⚙ GitHub
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="page-content">
        {renderPage()}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav
        route={route}
        onNavigate={navigate}
        onMore={function(){ setMoreOpen(true); }}
        moreOpen={moreOpen}
      />

      {/* More drawer */}
      {moreOpen && (
        <MoreDrawer
          onNavigate={navigate}
          onClose={function(){ setMoreOpen(false); }}
          onGitHub={function(){ setShowSetup(true); }}
          activeProfile={activeProfile}
          onSwitchProfile={switchProfile}
        />
      )}

      {toast ? <Toast message={toast} onDone={function(){ setToast(null); }} /> : null}
    </div>
  );
};

var rootEl  = document.getElementById('root');
var appRoot = ReactDOM.createRoot(rootEl);
appRoot.render(React.createElement(App, null));
