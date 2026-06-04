import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function Search() {
  const { api } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ goats: [], matings: [], treatments: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      search();
    } else {
      setResults({ goats: [], matings: [], treatments: [] });
    }
  }, [query]);

  const search = async () => {
    setLoading(true);
    try {
      const [goats, matings, treatments] = await Promise.all([
        api(`/goats?search=${query}`),
        api('/mating'),
        api('/treatments')
      ]);

      const filteredMatings = matings.filter(m => m.mating_id.toLowerCase().includes(query.toLowerCase()));
      const filteredTreatments = treatments.filter(t => t.treatment_id.toLowerCase().includes(query.toLowerCase()) || t.problem.toLowerCase().includes(query.toLowerCase()));

      setResults({ goats, matings: filteredMatings, treatments: filteredTreatments });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Search</h1>

      <div className="form-group" style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search by name, ID, or keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ fontSize: '1.1rem', padding: '16px' }}
        />
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && query.length >= 2 && (
        <div>
          {results.goats.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Goats ({results.goats.length})</h3>
              {results.goats.map(g => (
                <div key={g.goat_id} className="search-item" onClick={() => navigate(`/goats/${g.goat_id}`)}>
                  <h4>{g.name} ({g.goat_id})</h4>
                  <p>{g.gender} | {g.breed} | {g.status}</p>
                </div>
              ))}
            </div>
          )}

          {results.matings.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Mating Records ({results.matings.length})</h3>
              {results.matings.map(m => (
                <div key={m.mating_id} className="search-item">
                  <h4>Mating: {m.male_goat_id} x {m.female_goat_id}</h4>
                  <p>Date: {new Date(m.mating_date).toLocaleDateString()} | Status: {m.status}</p>
                </div>
              ))}
            </div>
          )}

          {results.treatments.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Treatments ({results.treatments.length})</h3>
              {results.treatments.map(t => (
                <div key={t.treatment_id} className="search-item">
                  <h4>{t.problem}</h4>
                  <p>Goat: {t.goat_id} | Date: {new Date(t.treatment_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {results.goats.length === 0 && results.matings.length === 0 && results.treatments.length === 0 && (
            <div className="no-data">
              <h3>No results found</h3>
              <p>Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;