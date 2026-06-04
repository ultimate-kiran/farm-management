import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

function AllGoats() {
  const { api } = useApp();
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', gender: '', breed: '', status: '', source_type: '' });
  const [view, setView] = useState('table');
  const [editGoat, setEditGoat] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  const handleExportExcel = () => {
    if (goats.length === 0) {
      alert('No data available to export.');
      return;
    }
    
    // Format data for spreadsheet
    const formattedData = goats.map(g => ({
      'Goat ID': g.goat_id,
      'Name': g.name || 'Unnamed',
      'Gender': g.gender,
      'Breed': g.breed || 'Country',
      'Color': g.color || 'Mixed',
      'Status': g.status,
      'Date of Birth': g.dob ? new Date(g.dob).toLocaleDateString() : 'N/A',
      'Source': g.source_type === 'born' ? 'Born in Farm' : 'Purchased'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Adult Goats');
    XLSX.writeFile(workbook, 'V_Organic_Adult_Goats.xlsx');
  };

  // Secure Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Secure Sell Modal State (Record Goat Sale Form)
  const [sellTarget, setSellTarget] = useState(null);
  const [sellForm, setSellForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    weight_at_sale: '',
    sale_price: '',
    buyer_details: '',
    reason_for_sale: ''
  });
  const [sellLoading, setSellLoading] = useState(false);

  // Success Toast State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadGoats();
  }, [filters]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadGoats = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        category: 'Adult'
      }).toString();
      const data = await api(`/goats?${params}`);
      setGoats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (goat) => {
    setEditGoat(goat);
    setEditForm({
      name: goat.name,
      gender: goat.gender,
      breed: goat.breed,
      color: goat.color,
      status: goat.status,
      dob: goat.dob ? new Date(goat.dob).toISOString().split('T')[0] : ''
    });
  };

  const saveEdit = async () => {
    try {
      await api(`/goats/${editGoat.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          gender: editForm.gender,
          breed: editForm.breed,
          color: editForm.color,
          status: editForm.status,
          dob: new Date(editForm.dob)
        })
      });
      setEditGoat(null);
      loadGoats();
      setToast('Goat details updated successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const openDeleteModal = (goat) => {
    setDeleteTarget(goat);
    setConfirmText('');
    setShowValidation(false);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setConfirmText('');
    setShowValidation(false);
  };

  const openSellModal = (goat) => {
    setSellTarget(goat);
    setSellForm({
      sale_date: new Date().toISOString().split('T')[0],
      weight_at_sale: '',
      sale_price: '',
      buyer_details: '',
      reason_for_sale: ''
    });
  };

  const closeSellModal = () => {
    setSellTarget(null);
  };

  const handleConfirmTextChange = (e) => {
    const text = e.target.value;
    setConfirmText(text);
    if (text.length > 0 && text !== 'DELETE') {
      setShowValidation(true);
    } else {
      setShowValidation(false);
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') {
      setShowValidation(true);
      return;
    }

    setDeleteLoading(true);
    try {
      await api(`/goats/${deleteTarget.goat_id}`, { method: 'DELETE' });
      setGoats(prev => prev.filter(g => g.goat_id !== deleteTarget.goat_id));
      closeDeleteModal();
      setToast('Goat deleted successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (!sellForm.sale_date || !sellForm.sale_price || !sellForm.weight_at_sale) {
      alert('⚠️ Validation Blocked: Sale Date, Sale Price (INR), and Weight at Sale are mandatory.');
      return;
    }

    setSellLoading(true);
    try {
      const payload = {
        status: 'sold',
        sale_details: {
          sale_date: new Date(sellForm.sale_date),
          weight_at_sale: parseFloat(sellForm.weight_at_sale),
          sale_price: parseFloat(sellForm.sale_price),
          profit_loss: parseFloat(sellForm.sale_price) - (sellTarget.purchase_details?.purchase_price || 0),
          buyer_details: sellForm.buyer_details,
          reason_for_sale: sellForm.reason_for_sale
        }
      };

      await api(`/goats/${sellTarget.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      closeSellModal();
      loadGoats();
      setToast('Goat marked as Sold successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSellLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Adult Goats</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
          >
            📥 Export to Excel
          </button>
          <Link to="/goats/add" className="btn btn-primary">+ Add Goat</Link>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pregnant">Pregnant</option>
          <option value="deceased">Deceased</option>
        </select>

        <select value={filters.source_type} onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}>
          <option value="">All Sources</option>
          <option value="born">Born in Farm</option>
          <option value="purchased">Purchased</option>
        </select>

        <div className="view-toggle">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button>
          <button className={view === 'card' ? 'active' : ''} onClick={() => setView('card')}>Card</button>
        </div>
      </div>

      {goats.length === 0 ? (
        <div className="no-data">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="5"/>
            <path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
          </svg>
          <h3>No goats found</h3>
          <p>Add your first goat to get started</p>
          <Link to="/goats/add" className="btn btn-primary" style={{ marginTop: 16 }}>+ Add Goat</Link>
        </div>
      ) : view === 'table' ? (
        <div className="goats-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Breed</th>
                <th>Color</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {goats.map(goat => (
                <tr key={goat.goat_id} onClick={() => navigate(`/goats/${goat.goat_id}`)} style={{ cursor: 'pointer' }}>
                  <td><span className="goat-card-id">{goat.goat_id}</span></td>
                  <td>{goat.name}</td>
                  <td><span className={`badge badge-${goat.gender}`}>{goat.gender}</span></td>
                  <td>{goat.breed}</td>
                  <td>{goat.color}</td>
                  <td>
                    <span className="badge" style={{
                      background: goat.source_type === 'born' ? 'rgba(56, 142, 60, 0.1)' : 'rgba(245, 124, 0, 0.12)',
                      color: goat.source_type === 'born' ? '#2e7d32' : '#d97706',
                      border: goat.source_type === 'born' ? '1px solid rgba(56, 142, 60, 0.2)' : '1px solid rgba(245, 124, 0, 0.2)'
                    }}>
                      {goat.source_type === 'born' ? 'Farm Born' : 'Purchased'}
                    </span>
                  </td>
                  <td><span className={`badge badge-${goat.status}`}>{goat.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gray-600)',
                          cursor: 'pointer',
                          fontSize: '1.25rem',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'var(--gray-200)';
                          e.target.style.color = 'var(--text-dark)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                          e.target.style.color = 'var(--gray-600)';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === goat.goat_id ? null : goat.goat_id);
                        }}
                      >
                        ⋮
                      </button>

                      {activeDropdown === goat.goat_id && (
                        <>
                          <div 
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 100,
                              background: 'transparent',
                              cursor: 'default'
                            }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                            }}
                          />
                          <div 
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '4px',
                              background: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              border: '1px solid var(--gray-200)',
                              zIndex: 101,
                              minWidth: '150px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '10px 16px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: 'var(--info)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                              onMouseLeave={(e) => e.target.style.background = 'none'}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(goat);
                                setActiveDropdown(null);
                              }}
                            >
                              Edit Details
                            </button>
                            {goat.status !== 'sold' && (
                              <button
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '10px 16px',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.88rem',
                                  fontWeight: '600',
                                  color: 'var(--warning)',
                                  transition: 'background 0.2s',
                                  borderTop: '1px solid var(--gray-100)'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                                onMouseLeave={(e) => e.target.style.background = 'none'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSellModal(goat);
                                  setActiveDropdown(null);
                                }}
                              >
                                Record Sale
                              </button>
                            )}
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '10px 16px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                color: 'var(--danger)',
                                transition: 'background 0.2s',
                                borderTop: '1px solid var(--gray-100)'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                              onMouseLeave={(e) => e.target.style.background = 'none'}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(goat);
                                setActiveDropdown(null);
                              }}
                            >
                              Delete Record
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {goats.map(goat => (
            <div key={goat.goat_id} className="goat-card" onClick={() => navigate(`/goats/${goat.goat_id}`)} style={{ cursor: 'pointer' }}>
              <div className="goat-card-header">
                <div>
                  <h4>{goat.name}</h4>
                  <span className="goat-card-id">{goat.goat_id}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className={`badge badge-${goat.gender}`}>{goat.gender}</span>
                  <span className="badge" style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    background: goat.source_type === 'born' ? 'rgba(56, 142, 60, 0.1)' : 'rgba(245, 124, 0, 0.12)',
                    color: goat.source_type === 'born' ? '#2e7d32' : '#d97706',
                    border: goat.source_type === 'born' ? '1px solid rgba(56, 142, 60, 0.2)' : '1px solid rgba(245, 124, 0, 0.2)'
                  }}>
                    {goat.source_type === 'born' ? 'Farm Born' : 'Purchased'}
                  </span>
                </div>
              </div>
              <div className="goat-card-details">
                <span className="goat-card-detail">{goat.breed}</span>
                <span className="goat-card-detail">{goat.color}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', margin: 0 }}>DOB: {new Date(goat.dob).toLocaleDateString()}</p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gray-600)',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-200)';
                      e.target.style.color = 'var(--text-dark)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none';
                      e.target.style.color = 'var(--gray-600)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === goat.goat_id ? null : goat.goat_id);
                    }}
                  >
                    ⋮
                  </button>

                  {activeDropdown === goat.goat_id && (
                    <>
                      <div 
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 100,
                          background: 'transparent',
                          cursor: 'default'
                        }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: '100%',
                          marginBottom: '4px',
                          background: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          border: '1px solid var(--gray-200)',
                          zIndex: 101,
                          minWidth: '150px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--info)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                          onMouseLeave={(e) => e.target.style.background = 'none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(goat);
                            setActiveDropdown(null);
                          }}
                        >
                          Edit Details
                        </button>
                        {goat.status !== 'sold' && (
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '10px 16px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '0.88rem',
                              fontWeight: '600',
                              color: 'var(--warning)',
                              transition: 'background 0.2s',
                              borderTop: '1px solid var(--gray-100)'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                            onMouseLeave={(e) => e.target.style.background = 'none'}
                            onClick={(e) => {
                              e.stopPropagation();
                              openSellModal(goat);
                              setActiveDropdown(null);
                            }}
                          >
                            Record Sale
                          </button>
                        )}
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 16px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--danger)',
                            transition: 'background 0.2s',
                            borderTop: '1px solid var(--gray-100)'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                          onMouseLeave={(e) => e.target.style.background = 'none'}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(goat);
                            setActiveDropdown(null);
                          }}
                        >
                          Delete Record
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Goat Modal ── */}
      {editGoat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setEditGoat(null)}>
          <div className="form-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Goat</h3>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
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
                <input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => {
                    if (e.target.value === 'sold') {
                      // Close edit modal, open sell modal dynamically!
                      const target = editGoat;
                      setEditGoat(null);
                      openSellModal(target);
                    } else {
                      setEditForm({ ...editForm, status: e.target.value });
                    }
                  }}
                >
                  <option value="active">Active</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => setEditGoat(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Goat Sale Modal (Frictionless Redirect Form) ── */}
      {sellTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1010
        }} onClick={closeSellModal}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f1f5f9',
            animation: 'scaleIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                background: '#fef3c7',
                color: '#d97706',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                💰
              </div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Record Goat Sale</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Recording sale specifications for <strong style={{ color: '#0f172a' }}>{sellTarget.name || 'Unnamed'} ({sellTarget.goat_id})</strong>.
            </p>

            <form onSubmit={handleSellSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Sale Date *</label>
                  <input
                    type="date"
                    value={sellForm.sale_date}
                    onChange={(e) => setSellForm({ ...sellForm, sale_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Weight at Sale (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sellForm.weight_at_sale}
                    onChange={(e) => setSellForm({ ...sellForm, weight_at_sale: e.target.value })}
                    required
                    placeholder="e.g. 45.2"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Sale Price (INR) *</label>
                  <input
                    type="number"
                    step="1"
                    value={sellForm.sale_price}
                    onChange={(e) => setSellForm({ ...sellForm, sale_price: e.target.value })}
                    required
                    placeholder="Amount in INR"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Est. Profit / Loss (INR)</label>
                  <div style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: (parseFloat(sellForm.sale_price) - (sellTarget.purchase_details?.purchase_price || 0)) >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {sellForm.sale_price 
                      ? `${(parseFloat(sellForm.sale_price) - (sellTarget.purchase_details?.purchase_price || 0)) >= 0 ? '+' : ''}${(parseFloat(sellForm.sale_price) - (sellTarget.purchase_details?.purchase_price || 0)).toFixed(2)}`
                      : '0.00'}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Buyer Details (Optional)</label>
                <input
                  type="text"
                  value={sellForm.buyer_details}
                  onChange={(e) => setSellForm({ ...sellForm, buyer_details: e.target.value })}
                  placeholder="e.g. Ramesh, Chennai"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Reason for Sale (Optional)</label>
                <input
                  type="text"
                  value={sellForm.reason_for_sale}
                  onChange={(e) => setSellForm({ ...sellForm, reason_for_sale: e.target.value })}
                  placeholder="e.g. Market demand, stocking balance"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={closeSellModal}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  disabled={sellLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '11px',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  disabled={sellLoading}
                >
                  {sellLoading ? 'Processing...' : 'Confirm Sale 💸'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Secure Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)', // Elegant dark backdrop
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1010
        }} onClick={closeDeleteModal}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f1f5f9',
            animation: 'scaleIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header / Warning Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                background: '#fee2e2',
                color: '#ef4444',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                ⚠️
              </div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Delete Goat</h3>
            </div>

            {/* Warning Message */}
            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 12px' }}>
              This action is permanent and cannot be undone.
            </p>

            {/* Target Goat Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: '0.9rem',
              color: '#334155'
            }}>
              <div><strong>Goat ID:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{deleteTarget.goat_id}</span></div>
              <div style={{ marginTop: 4 }}><strong>Goat Name:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{deleteTarget.name || 'Unnamed'}</span></div>
            </div>

            {/* Confirmation Form */}
            <form onSubmit={handleConfirmDelete}>
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8
                }}>
                  Type <span style={{ color: '#ef4444', fontWeight: 700 }}>DELETE</span> to confirm deletion.
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={handleConfirmTextChange}
                  required
                  placeholder="Type DELETE"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: showValidation ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  autoFocus
                />
                {showValidation && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 6, marginBottom: 0 }}>
                    Please type DELETE to continue.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s'
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmText !== 'DELETE' || deleteLoading}
                  style={{
                    flex: 1.5,
                    padding: '11px',
                    borderRadius: '8px',
                    background: confirmText === 'DELETE' ? '#ef4444' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s'
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Success Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#10b981', // Sleek green background
          color: 'white',
          padding: '14px 28px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1020,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.95rem',
          fontWeight: 600,
          border: '1px solid #059669',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <span style={{ fontSize: '18px' }}>✅</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default AllGoats;