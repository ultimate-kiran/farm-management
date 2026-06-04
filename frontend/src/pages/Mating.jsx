import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

function Mating() {
  const { api, fetchNotifications } = useApp();
  const navigate = useNavigate();
  const [males, setMales] = useState([]);
  const [females, setFemales] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    male_goat_id: '',
    female_goat_id: '',
    mating_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  // Kidding modal state
  const [kiddingModal, setKiddingModal] = useState(null); // holds the mating record
  const [kiddingForm, setKiddingForm] = useState({ kidding_date: '', male_kids_count: 0, female_kids_count: 0 });
  const [kidsDetails, setKidsDetails] = useState([]);
  const [kiddingLoading, setKiddingLoading] = useState(false);

  useEffect(() => {
    const details = [];
    for (let i = 0; i < kiddingForm.male_kids_count; i++) {
      details.push({ gender: 'male', color: 'White' });
    }
    for (let i = 0; i < kiddingForm.female_kids_count; i++) {
      details.push({ gender: 'female', color: 'White' });
    }
    setKidsDetails(details);
  }, [kiddingForm.male_kids_count, kiddingForm.female_kids_count]);

  const handleKidColorChange = (index, newColor) => {
    const updated = [...kidsDetails];
    updated[index].color = newColor;
    setKidsDetails(updated);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allGoats = await api('/goats?status=active&category=Adult');
    const matings = await api('/mating');
    setMales(allGoats.filter(g => g.gender === 'male'));
    setFemales(allGoats.filter(g => g.gender === 'female'));
    setRecords(matings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedFemale = females.find(f => f.goat_id === form.female_goat_id);
      if (selectedFemale && selectedFemale.mating_eligibility?.status === 'Not Eligible') {
        alert(`⚠️ Mating Registration Blocked: This female goat is not eligible. Reason: ${selectedFemale.mating_eligibility.reason}`);
        setLoading(false);
        return;
      }

      const expectedDate = new Date(form.mating_date);
      expectedDate.setDate(expectedDate.getDate() + 150);
      await api('/mating', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          mating_date: new Date(form.mating_date),
          expected_kidding_date: expectedDate
        })
      });
      setForm({
        male_goat_id: '',
        female_goat_id: '',
        mating_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
      loadData();
      if (fetchNotifications) fetchNotifications();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceMating = (matingDateString) => {
    if (!matingDateString) return 0;
    const matingDate = new Date(matingDateString);
    const today = new Date();
    matingDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today - matingDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const updateStatus = async (id, newStatus, actualKiddingDate = null) => {
    if (newStatus === 'pregnant') {
      const record = records.find(r => r.mating_id === id);
      if (record) {
        const diffDays = getDaysSinceMating(record.mating_date);
        if (diffDays < 100) {
          alert(`⚠️ Status Blocked: Pregnancy cannot be confirmed until 100 days have passed since the mating date. (Only ${diffDays} days have passed, ${100 - diffDays} days remaining)`);
          return;
        }
      }
    }
    try {
      const updateData = { status: newStatus };
      if (actualKiddingDate) updateData.actual_kidding_date = actualKiddingDate;
      await api(`/mating/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });
      loadData();
      if (fetchNotifications) fetchNotifications();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open kidding modal pre-filled with mating info
  const handleDeliveredClick = (record) => {
    const defaultDate = record.expected_kidding_date
      ? new Date(record.expected_kidding_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setKiddingForm({
      kidding_date: defaultDate,
      male_kids_count: 0,
      female_kids_count: 0
    });
    setKiddingModal(record);
  };

  // Submit kidding details → create kidding record + kids + mark mating delivered
  const handleKiddingSubmit = async (e) => {
    e.preventDefault();
    const totalKids = kiddingForm.male_kids_count + kiddingForm.female_kids_count;
    if (totalKids <= 0) {
      alert('⚠️ Delivery Blocked: Total kids count must be greater than 0.');
      return;
    }
    if (kiddingForm.male_kids_count < 0 || kiddingForm.female_kids_count < 0) {
      alert('⚠️ Validation Blocked: Kids count cannot be negative.');
      return;
    }

    setKiddingLoading(true);
    try {
      // 1. Create kidding record (this also auto-creates kid goats in the backend)
      await api('/kidding', {
        method: 'POST',
        body: JSON.stringify({
          mother_goat_id: kiddingModal.female_goat_id,
          father_goat_id: kiddingModal.male_goat_id,
          kidding_date: new Date(kiddingForm.kidding_date),
          kids_count: totalKids,
          male_kids_count: kiddingForm.male_kids_count,
          female_kids_count: kiddingForm.female_kids_count,
          kids_details: kidsDetails
        })
      });

      // 2. Mark mating as delivered with actual kidding date
      await api(`/mating/${kiddingModal.mating_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'delivered',
          actual_kidding_date: new Date(kiddingForm.kidding_date)
        })
      });

      setKiddingModal(null);
      loadData();
      if (fetchNotifications) fetchNotifications();
      alert(`✅ Successfully recorded delivery of ${totalKids} kid(s) (${kiddingForm.male_kids_count} Male, ${kiddingForm.female_kids_count} Female)!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setKiddingLoading(false);
    }
  };

  const motherName = (id) => females.find(f => f.goat_id === id)?.name || id;
  const fatherName = (id) => males.find(m => m.goat_id === id)?.name || id;

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
            <span style={{ fontSize: '32px' }}>❤️</span>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Mating Registry
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
              Breeding Control
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1.05rem', maxWidth: '650px', lineHeight: 1.5 }}>
            Track mating activities, manage pregnancy confirmations (eligible after <strong>100 days</strong>), and register new kiddings automatically into the kids database.
          </p>
        </div>
      </div>

      {/* ── HIGH FIDELITY METRICS BOARD ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Total Runs */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
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
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Runs</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{records.length}</span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '4px', fontWeight: 600 }}>Breeding Events</span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(46,125,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📈</div>
        </div>

        {/* Card 2: Confirmed Pregnancies */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderLeft: '5px solid var(--info)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Pregnant</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--info)' }}>{records.filter(r => r.status === 'pregnant').length}</span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '4px', fontWeight: 600 }}>Confirmed Gestating</span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(25,118,210,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🤰</div>
        </div>

        {/* Card 3: Pending Confirmation */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
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
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Pending Check</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>
              {records.filter(r => r.status === 'pending' && getDaysSinceMating(r.mating_date) < 100).length}
            </span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '4px', fontWeight: 600 }}>
              Under 100 days
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,124,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⌛</div>
        </div>

        {/* Card 4: Successful Deliveries */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderLeft: '5px solid var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Kidded</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{records.filter(r => r.status === 'delivered').length}</span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '4px', fontWeight: 600 }}>Successful Deliveries</span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56,142,60,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎉</div>
        </div>
      </div>

      {/* ── RESPONSIVE DUAL-COLUMN LAYOUT ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Record Mating Form Card */}
        <div style={{
          flex: '1 1 340px',
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle nature element */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            fontSize: '64px',
            opacity: 0.05,
            transform: 'rotate(25deg)',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>🌿</div>

          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📝</span> Record Mating
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Male Goat</label>
              <select 
                value={form.male_goat_id} 
                onChange={(e) => setForm({ ...form, male_goat_id: e.target.value })} 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select Male</option>
                {males.map(m => (<option key={m.goat_id} value={m.goat_id}>{m.name || 'Unnamed'} ({m.goat_id})</option>))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Female Goat</label>
              <select 
                value={form.female_goat_id} 
                onChange={(e) => setForm({ ...form, female_goat_id: e.target.value })} 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select Female</option>
                {females.map(f => {
                  const isEligible = f.mating_eligibility?.status !== 'Not Eligible';
                  const labelSuffix = isEligible ? '' : ` — [⚠️ ${f.mating_eligibility?.reason}]`;
                  return (
                    <option key={f.goat_id} value={f.goat_id} disabled={!isEligible}>
                      {f.name || f.goat_id} ({f.goat_id}){labelSuffix}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Mating Date</label>
              <input 
                type="date" 
                value={form.mating_date} 
                onChange={(e) => setForm({ ...form, mating_date: e.target.value })} 
                required 
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Initial Status</label>
              <select 
                value={form.status} 
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <option value="pending">Pending Confirmation</option>
                <option value="pregnant">Pregnant (Confirmed)</option>
                <option value="failed">Failed Mating</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                background: 'var(--primary-green)',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46,125,50,0.15)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--dark-green)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--primary-green)'}
            >
              {loading ? 'Saving Mating Event...' : 'Record Mating Event ❤️'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Breeding Registry Records Table Card */}
        <div style={{
          flex: '2 2 640px',
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9'
        }}>
          
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Breeding Registry Records
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parents (Male × Female)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mating Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Kidding</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const daysSince = getDaysSinceMating(r.mating_date);
                  const isPending = r.status === 'pending';
                  const needsAction = isPending && daysSince >= 100;
                  const daysLeft = 100 - daysSince;

                  // Status styling helper
                  let badgeBg = 'rgba(148, 163, 184, 0.1)';
                  let badgeColor = '#64748b';
                  let badgeText = r.status;

                  if (r.status === 'pending') {
                    badgeBg = 'rgba(245, 158, 11, 0.1)';
                    badgeColor = '#d97706';
                    badgeText = 'Pending';
                  } else if (r.status === 'pregnant') {
                    badgeBg = 'rgba(99, 102, 241, 0.1)';
                    badgeColor = '#4f46e5';
                    badgeText = 'Pregnant';
                  } else if (r.status === 'delivered') {
                    badgeBg = 'rgba(16, 185, 129, 0.1)';
                    badgeColor = '#059669';
                    badgeText = 'Delivered';
                  } else if (r.status === 'failed') {
                    badgeBg = 'rgba(239, 68, 68, 0.1)';
                    badgeColor = '#dc2626';
                    badgeText = 'Failed';
                  }

                  return (
                    <tr key={r.mating_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                            Male: {fatherName(r.male_goat_id)}
                          </span>
                          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                            Female: {motherName(r.female_goat_id)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {new Date(r.mating_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.88rem', fontWeight: 600, color: r.actual_kidding_date ? '#94a3b8' : 'var(--text-dark)' }}>
                        {r.actual_kidding_date 
                          ? `Delivered: ${new Date(r.actual_kidding_date).toLocaleDateString()}` 
                          : (r.expected_kidding_date ? new Date(r.expected_kidding_date).toLocaleDateString() : '-')}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: badgeBg,
                          color: badgeColor,
                          display: 'inline-block'
                        }}>
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <select
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: needsAction ? '1.5px solid var(--danger)' : '1.5px solid #cbd5e1',
                                background: needsAction ? 'white' : '#f1f5f9',
                                color: needsAction ? 'var(--danger)' : '#64748b',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: needsAction ? 'pointer' : 'not-allowed',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}
                              disabled={!needsAction}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (window.confirm(`Confirm marking mating as "${val}"?`)) {
                                    updateStatus(r.mating_id, val);
                                  } else {
                                    e.target.value = ""; // Reset
                                  }
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Update</option>
                              <option value="pregnant">Pregnant</option>
                              <option value="failed">Failed</option>
                            </select>
                            {needsAction ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 800, display: 'inline-block', animation: 'pulse 1.5s infinite' }}>
                                Action Required
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--gray-600)', fontWeight: 700 }}>
                                {daysLeft}d left
                              </span>
                            )}
                          </div>
                        )}
                        {r.status === 'pregnant' && (
                          <button 
                            onClick={() => handleDeliveredClick(r)}
                            style={{
                              background: 'linear-gradient(to right, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(16,185,129,0.2)',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            Delivered
                          </button>
                        )}
                        {r.status === 'delivered' && (
                          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }} title="Successful birth event recorded">Completed</span>
                        )}
                        {r.status === 'failed' && (
                          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {records.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-600)' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🌾</span>
                <strong>No mating records registered yet.</strong>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Kidding Details Modal ── */}
      {kiddingModal && (
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
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🐣 Record Kidding Details
            </h3>
            <p style={{ color: 'var(--gray-600)', margin: '6px 0 20px 0', fontSize: '0.9rem', fontWeight: 600 }}>
              <strong>Female:</strong> <span style={{ color: 'var(--text-dark)' }}>{motherName(kiddingModal.female_goat_id)}</span> &nbsp;|&nbsp;
              <strong>Male:</strong> <span style={{ color: 'var(--text-dark)' }}>{fatherName(kiddingModal.male_goat_id)}</span>
            </p>

            <form onSubmit={handleKiddingSubmit}>
              {/* Delivery Kidding Date */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Actual Kidding Date</label>
                <input
                  type="date"
                  value={kiddingForm.kidding_date}
                  onChange={(e) => setKiddingForm({ ...kiddingForm, kidding_date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Side-by-side Genders Counts Inputs */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Male Kids ♂️</label>
                  <input
                    type="number"
                    min="0"
                    value={kiddingForm.male_kids_count}
                    onChange={(e) => setKiddingForm({ ...kiddingForm, male_kids_count: Math.max(0, parseInt(e.target.value) || 0) })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Female Kids ♀️</label>
                  <input
                    type="number"
                    min="0"
                    value={kiddingForm.female_kids_count}
                    onChange={(e) => setKiddingForm({ ...kiddingForm, female_kids_count: Math.max(0, parseInt(e.target.value) || 0) })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Kids Details Colors Section */}
              {kidsDetails.length > 0 && (
                <div style={{
                  marginBottom: '20px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <strong style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '12px', fontSize: '0.88rem', fontWeight: 800 }}>
                    🎨 Assign Individual Kid Colors:
                  </strong>
                  {kidsDetails.map((kid, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: index === kidsDetails.length - 1 ? 0 : '12px',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ minWidth: '95px', fontWeight: 800, color: kid.gender === 'male' ? '#0369a1' : '#be185d' }}>
                        {kid.gender === 'male' ? '♂️ Male Kid' : '♀️ Female Kid'} #{index + 1}:
                      </span>
                      <select
                        value={kid.color}
                        onChange={(e) => handleKidColorChange(index, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          background: '#fff',
                          outline: 'none',
                          fontWeight: 600
                        }}
                      >
                        <option value="White">White</option>
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Gray">Gray</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* 📊 Live Summary Card */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed var(--primary-green)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '24px',
                fontSize: '0.9rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <strong style={{ display: 'block', color: 'var(--dark-green)', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 800 }}>
                  🐣 Newborn Registry Summary:
                </strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>Male Kids Count:</span>
                  <strong style={{ color: '#0369a1' }}>{kiddingForm.male_kids_count} ♂️</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>Female Kids Count:</span>
                  <strong style={{ color: '#be185d' }}>{kiddingForm.female_kids_count} ♀️</strong>
                </div>
                <div style={{
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '8px',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  color: 'var(--primary-green)',
                  fontSize: '0.95rem'
                }}>
                  <span>Total Kids Registered:</span>
                  <span>{kiddingForm.male_kids_count + kiddingForm.female_kids_count} kid{(kiddingForm.male_kids_count + kiddingForm.female_kids_count) !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: '#cbd5e1',
                    color: '#475569',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setKiddingModal(null)}
                  disabled={kiddingLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    background: 'var(--primary-green)',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    cursor: kiddingLoading || (kiddingForm.male_kids_count + kiddingForm.female_kids_count) <= 0 ? 'not-allowed' : 'pointer',
                    boxShadow: kiddingLoading || (kiddingForm.male_kids_count + kiddingForm.female_kids_count) <= 0 ? 'none' : '0 4px 12px rgba(46,125,50,0.15)',
                    opacity: kiddingLoading || (kiddingForm.male_kids_count + kiddingForm.female_kids_count) <= 0 ? 0.6 : 1
                  }}
                  disabled={kiddingLoading || (kiddingForm.male_kids_count + kiddingForm.female_kids_count) <= 0}
                >
                  {kiddingLoading ? 'Saving...' : `Confirm & Add ${kiddingForm.male_kids_count + kiddingForm.female_kids_count} Kid${(kiddingForm.male_kids_count + kiddingForm.female_kids_count) !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mating;