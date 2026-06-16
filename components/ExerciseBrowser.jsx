// components/ExerciseBrowser.jsx

var ExerciseBrowser = function(props) {
  var onAdd     = props.onAdd;
  var addLabel  = props.addLabel  || '+ Add';
  var compact   = props.compact   || false;

  var _s1 = React.useState([]);
  var exercises   = _s1[0]; var setExercises = _s1[1];
  var _s2 = React.useState('All');
  var muscle      = _s2[0]; var setMuscle    = _s2[1];
  var _s3 = React.useState('All');
  var equipment   = _s3[0]; var setEquipment = _s3[1];
  var _s4 = React.useState('');
  var search      = _s4[0]; var setSearch    = _s4[1];

  React.useEffect(function() {
    fetch('data/exercises.json')
      .then(function(r){ return r.json(); })
      .then(setExercises)
      .catch(function(){ console.error('Could not load exercises.json'); });
  }, []);

  var muscles = ['All'].concat(
    Array.from(new Set(exercises.map(function(e){ return e.primaryMuscle; }))).sort()
  );
  var equipments = ['All'].concat(
    Array.from(new Set(exercises.map(function(e){ return e.equipment; }))).sort()
  );

  var filtered = exercises.filter(function(e) {
    var matchMuscle = muscle    === 'All' || e.primaryMuscle === muscle;
    var matchEquip  = equipment === 'All' || e.equipment     === equipment;
    var matchSearch = !search   ||
      e.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
      e.primaryMuscle.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    return matchMuscle && matchEquip && matchSearch;
  });

  return (
    <div>
      {/* Muscle group chips */}
      <div className="chip-bar">
        {muscles.map(function(m) {
          return (
            <button key={m} className={'chip ' + (muscle === m ? 'active' : '')}
                    onClick={function(){ setMuscle(m); }}>
              {m}
            </button>
          );
        })}
      </div>

      {/* Equipment chips */}
      <div className="chip-bar" style={{ marginBottom: 12 }}>
        {equipments.map(function(eq) {
          return (
            <button key={eq} className={'chip ' + (equipment === eq ? 'active' : '')}
                    onClick={function(){ setEquipment(eq); }} style={{ fontSize: 11 }}>
              {eq}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="search-bar-wrap">
        <span className="search-icon">⌕</span>
        <input className="input" placeholder="Search exercises…"
               value={search} onChange={function(e){ setSearch(e.target.value); }} />
      </div>

      <p className="text-muted text-sm mb-12">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        {muscle    !== 'All' ? ' · ' + muscle    : ''}
        {equipment !== 'All' ? ' · ' + equipment : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No exercises found</h3>
          <p>Try a different muscle group or search term</p>
        </div>
      ) : (
        <div className={compact ? 'flex flex-col gap-8' : 'exercise-grid'}>
          {filtered.map(function(ex) {
            return (
              <div key={ex.id} className="exercise-card">
                <div className="exercise-name">{ex.name}</div>

                <div className="exercise-meta">
                  <span className="tag tag-primary">{ex.primaryMuscle}</span>
                  <span className="tag tag-equipment">{ex.equipment}</span>
                  {(ex.secondaryMuscles || []).slice(0, 2).map(function(m) {
                    return <span key={m} className="tag tag-secondary">{m}</span>;
                  })}
                </div>

                {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                  <div className="text-sm text-muted">
                    Also works: {ex.secondaryMuscles.join(', ')}
                  </div>
                )}

                {onAdd && (
                  <div className="exercise-card-footer">
                    <span className="tag tag-secondary" style={{ fontSize: 10 }}>{ex.category}</span>
                    <button className="btn btn-primary btn-sm"
                            onClick={function(){ onAdd(ex); }}>
                      {addLabel}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

window.ExerciseBrowser = ExerciseBrowser;
