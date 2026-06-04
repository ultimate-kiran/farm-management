import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function WeightTracker() {
  const { api, fetchNotifications } = useApp();
  const [goats, setGoats] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Separation of Modules: 'Adult' or 'Kid'
  const [currentModule, setCurrentModule] = useState('Adult'); 
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'

  // Form State
  const [form, setForm] = useState({
    goat_id: '',
    weight: '',
    recorded_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Selected Goat details for dynamic analysis
  const [selectedGoatRecords, setSelectedGoatRecords] = useState([]);
  const [selectedGoatAnalysis, setSelectedGoatAnalysis] = useState(null);

  // Bulk logging state
  const [bulkWeights, setBulkWeights] = useState({}); // { goat_id: { weight: '', notes: '' } }
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Edit State
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  // Reset form and bulk logging when switching modules
  useEffect(() => {
    setForm({
      goat_id: '',
      weight: '',
      recorded_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setSelectedGoatRecords([]);
    setSelectedGoatAnalysis(null);
  }, [currentModule]);

  // Update dynamic analysis whenever selected goat changes
  useEffect(() => {
    if (form.goat_id) {
      const goatRecords = records
        .filter(r => r.goat_id === form.goat_id)
        .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date)); // chronological for chart
      
      setSelectedGoatRecords(goatRecords);

      const goat = goats.find(g => g.goat_id === form.goat_id);
      if (goat) {
        // Chronological sort desc for stats
        const descRecords = [...goatRecords].reverse();
        const currentW = descRecords[0]?.weight || null;
        const prevW = descRecords[1]?.weight || null;
        let change = null;
        if (currentW !== null && prevW !== null) {
          change = currentW - prevW;
        }

        // Automatic Health Categorization based on Age
        const dob = new Date(goat.dob);
        const today = new Date();
        const diffDays = Math.ceil(Math.abs(today - dob) / (1000 * 60 * 60 * 24));
        const ageMonths = diffDays / 30.43;

        let category = 'Adult';
        let targetRange = '35 - 70 kg';
        let status = 'Optimal';
        let badgeColor = '#2E7D32';

        const weightVal = parseFloat(form.weight) || currentW || 0;

        if (ageMonths < 3.0) {
          category = 'Kid';
          targetRange = '5 - 15 kg';
          if (weightVal < 5) {
            status = 'Underweight';
            badgeColor = '#F57C00';
          } else if (weightVal > 15) {
            status = 'Overweight';
            badgeColor = '#D32F2F';
          }
        } else if (ageMonths < 12.0) {
          category = 'Growing';
          targetRange = '15 - 35 kg';
          if (weightVal < 15) {
            status = 'Underweight';
            badgeColor = '#F57C00';
          } else if (weightVal > 35) {
            status = 'Overweight';
            badgeColor = '#D32F2F';
          }
        } else {
          category = 'Adult';
          targetRange = '35 - 70 kg';
          if (weightVal < 35) {
            status = 'Underweight';
            badgeColor = '#F57C00';
          } else if (weightVal > 70) {
            status = 'Overweight';
            badgeColor = '#D32F2F';
          }
        }

        setSelectedGoatAnalysis({
          goat,
          category,
          targetRange,
          status,
          badgeColor,
          change,
          latestWeight: currentW
        });
      }
    } else {
      setSelectedGoatRecords([]);
      setSelectedGoatAnalysis(null);
    }
  }, [form.goat_id, form.weight, records, goats]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goatsData, recordsData] = await Promise.all([
        api('/goats'), // Get all goats so we have their category (Adult vs Kid)
        api('/weight')
      ]);
      setGoats(goatsData);
      setRecords(recordsData);

      // Initialize bulk weights state for active goats
      const initialBulk = {};
      goatsData.forEach(g => {
        initialBulk[g.goat_id] = { weight: '', notes: '' };
      });
      setBulkWeights(initialBulk);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/weight', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          weight: parseFloat(form.weight),
          recorded_date: new Date(form.recorded_date)
        })
      });
      setForm({ goat_id: '', weight: '', recorded_date: new Date().toISOString().split('T')[0], notes: '' });
      loadData();
      if (fetchNotifications) fetchNotifications();
      alert(`⚖️ Weight record added successfully to the ${currentModule}s module!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const payload = [];
    
    Object.entries(bulkWeights).forEach(([goat_id, data]) => {
      // Ensure we only submit weights for goats in the active module!
      const goat = goats.find(g => g.goat_id === goat_id);
      if (goat && goat.category === currentModule && data.weight) {
        payload.push({
          goat_id,
          weight: parseFloat(data.weight),
          recorded_date: new Date(bulkDate),
          notes: data.notes
        });
      }
    });

    if (payload.length === 0) {
      alert('Please enter at least one weight before submitting.');
      return;
    }

    setBulkLoading(true);
    try {
      await api('/weight', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert(`🎉 Successfully recorded ${payload.length} ${currentModule} weight records in bulk!`);
      
      // Reset bulk weights form for current module
      const resetBulk = { ...bulkWeights };
      goats.forEach(g => {
        if (g.category === currentModule) {
          resetBulk[g.goat_id] = { weight: '', notes: '' };
        }
      });
      setBulkWeights(resetBulk);
      loadData();
      if (fetchNotifications) fetchNotifications();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this weight record? This action is permanent.')) {
      try {
        await api(`/weight/${id}`, { method: 'DELETE' });
        loadData();
        if (fetchNotifications) fetchNotifications();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const openEdit = (record) => {
    setEditRecord(record);
    setEditForm({
      weight: record.weight,
      recorded_date: new Date(record.recorded_date).toISOString().split('T')[0],
      notes: record.notes || ''
    });
  };

  const saveEdit = async () => {
    try {
      await api(`/weight/${editRecord.weight_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          weight: parseFloat(editForm.weight),
          recorded_date: new Date(editForm.recorded_date),
          notes: editForm.notes
        })
      });
      setEditRecord(null);
      loadData();
      if (fetchNotifications) fetchNotifications();
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔀 Filtering logic based on currently selected Module ('Adult' vs 'Kid')
  const activeGoatsOfModule = goats.filter(g => g.category === currentModule && g.status === 'active');
  const allGoatsOfModule = goats.filter(g => g.category === currentModule);
  const allGoatsOfModuleIds = new Set(allGoatsOfModule.map(g => g.goat_id));
  
  const recordsOfModule = records.filter(r => allGoatsOfModuleIds.has(r.goat_id));

  // 📈 Calculation of dynamic metrics *specifically* for the current module
  const getLatestWeightsOfModule = () => {
    const latest = {};
    recordsOfModule.forEach(r => {
      // Only compute metrics for active goats in this module
      const g = activeGoatsOfModule.find(goat => goat.goat_id === r.goat_id);
      if (g) {
        if (!latest[r.goat_id]) {
          latest[r.goat_id] = r;
        } else if (new Date(r.recorded_date) > new Date(latest[r.goat_id].recorded_date)) {
          latest[r.goat_id] = r;
        }
      }
    });
    return latest;
  };

  const latestWeightsMap = getLatestWeightsOfModule();
  const latestWeightList = Object.values(latestWeightsMap);

  const avgWeight = latestWeightList.length > 0
    ? (latestWeightList.reduce((sum, r) => sum + r.weight, 0) / latestWeightList.length).toFixed(1)
    : '0.0';

  // Find Heaviest Goat in current module
  let heaviestGoat = { weight: 0, name: 'N/A', goat_id: '' };
  latestWeightList.forEach(r => {
    if (r.weight > heaviestGoat.weight) {
      const g = goats.find(goat => goat.goat_id === r.goat_id);
      heaviestGoat = {
        weight: r.weight,
        goat_id: r.goat_id,
        name: g ? g.name : r.goat_id
      };
    }
  });

  // Calculate Recent Weight Loss Alerts in current module
  let weightLossAlerts = 0;
  activeGoatsOfModule.forEach(g => {
    const goatRecs = recordsOfModule
      .filter(r => r.goat_id === g.goat_id)
      .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date)); // chronological desc
    
    if (goatRecs.length >= 2 && goatRecs[0].weight < goatRecs[1].weight) {
      weightLossAlerts++;
    }
  });

  if (loading && goats.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 🔀 Top Module Separator Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Weight Tracker & Growth Analytics</h1>
          <p style={{ color: 'var(--gray-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Currently managing weights for: <strong>{currentModule} Goats</strong>
          </p>
        </div>

        {/* Module Selector Pills */}
        <div style={{
          background: 'var(--gray-100, #f1f5f9)',
          padding: '6px',
          borderRadius: '30px',
          display: 'flex',
          gap: '4px',
          border: '1px solid var(--gray-200, #e2e8f0)'
        }}>
          <button
            onClick={() => { setCurrentModule('Adult'); }}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: currentModule === 'Adult' ? '#2E7D32' : 'transparent',
              color: currentModule === 'Adult' ? '#ffffff' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            🐐 Adult Goats
          </button>
          <button
            onClick={() => { setCurrentModule('Kid'); }}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: currentModule === 'Kid' ? '#006064' : 'transparent',
              color: currentModule === 'Kid' ? '#ffffff' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            🐣 Kids Module
          </button>
        </div>
      </div>

      {/* 📊 Metrics Panel (Dynamically filtered by currentModule) */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card" style={{ borderLeft: currentModule === 'Adult' ? '5px solid #2E7D32' : '5px solid #006064' }}>
          <div className="stat-icon green" style={{ background: currentModule === 'Adult' ? 'rgba(46,125,50,0.1)' : 'rgba(0,96,100,0.1)', color: currentModule === 'Adult' ? '#2E7D32' : '#006064' }}>⚖️</div>
          <div className="stat-info">
            <h3>{avgWeight} kg</h3>
            <p>Average {currentModule} Weight</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '5px solid #1976D2' }}>
          <div className="stat-icon blue">🏆</div>
          <div className="stat-info">
            <h3>{heaviestGoat.weight > 0 ? `${heaviestGoat.weight} kg` : 'N/A'}</h3>
            <p>Heaviest {currentModule}: {heaviestGoat.name}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '5px solid #ef4444' }}>
          <div className="stat-icon orange" style={{ background: '#FEE2E2', color: '#EF4444' }}>🚨</div>
          <div className="stat-info">
            <h3>{weightLossAlerts}</h3>
            <p>{currentModule} Loss Alerts</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '5px solid #9C27B0' }}>
          <div className="stat-icon brown" style={{ background: '#F3E5F5', color: '#9C27B0' }}>📊</div>
          <div className="stat-info">
            <h3>{recordsOfModule.length}</h3>
            <p>Total {currentModule} Records</p>
          </div>
        </div>
      </div>

      {/* 🎛️ Navigation Tabs */}
      <div className="profile-tabs" style={{ marginBottom: 24, borderBottom: '2px solid var(--gray-200)' }}>
        <button 
          className={`profile-tab ${activeTab === 'single' ? 'active' : ''}`} 
          onClick={() => setActiveTab('single')}
          style={{ fontSize: '0.95rem', paddingBottom: 12 }}
        >
          📝 Single Weight Entry
        </button>
        <button 
          className={`profile-tab ${activeTab === 'bulk' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bulk')}
          style={{ fontSize: '0.95rem', paddingBottom: 12 }}
        >
          📋 Bulk Weight Logging (Checkup Sheet)
        </button>
      </div>

      {/* ── Single Entry Workflow ── */}
      {activeTab === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Record Weight Form */}
          <div className="form-card" style={{ margin: 0 }}>
            <h3>Log {currentModule} Weight</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Select {currentModule} Goat</label>
                  <select value={form.goat_id} onChange={(e) => setForm({ ...form, goat_id: e.target.value })} required>
                    <option value="">Select {currentModule}</option>
                    {activeGoatsOfModule.map(g => (
                      <option key={g.goat_id} value={g.goat_id}>{g.name || g.goat_id} ({g.goat_id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={form.weight} 
                    onChange={(e) => setForm({ ...form, weight: e.target.value })} 
                    required 
                    placeholder="Enter weight in kg"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.recorded_date} onChange={(e) => setForm({ ...form, recorded_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Healthy, post-feeding" />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-block" 
                style={{ background: currentModule === 'Adult' ? '#2E7D32' : '#006064' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : `Add ${currentModule} Weight`}
              </button>
            </form>
          </div>

          {/* Dynamic Selection Analysis & Chart */}
          <div style={{
            background: '#ffffff', borderRadius: 12, padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', border: '1px solid var(--gray-200)'
          }}>
            {!form.goat_id ? (
              <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 40 }}>
                <span style={{ fontSize: 48 }}>📈</span>
                <h4 style={{ marginTop: 12 }}>Select a {currentModule.toLowerCase()} to view dynamic growth trend</h4>
                <p style={{ fontSize: '0.85rem' }}>Growth curves, health categories, and alert updates appear dynamically.</p>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Growth Curve: {selectedGoatAnalysis?.goat.name || form.goat_id}</span>
                  {selectedGoatAnalysis && (
                    <span style={{
                      background: selectedGoatAnalysis.badgeColor,
                      color: 'white', fontSize: 12, padding: '3px 10px',
                      borderRadius: 12, fontWeight: 700
                    }}>
                      {selectedGoatAnalysis.status}
                    </span>
                  )}
                </h3>

                {selectedGoatAnalysis && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, flex: 1, fontSize: '0.85rem' }}>
                      <span style={{ display: 'block', color: 'var(--gray-600)' }}>Age Classification</span>
                      <strong>{selectedGoatAnalysis.category}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, flex: 1, fontSize: '0.85rem' }}>
                      <span style={{ display: 'block', color: 'var(--gray-600)' }}>Target Range</span>
                      <strong>{selectedGoatAnalysis.targetRange}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, flex: 1, fontSize: '0.85rem' }}>
                      <span style={{ display: 'block', color: 'var(--gray-600)' }}>Latest Change</span>
                      {selectedGoatAnalysis.change !== null ? (
                        <strong style={{ color: selectedGoatAnalysis.change >= 0 ? '#2E7D32' : '#EF4444' }}>
                          {selectedGoatAnalysis.change >= 0 ? '📈 +' : '📉 -'}{Math.abs(selectedGoatAnalysis.change).toFixed(1)} kg
                        </strong>
                      ) : (
                        <strong>First entry</strong>
                      )}
                    </div>
                  </div>
                )}

                {/* Weight Loss Alert banner */}
                {selectedGoatAnalysis?.change < 0 && (
                  <div style={{
                    background: '#FEE2E2', borderLeft: '4px solid #EF4444',
                    padding: '8px 16px', borderRadius: 6, marginBottom: 16,
                    color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600
                  }}>
                    ⚠️ Warning: Significant weight loss detected! Please verify health logs or treatments.
                  </div>
                )}

                {/* Recharts Curve */}
                {selectedGoatRecords.length > 0 ? (
                  <div style={{ height: 180, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedGoatRecords.map(r => ({
                        date: new Date(r.recorded_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        weight: r.weight
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" style={{ fontSize: 10 }} />
                        <YAxis style={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke={currentModule === 'Adult' ? '#2E7D32' : '#006064'} strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>No historical weights recorded to plot trend.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk Logging Workflow ── */}
      {activeTab === 'bulk' && (
        <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid var(--gray-200)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3>Bulk {currentModule} Weighing Checkup Sheet</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Fill in the weights for active {currentModule.toLowerCase()} goats. Blank weights will be ignored on submit.
              </p>
            </div>
            <div className="form-group" style={{ margin: 0, width: '220px' }}>
              <label style={{ marginBottom: 4 }}>Weighing Date</label>
              <input 
                type="date" 
                value={bulkDate} 
                onChange={(e) => setBulkDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          {activeGoatsOfModule.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 20 }}>No active {currentModule.toLowerCase()} goats available to weigh.</p>
          ) : (
            <form onSubmit={handleBulkSubmit}>
              <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 8, marginBottom: 20 }}>
                <table style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                    <tr>
                      <th style={{ width: '120px' }}>Goat ID</th>
                      <th>Goat Name</th>
                      <th style={{ width: '160px' }}>Weight (kg)</th>
                      <th>Notes / Health Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGoatsOfModule.map(g => (
                      <tr key={g.goat_id}>
                        <td><span className="goat-card-id">{g.goat_id}</span></td>
                        <td><strong>{g.name || 'Unnamed Kid'}</strong></td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Enter Weight"
                            value={bulkWeights[g.goat_id]?.weight || ''}
                            onChange={(e) => setBulkWeights({
                              ...bulkWeights,
                              [g.goat_id]: { ...bulkWeights[g.goat_id], weight: e.target.value }
                            })}
                            style={{ margin: 0, padding: '6px 10px', fontSize: '0.9rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Fit, post-pregnancy recovery"
                            value={bulkWeights[g.goat_id]?.notes || ''}
                            onChange={(e) => setBulkWeights({
                              ...bulkWeights,
                              [g.goat_id]: { ...bulkWeights[g.goat_id], notes: e.target.value }
                            })}
                            style={{ margin: 0, padding: '6px 10px', fontSize: '0.9rem' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const reset = { ...bulkWeights };
                    activeGoatsOfModule.forEach(g => { reset[g.goat_id] = { weight: '', notes: '' }; });
                    setBulkWeights(reset);
                  }}
                  disabled={bulkLoading}
                >
                  Clear Sheet
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: currentModule === 'Adult' ? 'var(--success)' : '#006064' }}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? 'Logging...' : `Submit Bulk ${currentModule} Weights 📋`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Weight Log Table ── */}
      <h3 style={{ marginBottom: 16 }}>All {currentModule} Weight History</h3>
      <div className="goats-table">
        <table>
          <thead>
            <tr>
              <th>Goat ID</th>
              <th>Goat Name</th>
              <th>Weight (kg)</th>
              <th>Date</th>
              <th>Trend Alert</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recordsOfModule.map((r, index) => {
              const g = goats.find(goat => goat.goat_id === r.goat_id);
              
              // Find if this record was a weight loss compared to chronological previous record
              const goatRecords = recordsOfModule
                .filter(rec => rec.goat_id === r.goat_id)
                .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date)); // oldest first
              
              const chronologicalIndex = goatRecords.findIndex(rec => rec.weight_id === r.weight_id);
              let lossAlert = false;
              let difference = 0;
              if (chronologicalIndex > 0) {
                const prev = goatRecords[chronologicalIndex - 1];
                if (r.weight < prev.weight) {
                  lossAlert = true;
                  difference = prev.weight - r.weight;
                }
              }

              return (
                <tr key={r.weight_id}>
                  <td><span className="goat-card-id">{r.goat_id}</span></td>
                  <td><strong>{g ? g.name : 'Unnamed Kid'}</strong></td>
                  <td><strong>{r.weight} kg</strong></td>
                  <td>{new Date(r.recorded_date).toLocaleDateString()}</td>
                  <td>
                    {lossAlert ? (
                      <span className="badge badge-inactive" style={{ background: '#FFEBEE', color: '#C62828', fontSize: 11, fontWeight: 700 }}>
                        📉 -{difference.toFixed(1)} kg Alert
                      </span>
                    ) : (
                      <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>{r.notes || '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="action-btn" style={{ background: 'var(--warning)', color: 'white' }} onClick={() => openEdit(r)}>Edit</button>
                    <button className="action-btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => handleDelete(r.weight_id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {recordsOfModule.length === 0 && (
          <p style={{ padding: 20, textAlign: 'center', color: 'var(--gray-600)' }}>No {currentModule.toLowerCase()} weight records logged yet.</p>
        )}
      </div>

      {/* ── Edit Weight Record Modal ── */}
      {editRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setEditRecord(null)}>
          <div className="form-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Weight Record</h3>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={editForm.recorded_date} onChange={(e) => setEditForm({ ...editForm, recorded_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeightTracker;