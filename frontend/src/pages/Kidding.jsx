import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function Kidding() {
  const { api } = useApp();
  const navigate = useNavigate();
  const [allGoats, setAllGoats] = useState([]);
  const [records, setRecords] = useState([]);

  // Edit kid goat modal state
  const [editGoat, setEditGoat] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const goats = await api('/goats');
    const kidding = await api('/kidding');
    setAllGoats(goats);
    setRecords(kidding);
  };

  const getGoat = (id) => allGoats.find(g => g.goat_id === id);
  const getGoatName = (id) => getGoat(id)?.name || id;

  const openEditKid = (kidId) => {
    const goat = getGoat(kidId);
    if (!goat) return;
    setEditGoat(goat);
    setEditForm({
      name: goat.name || '',
      gender: goat.gender || 'male',
      breed: goat.breed || 'Country',
      color: goat.color || 'Black',
      status: goat.status || 'active',
      dob: goat.dob ? new Date(goat.dob).toISOString().split('T')[0] : ''
    });
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await api(`/goats/${editGoat.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          dob: editForm.dob ? new Date(editForm.dob) : undefined
        })
      });
      setEditGoat(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Kidding / Kids</h1>

      {/* ── Kidding History ── */}
      <h3 style={{ marginBottom: 16 }}>Kidding History</h3>
      <div>
        {records.map(r => (
          <div key={r.kidding_id} className="treatment-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h4 style={{ margin: 0 }}>
                  Kidding on {new Date(r.kidding_date).toLocaleDateString()}
                </h4>
                <p style={{ margin: '4px 0 0' }}>
                  <strong>Female:</strong> {getGoatName(r.mother_goat_id)} &nbsp;|&nbsp;
                  <strong>Male:</strong> {getGoatName(r.father_goat_id)}
                </p>
                <p style={{ margin: '2px 0 0' }}>
                  <strong>Number of Kids:</strong> {r.kids_count}
                </p>
              </div>
              <span style={{
                background: 'var(--success, #22c55e)', color: '#fff',
                borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600
              }}>
                {r.kids_count} kid{r.kids_count > 1 ? 's' : ''}
              </span>
            </div>

            {r.kids?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ fontSize: 13, color: 'var(--gray-700)' }}>Kids:</strong>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.kids.map(kidId => {
                    const kid = getGoat(kidId);
                    return (
                      <div key={kidId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--gray-50, #f9fafb)', borderRadius: 8,
                        padding: '8px 12px', flexWrap: 'wrap', gap: 8,
                        border: '1px solid var(--gray-200, #e5e7eb)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>🐐</span>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                              {kid?.name || `Kid ${kidId}`}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--gray-500)' }}>
                              {kidId}
                            </span>
                            {kid && (
                              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                {kid.gender && (
                                  <span className={`badge badge-${kid.gender}`} style={{ fontSize: 11 }}>
                                    {kid.gender}
                                  </span>
                                )}
                                {kid.breed && (
                                  <span className="goat-card-detail" style={{ fontSize: 11, padding: '1px 8px' }}>
                                    {kid.breed}
                                  </span>
                                )}
                                {kid.color && (
                                  <span className="goat-card-detail" style={{ fontSize: 11, padding: '1px 8px' }}>
                                    {kid.color}
                                  </span>
                                )}
                                {kid.status && (
                                  <span className={`badge badge-${kid.status}`} style={{ fontSize: 11 }}>
                                    {kid.status}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="action-btn"
                            style={{ background: 'var(--warning)', color: 'white', fontSize: 12 }}
                            onClick={() => openEditKid(kidId)}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn"
                            style={{ background: 'var(--info, #3b82f6)', color: 'white', fontSize: 12 }}
                            onClick={() => navigate(`/goats/${kidId}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {records.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>
            No kidding records
          </p>
        )}
      </div>

      {/* ── Edit Kid Modal ── */}
      {editGoat && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setEditGoat(null)}
        >
          <div className="form-card" style={{ maxWidth: 500, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Kid — {editGoat.name || editGoat.goat_id}</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Breed</label>
                <select value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}>
                  <option value="Country">Country</option>
                  <option value="Local">Local</option>
                  <option value="Saanen">Saanen</option>
                  <option value="Alpine">Alpine</option>
                  <option value="Boer">Boer</option>
                  <option value="Nubian">Nubian</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <select value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                  <option value="Brown">Brown</option>
                  <option value="Gray">Gray</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditGoat(null)} disabled={editLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kidding;