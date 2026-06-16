// components/ExerciseBrowser.jsx
// UMD mode: React is on window.React, no imports needed

const ExerciseBrowser = ({ onAdd, addLabel = '+ Add', compact = false }) => {
  const [exercises, setExercises] = React.useState([]);
  const [muscle,    setMuscle]    = React.useState('All');
  const [equipment, setEquipment] = React.useState('All');
  const [search,    setSearch]    = React.useState('');

  React.useEffect(() => {
    fetch('data/exercises.json')
      .then(r => r.json())
      .then(setExercises)
      .catch(() => console.error('Could not load exercises.json'));
  }, []);

  const muscles    = ['All', ...Array.from(new Set(exercises.map(e => e.primaryMuscle))).sort()];
  const equipments = ['All', ...Array.from(new Set(exercises.map(e => e.equipment))).sort()];

  const filtered = exercises.filter(e => {
    const matchMuscle = muscle    === 'All' || e.primaryMuscle === muscle;
    const matchEquip  = equipment === 'All' || e.equipment     === equipment;
    const matchSearch = !search   ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.primaryMuscle.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchEquip && matchSearch;
  });

  return (
    <div>
      {/* Muscle group chips */}
      <div className="chip-bar">
        {muscles.map(m => (
          <button key={m} className={`chip ${muscle === m ? 'active' : ''}`} onClick={() => setMuscle(m)}>
            {m}
          </button>
        ))}
      </div>

      {/* Equipment chips */}
      <div className="chip-bar" style={{ marginBottom: 12 }}>
        {equipments.map(eq => (
          <button key={eq} className={`chip ${equipment === eq ? 'active' : ''}`}
                  onClick={() => setEquipment(eq)} style={{ fontSize: 11 }}>
            {eq}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar-wrap">
        <span className="search-icon">⌕</span>
        <input className="input" placeholder="Search exercises…"
               value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Count */}
      <p className="text-muted text-sm mb-12">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        {muscle    !== 'All' ? ` · ${muscle}`    : ''}
        {equipment !== 'All' ? ` · ${equipment}` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No exercises found</h3>
          <p>Try a different muscle group or search term</p>
        </div>
      ) : (
        <div className={compact ? 'flex flex-col gap-8' : 'exercise-grid'}>
          {filtered.map(ex => (
            <div key={ex.id} className="exercise-card">
              <div className="exercise-name">{ex.name}</div>

              <div className="exercise-meta">
                <span className="tag tag-primary">{ex.primaryMuscle}</span>
                <span className="tag tag-equipment">{ex.equipment}</span>
                {ex.secondaryMuscles && ex.secondaryMuscles.slice(0, 2).map(m => (
                  <span key={m} className="tag tag-secondary">{m}</span>
                ))}
              </div>

              {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                <div className="text-sm text-muted">
                  Also works: {ex.secondaryMuscles.join(', ')}
                </div>
              )}

              {onAdd && (
                <div className="exercise-card-footer">
                  <span className="tag tag-secondary" style={{ fontSize: 10 }}>{ex.category}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => onAdd(ex)}>
                    {addLabel}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.ExerciseBrowser = ExerciseBrowser;
