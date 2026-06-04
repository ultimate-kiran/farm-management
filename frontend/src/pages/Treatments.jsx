import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function Treatments() {
  const { api, fetchNotifications } = useApp();
  const [goats, setGoats] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([{ medicine_name: '', dosage: '', type: 'tablet', instructions: '', duration: '' }]);
  const [form, setForm] = useState({
    goat_id: '',
    treatment_date: new Date().toISOString().split('T')[0],
    problem: '',
    notes: '',
    treated_by: '',
    next_checkup: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [goatsData, recordsData] = await Promise.all([
      api('/goats?status=active'),
      api('/treatments')
    ]);
    setGoats(goatsData);
    setRecords(recordsData);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { medicine_name: '', dosage: '', type: 'tablet', instructions: '', duration: '' }]);
  };

  const removeMedicine = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty medicine entries
      const filteredMedicines = medicines.filter(m => m.medicine_name.trim() !== '');

      await api('/treatments', {
        method: 'POST',
        body: JSON.stringify({
          goat_id: form.goat_id,
          treatment_date: new Date(form.treatment_date),
          problem: form.problem,
          notes: form.notes,
          treated_by: form.treated_by || null,
          next_checkup: form.next_checkup ? new Date(form.next_checkup) : null,
          medicines: filteredMedicines
        })
      });
      setForm({ goat_id: '', treatment_date: new Date().toISOString().split('T')[0], problem: '', notes: '', treated_by: '', next_checkup: '' });
      setMedicines([{ medicine_name: '', dosage: '', type: 'tablet', instructions: '', duration: '' }]);
      loadData();
      if (fetchNotifications) fetchNotifications();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Treatments & Medications</h1>

      <div className="form-card" style={{ marginBottom: 24 }}>
        <h3>Add Treatment</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Select Goat</label>
              <select value={form.goat_id} onChange={(e) => setForm({ ...form, goat_id: e.target.value })} required>
                <option value="">Select Goat</option>
                {goats.map(g => (<option key={g.goat_id} value={g.goat_id}>{g.name} ({g.goat_id})</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Treatment Date</label>
              <input type="date" value={form.treatment_date} onChange={(e) => setForm({ ...form, treatment_date: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Problem / Diagnosis</label>
            <input type="text" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Treated By</label>
              <input type="text" value={form.treated_by} onChange={(e) => setForm({ ...form, treated_by: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Next Checkup Date</label>
              <input type="date" value={form.next_checkup} onChange={(e) => setForm({ ...form, next_checkup: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--gray-200)', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
          </div>

          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💊</span> Medicines
            </h4>

            {medicines.map((med, i) => (
              <div key={i} style={{
                background: 'var(--gray-50)',
                padding: 16,
                borderRadius: 8,
                marginBottom: 12,
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary-green)' }}>Medicine #{i + 1}</span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(i)}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Medicine Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin"
                      value={med.medicine_name}
                      onChange={(e) => updateMedicine(i, 'medicine_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Type</label>
                    <select value={med.type} onChange={(e) => updateMedicine(i, 'type', e.target.value)}>
                      <option value="tablet">Tablet</option>
                      <option value="injection">Injection</option>
                      <option value="syrup">Syrup</option>
                      <option value="ointment">Ointment</option>
                      <option value="powder">Powder</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem' }}>Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="add-medicine-btn" onClick={addMedicine}>
              + Add Another Medicine
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? 'Saving...' : 'Add Treatment'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 16 }}>Treatment History</h3>
      <div>
        {records.length === 0 ? (
          <div className="no-data">
            <p>No treatment records yet</p>
          </div>
        ) : (
          records.map(r => (
            <div key={r.treatment_id} className="treatment-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ marginBottom: 4 }}>{r.problem}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    {goats.find(g => g.goat_id === r.goat_id)?.name || r.goat_id}
                  </span>
                </div>
                <span style={{
                  background: 'var(--accent-green)',
                  color: 'var(--dark-green)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {new Date(r.treatment_date).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                {r.treated_by && <span><strong>Treated by:</strong> {r.treated_by}</span>}
                {r.next_checkup && <span><strong>Next checkup:</strong> {new Date(r.next_checkup).toLocaleDateString()}</span>}
              </div>

              {r.notes && (
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: 12 }}>
                  <strong>Notes:</strong> {r.notes}
                </p>
              )}

              {r.medicines?.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
                  <h5 style={{ marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Prescribed Medicines:</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {r.medicines.map((m, i) => (
                      <div key={i} style={{
                        background: 'var(--cream)',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: '0.85rem'
                      }}>
                        <strong>{m.medicine_name}</strong>
                        <span style={{ color: 'var(--gray-600)' }}> - {m.dosage} ({m.type})</span>
                        {m.duration && <span style={{ color: 'var(--gray-600)' }}> for {m.duration}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Treatments;