import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// Predefined color presets with corresponding CSS color values for previews
const COLOR_PRESETS = [
  { name: 'White', value: '#FFFFFF', border: '#cbd5e1', text: '#334155' },
  { name: 'Black', value: '#1E293B', border: 'transparent', text: '#FFFFFF' },
  { name: 'Brown', value: '#78350F', border: 'transparent', text: '#FFFFFF' },
  { name: 'Gray', value: '#64748B', border: 'transparent', text: '#FFFFFF' },
  { name: 'Mixed', value: 'linear-gradient(135deg, #FFFFFF 0%, #78350F 50%, #1E293B 100%)', border: '#cbd5e1', text: '#334155' }
];

function Kids() {
  const { api, fetchNotifications } = useApp();
  const navigate = useNavigate();
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', gender: '', activeTab: 'all' });
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Secure Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Secure Sell Modal State (Record Kid Sale Form)
  const [sellTarget, setSellTarget] = useState(null);
  const [sellForm, setSellForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    weight_at_sale: '',
    sale_price: '',
    buyer_details: '',
    reason_for_sale: ''
  });
  const [sellLoading, setSellLoading] = useState(false);

  // Conversion / Promotion Modal State
  const [promoteGoat, setPromoteGoat] = useState(null);
  const [promoteForm, setPromoteForm] = useState({ name: '', goat_id: '' });
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Edit Kid Modal State
  const [editGoat, setEditGoat] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    gender: 'male',
    breed: 'Local',
    color: 'White',
    status: 'active',
    dob: '',
    health_status: 'Healthy',
    weight: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  const [customColorActive, setCustomColorActive] = useState(false);
  const [customColorText, setCustomColorText] = useState('');

  useEffect(() => {
    loadKids();
  }, [filters.search, filters.gender]);

  const loadKids = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: filters.search,
        gender: filters.gender,
        category: 'Kid'
      }).toString();
      const data = await api(`/goats?${queryParams}`);
      setKids(data);
    } catch (err) {
      console.error('Error fetching kids:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return 'Unknown';
    const dob = new Date(dobString);
    const today = new Date();
    const diffTime = Math.abs(today - dob);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const months = Math.floor(diffDays / 30.43);
    const days = Math.round(diffDays % 30.43);

    if (months === 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
  };

  const getAgeInMonths = (dobString) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    const diffTime = Math.abs(today - dob);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 30.43;
  };

  // Promotion / Conversion Handlers
  const handlePromoteClick = (goat) => {
    setPromoteGoat(goat);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    setPromoteForm({
      name: goat.name || '',
      goat_id: `GF-${year}${month}${day}-${random}`
    });
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    setPromoteLoading(true);
    try {
      await api(`/goats/promote/${promoteGoat.goat_id}`, {
        method: 'POST',
        body: JSON.stringify(promoteForm)
      });
      setPromoteGoat(null);
      loadKids();
      if (fetchNotifications) fetchNotifications();
      alert('🎉 Kid successfully promoted to Adult module!');
    } catch (err) {
      alert(err.message);
    } finally {
      setPromoteLoading(false);
    }
  };

  // Edit Handlers
  const openEditModal = (goat) => {
    setEditGoat(goat);
    const hasPresetColor = COLOR_PRESETS.some(p => p.name.toLowerCase() === (goat.color || '').toLowerCase());
    
    setEditForm({
      name: goat.name || '',
      gender: goat.gender || 'male',
      breed: goat.breed || 'Local',
      color: goat.color || 'White',
      status: goat.status || 'active',
      dob: goat.dob ? new Date(goat.dob).toISOString().split('T')[0] : '',
      health_status: goat.health_status || 'Healthy',
      weight: goat.weight || 0
    });

    if (hasPresetColor) {
      setCustomColorActive(false);
      setCustomColorText('');
    } else {
      setCustomColorActive(true);
      setCustomColorText(goat.color || '');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    const finalColor = customColorActive ? customColorText : editForm.color;
    if (!finalColor || finalColor.trim() === '') {
      alert('⚠️ Please specify a color for the kid.');
      setEditLoading(false);
      return;
    }

    try {
      await api(`/goats/${editGoat.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          color: finalColor,
          dob: new Date(editForm.dob)
        })
      });
      setEditGoat(null);
      loadKids();
      alert('✅ Kid record updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Handlers
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
      setKids(prev => prev.filter(g => g.goat_id !== deleteTarget.goat_id));
      closeDeleteModal();
      alert('✅ Kid record deleted successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Sell Handlers
  const openSellModal = (goat) => {
    setSellTarget(goat);
    setSellForm({
      sale_date: new Date().toISOString().split('T')[0],
      weight_at_sale: goat.weight || '',
      sale_price: '',
      buyer_details: '',
      reason_for_sale: ''
    });
  };

  const closeSellModal = () => {
    setSellTarget(null);
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
          profit_loss: parseFloat(sellForm.sale_price),
          buyer_details: sellForm.buyer_details,
          reason_for_sale: sellForm.reason_for_sale
        }
      };

      await api(`/goats/${sellTarget.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      closeSellModal();
      loadKids();
      alert('✅ Kid marked as Sold successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSellLoading(false);
    }
  };

  // Helper to render color dot / badge
  const getColorPreviewStyle = (colorName) => {
    const preset = COLOR_PRESETS.find(p => p.name.toLowerCase() === (colorName || '').toLowerCase());
    if (preset) {
      return {
        background: preset.value,
        border: `1px solid ${preset.border}`
      };
    }
    // Custom colors (e.g. "Mixed spots" or specific descriptions)
    if (colorName?.toLowerCase().includes('black')) return { background: '#1E293B', border: '1px solid transparent' };
    if (colorName?.toLowerCase().includes('brown')) return { background: '#78350F', border: '1px solid transparent' };
    if (colorName?.toLowerCase().includes('white')) return { background: '#FFFFFF', border: '1px solid #cbd5e1' };
    if (colorName?.toLowerCase().includes('gray')) return { background: '#64748B', border: '1px solid transparent' };
    
    return {
      background: 'linear-gradient(45deg, #e2e8f0 25%, #94a3b8 25%, #94a3b8 50%, #e2e8f0 50%, #e2e8f0 75%, #94a3b8 75%, #94a3b8 100%)',
      backgroundSize: '10px 10px',
      border: '1px solid #cbd5e1'
    };
  };

  const readyKids = kids.filter(k => getAgeInMonths(k.dob) >= 3.0 && k.status !== 'deceased' && k.status !== 'sold');
  const newbornKids = kids.filter(k => getAgeInMonths(k.dob) < 3.0);

  // Apply tab filters
  const filteredKids = kids.filter(k => {
    const age = getAgeInMonths(k.dob);
    if (filters.activeTab === 'newborn') return age < 3.0;
    if (filters.activeTab === 'ready') return age >= 3.0 && k.status !== 'deceased' && k.status !== 'sold';
    return true;
  });

  const totalKidsCount = kids.length;
  const maleCount = kids.filter(k => k.gender === 'male').length;
  const femaleCount = kids.filter(k => k.gender === 'female').length;
  const readyCount = readyKids.length;
  const activeCount = kids.filter(k => k.status === 'active').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ── STUNNING BANNER HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--dark-green) 0%, var(--primary-green) 100%)',
        color: 'white',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 8px 30px rgba(27,94,32,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract farm graphic circles background */}
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '120px', bottom: '-80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>🍼</span>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Kids Module
            </h1>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '30px',
              backdropFilter: 'blur(4px)'
            }}>
              Newborn Registry
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1.05rem', maxWidth: '650px', lineHeight: 1.5 }}>
            Manage and track goat kids born on the farm. Kids remain registered under this specialized dashboard during their first <strong>3 months</strong> of nurturing before conversion to the Adult herd.
          </p>
        </div>
      </div>

      {/* ── HIGH FIDELITY METRICS BOARD ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Total kids */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderLeft: '5px solid var(--primary-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Kids</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{totalKidsCount}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px', fontWeight: 600 }}>Active Registry: {activeCount}</span>
          </div>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(46,125,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🐣</div>
        </div>

        {/* Card 2: Gender Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderLeft: '5px solid var(--info)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Gender Ratio</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>{maleCount}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700, display: 'block' }}>Male</span>
            </div>
            <div style={{ height: '30px', width: '1px', background: '#e2e8f0' }} />
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#db2777' }}>{femaleCount}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700, display: 'block' }}>Female</span>
            </div>
            <div style={{ flex: 1, marginLeft: '8px' }}>
              <div style={{ height: '8px', borderRadius: '10px', background: '#db2777', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${totalKidsCount > 0 ? (maleCount / totalKidsCount) * 100 : 50}%`, background: '#0284c7' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Ready for Conversion */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderLeft: '5px solid var(--warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Ready to Promote</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: readyCount > 0 ? 'var(--warning)' : 'var(--text-dark)' }}>{readyCount}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: readyCount > 0 ? '#b45309' : 'var(--gray-600)', marginTop: '4px', fontWeight: 600 }}>
              {readyCount > 0 ? '⚠️ Action Recommended' : '👶 Healthy Growth Period'}
            </span>
          </div>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            background: readyCount > 0 ? 'rgba(245,124,0,0.08)' : 'rgba(224,224,224,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
          }}>🐐</div>
        </div>
      </div>

      {/* ── ACTION BANNER FOR MATURING KIDS ── */}
      {readyKids.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF8E1 100%)',
          border: '1.5px solid #FFE082',
          borderLeft: '6px solid #FFB300',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(255,179,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h4 style={{ margin: 0, color: '#B7791F', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>📢</span> Action Needed: {readyKids.length} Kid{readyKids.length > 1 ? 's' : ''} Ready for Promotion
            </h4>
            <p style={{ margin: '6px 0 0', color: '#744210', fontSize: '0.92rem', lineHeight: 1.45, fontWeight: 600 }}>
              These animals have exceeded the <strong>3-month</strong> age marker. For proper record integration and permanent Tag allocation, please convert them to Adult profiles.
            </p>
          </div>
          <div>
            <button
              onClick={() => setFilters({ ...filters, activeTab: 'ready' })}
              className="btn"
              style={{
                background: '#FFB300',
                color: '#5D4037',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(255,179,0,0.2)',
                cursor: 'pointer'
              }}
            >
              Filter Ready Kids
            </button>
          </div>
        </div>
      )}

      {/* ── ADVANCED FILTERS AND CONTROLS BAR ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '18px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        marginBottom: '28px',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Visual Tabs Navigation */}
          <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', gap: '4px' }}>
            <button
              onClick={() => setFilters({ ...filters, activeTab: 'all' })}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filters.activeTab === 'all' ? 'white' : 'transparent',
                color: filters.activeTab === 'all' ? 'var(--primary-green)' : 'var(--gray-600)',
                boxShadow: filters.activeTab === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              All Kids ({kids.length})
            </button>
            <button
              onClick={() => setFilters({ ...filters, activeTab: 'newborn' })}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filters.activeTab === 'newborn' ? 'white' : 'transparent',
                color: filters.activeTab === 'newborn' ? 'var(--primary-green)' : 'var(--gray-600)',
                boxShadow: filters.activeTab === 'newborn' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              👶 Newborns (&lt; 3m) ({newbornKids.length})
            </button>
            <button
              onClick={() => setFilters({ ...filters, activeTab: 'ready' })}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filters.activeTab === 'ready' ? 'white' : 'transparent',
                color: filters.activeTab === 'ready' ? '#c2410c' : 'var(--gray-600)',
                boxShadow: filters.activeTab === 'ready' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔥 Ready for Conversion ({readyKids.length})
            </button>
          </div>

          {/* Interactive Search & Gender Filter inputs */}
          <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '320px', minWidth: '180px' }}>
              <input
                type="text"
                placeholder="Search by ID or Temporary name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-green)'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#94a3b8' }}>🔍</span>
            </div>

            <select 
              value={filters.gender} 
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
                fontWeight: 600,
                color: 'var(--text-dark)',
                background: 'white'
              }}
            >
              <option value="">All Genders</option>
              <option value="male">Male </option>
              <option value="female">Female </option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CARD GRID REGISTRY ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(46,125,50,0.1)', borderTop: '4px solid var(--primary-green)', borderRadius: '50%' }}></div>
        </div>
      ) : filteredKids.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          border: '2px dashed #e2e8f0',
          maxWidth: '560px',
          margin: '0 auto'
        }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🍼</span>
          <h3 style={{ color: 'var(--dark-green)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
            No Matching Kid Records Found
          </h3>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            {kids.length === 0 
              ? 'Newborn registrations will appear here automatically when a Kidding delivery is recorded inside the Mating records page.'
              : 'Try relaxing your search query or switching the active tab filter above.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredKids.map(kid => {
            const ageMonths = getAgeInMonths(kid.dob);
            const isInactive = kid.status === 'deceased' || kid.status === 'sold';
            const isReadyForPromotion = ageMonths >= 3.0 && !isInactive;
            const maturityPercentage = Math.min(100, Math.round((ageMonths / 3.0) * 100));
            const ageDisplay = calculateAge(kid.dob);
            const colorPresetInfo = getColorPreviewStyle(kid.color);
            const isDeceased = kid.status === 'deceased';

            return (
              <div
                key={kid.goat_id}
                style={{
                  background: isDeceased ? '#f8fafc' : 'white',
                  borderRadius: '20px',
                  border: isDeceased
                    ? '1.5px dashed #cbd5e1'
                    : (isReadyForPromotion ? '2px solid #FFCC80' : '1px solid #f1f5f9'),
                  boxShadow: isDeceased
                    ? 'none'
                    : (isReadyForPromotion ? '0 6px 20px rgba(251,140,0,0.06)' : '0 4px 15px rgba(0,0,0,0.02)'),
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isDeceased ? 0.65 : 1,
                  filter: isDeceased ? 'grayscale(0.6)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isDeceased) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isReadyForPromotion 
                      ? '0 12px 28px rgba(251,140,0,0.12)' 
                      : '0 8px 24px rgba(0,0,0,0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeceased) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isReadyForPromotion 
                      ? '0 6px 20px rgba(251,140,0,0.06)' 
                      : '0 4px 15px rgba(0,0,0,0.02)';
                  }
                }}
              >
                {/* Visual Header Ribbon depending on promotion eligibility */}
                <div style={{
                  height: '6px',
                  background: isDeceased
                    ? '#94a3b8'
                    : (isReadyForPromotion 
                      ? 'linear-gradient(90deg, #F57C00 0%, #FFB74D 100%)' 
                      : 'linear-gradient(90deg, var(--primary-green) 0%, var(--secondary-green) 100%)')
                }} />

                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Title & Tag ID Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                        {kid.name || 'Unnamed Kid'}
                      </h4>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                        ID: {kid.goat_id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      {/* Gender Badge */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: kid.gender === 'male' ? '#e0f2fe' : '#fce7f3',
                        color: kid.gender === 'male' ? '#0369a1' : '#be185d'
                      }}>
                        {kid.gender === 'male' ? 'Male' : 'Female'}
                      </span>

                      {/* Three Dots Action Menu */}
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
                            e.target.style.background = 'var(--gray-100)';
                            e.target.style.color = 'var(--text-dark)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.color = 'var(--gray-600)';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === kid.goat_id ? null : kid.goat_id);
                          }}
                        >
                          ⋮
                        </button>

                        {activeDropdown === kid.goat_id && (
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
                                minWidth: '160px',
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
                                  openEditModal(kid);
                                  setActiveDropdown(null);
                                }}
                              >
                                Edit Details
                              </button>

                              {!isInactive && (
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
                                    openSellModal(kid);
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
                                  openDeleteModal(kid);
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

                  {/* MATURITY PROGRESS METER */}
                  <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--gray-600)' }}>Maturity Milestone:</span>
                      <strong style={{ color: isReadyForPromotion ? '#c2410c' : 'var(--primary-green)' }}>
                        {maturityPercentage}% ({Math.min(3, ageMonths).toFixed(1)}/3m)
                      </strong>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${maturityPercentage}%`,
                        height: '100%',
                        borderRadius: '10px',
                        background: isReadyForPromotion 
                          ? 'linear-gradient(90deg, #F57C00 0%, #FFB74D 100%)' 
                          : 'linear-gradient(90deg, var(--primary-green) 0%, var(--secondary-green) 100%)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                       Age: <strong>{ageDisplay}</strong>
                    </span>
                  </div>

                  {/* MAIN SPECIFICATIONS INFO LIST */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>🧬</span>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Breed</span>
                        <strong style={{ color: 'var(--text-dark)' }}>{kid.breed || 'Local'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Color Preview Swatch */}
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'inline-block',
                        ...colorPresetInfo
                      }} />
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Color</span>
                        <strong style={{ color: 'var(--text-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '90px', display: 'inline-block' }} title={kid.color}>
                          {kid.color || 'White'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>⚖️</span>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Weight</span>
                        <strong style={{ color: 'var(--text-dark)' }}>{kid.weight > 0 ? `${kid.weight} kg` : 'Not recorded'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>❤️</span>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Health</span>
                        <strong style={{
                          color: kid.health_status === 'Healthy' ? '#10b981' : '#f59e0b'
                        }}>{kid.health_status || 'Healthy'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* PARENTAL RECORD LINKAGE */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: 'var(--gray-600)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    border: '1px solid #f1f5f9'
                  }}>
                    <span>👩 <strong>Mother:</strong> <span style={{ fontWeight: 600, fontFamily: kid.mother_name ? 'inherit' : 'monospace' }}>{kid.mother_name || kid.mother_id || '—'}</span></span>
                    <span>👨 <strong>Father:</strong> <span style={{ fontWeight: 600, fontFamily: kid.father_name ? 'inherit' : 'monospace' }}>{kid.father_name || kid.father_id || '—'}</span></span>
                  </div>

                </div>

                {/* BOTTOM BUTTON ACTION AREA */}
                <div style={{
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px'
                }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/goats/${kid.goat_id}`)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--primary-green)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(46,125,50,0.04)'; e.target.style.borderColor = 'var(--primary-green)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#cbd5e1'; }}
                  >
                    Full Details
                  </button>
                  <button
                    onClick={() => isReadyForPromotion && handlePromoteClick(kid)}
                    disabled={!isReadyForPromotion}
                    style={{
                      flex: 1.5,
                      padding: '8px 0',
                      background: !isReadyForPromotion 
                        ? '#cbd5e1' 
                        : 'linear-gradient(to right, #f59e0b, #d97706)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: !isReadyForPromotion ? '#94a3b8' : 'white',
                      cursor: !isReadyForPromotion ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: !isReadyForPromotion ? 'none' : '0 2px 8px rgba(217,119,6,0.2)',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => { if (isReadyForPromotion) e.target.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { if (isReadyForPromotion) e.target.style.opacity = '1'; }}
                    title={isInactive ? 'Cannot promote a deceased or sold animal' : (ageMonths < 3.0 ? 'Kids under 3 months cannot be promoted' : 'Promote to Adult')}
                  >
                    Promote to Adult
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── HIGH FIDELITY EDIT KID DETAILS MODAL ── */}
      {editGoat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            width: '90%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✏️</span> Edit Kid Attributes
              </h3>
              <button 
                type="button" 
                onClick={() => setEditGoat(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 500 }}>
              Adjusting record for Newborn: <strong style={{ color: 'var(--text-dark)', fontFamily: 'monospace' }}>{editGoat.goat_id}</strong>
            </p>

            <form onSubmit={handleEditSubmit}>
              
              {/* Name input */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                  Kid Name / Temporary Label
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Betsy Jr, Spot, Kid A"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* Gender & Breed */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select 
                    value={editForm.gender} 
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 600 }}
                  >
                    <option value="male">Male ♂️</option>
                    <option value="female">Female ♀️</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Breed
                  </label>
                  <select 
                    value={editForm.breed} 
                    onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 600 }}
                  >
                    <option value="Local">Local</option>
                    <option value="Country">Country</option>
                    <option value="Saanen">Saanen</option>
                    <option value="Boer">Boer</option>
                    <option value="Alpine">Alpine</option>
                    <option value="Nubian">Nubian</option>
                  </select>
                </div>
              </div>

              {/* COLOR INPUT MODULE (PRESETS + CUSTOM FREE TEXT) */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px' }}>
                  🎨 Goat Color Selection
                </label>
                
                {/* Visual Swatch Options */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = !customColorActive && editForm.color.toLowerCase() === p.name.toLowerCase();
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setCustomColorActive(false);
                          setEditForm({ ...editForm, color: p.name });
                        }}
                        style={{
                          border: isSelected ? '2px solid var(--primary-green)' : '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? '#e8f5e9' : 'white',
                          boxShadow: isSelected ? '0 2px 4px rgba(46,125,50,0.1)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          display: 'inline-block',
                          background: p.value,
                          border: `1px solid ${p.border}`
                        }} />
                        {p.name}
                      </button>
                    );
                  })}
                  
                  {/* Custom option button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomColorActive(true);
                      if (customColorText === '') {
                        setCustomColorText(editForm.color);
                      }
                    }}
                    style={{
                      border: customColorActive ? '2px solid var(--primary-green)' : '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: customColorActive ? '#e8f5e9' : 'white',
                      transition: 'all 0.15s'
                    }}
                  >
                    ✏️ Custom...
                  </button>
                </div>

                {/* Conditional Text Box for Custom Colors */}
                {customColorActive && (
                  <div style={{ animation: 'fadeIn 0.2s' }}>
                    <input
                      type="text"
                      placeholder="Describe custom color, e.g. Black with White patches"
                      value={customColorText}
                      onChange={(e) => setCustomColorText(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--primary-green)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        background: '#fdfdfd'
                      }}
                    />
                    <small style={{ color: 'var(--gray-600)', marginTop: '4px', display: 'block', fontSize: '0.75rem' }}>
                      Provide any specific fur color or spots descriptor. It will be stored exactly in the database.
                    </small>
                  </div>
                )}
              </div>


              {/* DOB & Status */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Active Status
                  </label>
                  <select 
                    value={editForm.status} 
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none', background: 'white', fontWeight: 600 }}
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
              </div>

              {/* Modal controls */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditGoat(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    background: 'var(--primary-green)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46,125,50,0.2)'
                  }}
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving Changes...' : 'Save Kid Attributes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MATURING CONVERSION PROMOTION MODAL ── */}
      {promoteGoat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '90%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-green)' }}>
              🐐 Assign Tag & Promote to Adult
            </h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.4 }}>
              Assign a permanent V Organic Tag Number and name for this mature kid. This moves the animal to the main adult records registry and automatically updates all treatment and weight log histories.
            </p>

            <form onSubmit={handlePromoteSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                  Temporary Kid ID
                </label>
                <input
                  type="text"
                  value={promoteGoat.goat_id}
                  disabled
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600, color: '#64748b' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                  Permanent V Organic Tag Number
                </label>
                <input
                  type="text"
                  value={promoteForm.goat_id}
                  disabled
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f1f5f9', fontWeight: 700, color: 'var(--primary-green)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                  Official Goat Name
                </label>
                <input
                  type="text"
                  value={promoteForm.name}
                  onChange={(e) => setPromoteForm({ ...promoteForm, name: e.target.value })}
                  required
                  placeholder="Enter a friendly name, e.g. Betsy, Daisy, Oscar"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setPromoteGoat(null)}
                  disabled={promoteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    background: 'var(--primary-green)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46,125,50,0.2)'
                  }}
                  disabled={promoteLoading}
                >
                  {promoteLoading ? 'Promoting...' : 'Confirm Promotion 🌾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Kid Sale Modal (Frictionless Redirect Form) ── */}
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
            border: '1px solid #f1f5f9'
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
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Record Kid Sale</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Recording sale specifications for <strong style={{ color: '#0f172a' }}>{sellTarget.name || 'Unnamed Kid'} ({sellTarget.goat_id})</strong>.
            </p>

            <form onSubmit={handleSellSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                    placeholder="e.g. 15.2"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Est. Revenue (INR)</label>
                  <div style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#10b981'
                  }}>
                    {sellForm.sale_price 
                      ? `${parseFloat(sellForm.sale_price).toFixed(2)}`
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
                  placeholder="e.g. Market demand, breeding setup"
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
          background: 'rgba(15, 23, 42, 0.75)',
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
            border: '1px solid #f1f5f9'
          }} onClick={(e) => e.stopPropagation()}>
            
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
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Delete Kid Record</h3>
            </div>

            <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 12px' }}>
              This action is permanent and cannot be undone.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: '0.9rem',
              color: '#334155'
            }}>
              <div><strong>Kid ID:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{deleteTarget.goat_id}</span></div>
              <div style={{ marginTop: 4 }}><strong>Kid Name:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{deleteTarget.name || 'Unnamed Kid'}</span></div>
            </div>

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
                    outline: 'none'
                  }}
                  autoFocus
                />
                {showValidation && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 6, marginBottom: 0 }}>
                    Please type DELETE to continue.
                  </p>
                )}
              </div>

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
                    fontSize: '0.9rem'
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
                    fontSize: '0.9rem'
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Kids;
