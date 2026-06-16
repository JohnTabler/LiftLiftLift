// components/MobilityBrowser.jsx
// Read-only mobility exercise library, filterable by body part and type

var TYPE_COLORS_BROWSER = {
  'Static Stretch':  { bg: 'rgba(0,229,195,0.1)',  border: '#00e5c3', text: '#00e5c3'  },
  'Dynamic Stretch': { bg: 'rgba(136,153,255,0.1)', border: '#8899ff', text: '#8899ff' },
  'Foam Roll':       { bg: 'rgba(245,158,11,0.1)',  border: '#f59e0b', text: '#f59e0b' },
  'Joint Mobility':  { bg: 'rgba(52,211,153,0.1)',  border: '#34d399', text: '#34d399' },
  'PNF':             { bg: 'rgba(255,92,92,0.1)',   border: '#ff5c5c', text: '#ff5c5c' },
  'Yoga':            { bg: 'rgba(167,139,250,0.1)', border: '#a78bfa', text: '#a78bfa' },
};

var typeStyleBrowser = function(type) {
  return TYPE_COLORS_BROWSER[type] || { bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', text: 'var(--text-muted)' };
};

var BODY_PARTS_BROWSER = [
  'All', 'Hips', 'Hamstrings', 'Quadriceps', 'Calves & Ankles',
  'Thoracic Spine', 'Shoulders', 'Neck', 'Wrists & Forearms',
  'Glutes', 'Lower Back', 'Full Body',
];

var TYPES_BROWSER = [
  'All', 'Static Stretch', 'Dynamic Stretch', 'Foam Roll', 'Joint Mobility', 'PNF', 'Yoga',
];

var MobilityBrowser = function() {
  var _all = React.useState([]); var allMoves    = _all[0]; var setAllMoves    = _all[1];
  var _bp  = React.useState('All'); var bodyPart  = _bp[0];  var setBodyPart    = _bp[1];
  var _tp  = React.useState('All'); var typeFilter = _tp[0]; var setTypeFilter  = _tp[1];
  var _sr  = React.useState('');    var search     = _sr[0]; var setSearch      = _sr[1];
  var _exp = React.useState(null);  var expanded   = _exp[0]; var setExpanded   = _exp[1];
  var _ld  = React.useState(true);  var loading    = _ld[0]; var setLoading    = _ld[1];

  React.useEffect(function() {
    fetch('data/mobility.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        setAllMoves(data);
        setLoading(false);
      })
      .catch(function(){
        console.error('Could not load mobility.json');
        setLoading(false);
      });
  }, []);

  var filtered = allMoves.filter(function(m) {
    var matchPart   = bodyPart   === 'All' || m.bodyPart === bodyPart;
    var matchType   = typeFilter === 'All' || m.type     === typeFilter;
    var matchSearch = !search    || m.name.toLowerCase().indexOf(search.toLowerCase()) !== -1
                                 || (m.description && m.description.toLowerCase().indexOf(search.toLowerCase()) !== -1);
    return matchPart && matchType && matchSearch;
  });

  // Group by body part when showing All
  var grouped = React.useMemo(function() {
    if (bodyPart !== 'All') return null;
    var groups = {};
    filtered.forEach(function(m) {
      if (!groups[m.bodyPart]) groups[m.bodyPart] = [];
      groups[m.bodyPart].push(m);
    });
    return groups;
  }, [filtered, bodyPart]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
        <p>Loading mobility library…</p>
      </div>
    );
  }

  var renderCard = function(m) {
    var ts       = typeStyleBrowser(m.type);
    var isOpen   = expanded === m.id;
    var holdLabel = m.defaultHold  ? 'Hold ' + m.defaultHold + 's' : null;
    var repsLabel = m.defaultReps  ? m.defaultReps + ' reps'       : null;

    return (
      <div key={m.id}
           onClick={function(){ setExpanded(isOpen ? null : m.id); }}
           style={{
             background: 'var(--surface2)',
             border: '1px solid var(--border)',
             borderLeft: '3px solid ' + ts.border,
             borderRadius: 8,
             padding: '12px 14px',
             cursor: 'pointer',
             transition: 'background 0.15s',
           }}>

        {/* Card header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{m.name}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: ts.bg, border: '1px solid ' + ts.border, color: ts.text,
              }}>{m.type}</span>
              <span className="tag tag-primary" style={{ fontSize: 10 }}>{m.bodyPart}</span>
              {m.sides && (
                <span className="tag tag-secondary" style={{ fontSize: 10 }}>Both sides</span>
              )}
              {holdLabel && (
                <span className="tag tag-secondary" style={{ fontSize: 10 }}>{holdLabel}</span>
              )}
              {repsLabel && (
                <span className="tag tag-secondary" style={{ fontSize: 10 }}>{repsLabel}</span>
              )}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>

        {/* Expanded description */}
        {isOpen && m.description && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            {m.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Body part filter */}
      <div className="chip-bar" style={{ marginBottom: 8 }}>
        {BODY_PARTS_BROWSER.map(function(bp) {
          return (
            <button key={bp}
                    className={'chip ' + (bodyPart === bp ? 'active' : '')}
                    onClick={function(){ setBodyPart(bp); setExpanded(null); }}
                    style={{ fontSize: 11 }}>
              {bp}
            </button>
          );
        })}
      </div>

      {/* Type filter */}
      <div className="chip-bar" style={{ marginBottom: 10 }}>
        {TYPES_BROWSER.map(function(t) {
          var ts = typeStyleBrowser(t);
          return (
            <button key={t}
                    onClick={function(){ setTypeFilter(t); setExpanded(null); }}
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
      <div className="search-bar-wrap" style={{ marginBottom: 12 }}>
        <span className="search-icon">⌕</span>
        <input className="input" placeholder="Search movements…"
               value={search} onChange={function(e){ setSearch(e.target.value); setExpanded(null); }} />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {filtered.length} movement{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧘</div>
          <h3>No movements match</h3>
          <p>Try adjusting your filters or search</p>
        </div>
      ) : grouped ? (
        // Grouped by body part (when "All" is selected)
        Object.keys(grouped).map(function(bp) {
          return (
            <div key={bp} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.8px', color: 'var(--text-muted)',
                marginBottom: 10, paddingBottom: 6,
                borderBottom: '1px solid var(--border)',
              }}>
                {bp} · {grouped[bp].length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[bp].map(renderCard)}
              </div>
            </div>
          );
        })
      ) : (
        // Flat list (when a specific body part is selected)
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(renderCard)}
        </div>
      )}
    </div>
  );
};

window.MobilityBrowser = MobilityBrowser;
