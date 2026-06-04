import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function AddGoat() {
  const { api } = useApp();
  const navigate = useNavigate();
  const [formType, setFormType] = useState('born'); // 'born' or 'purchased'
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [tagError, setTagError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    goat_id: '',
    gender: 'male',
    breed: 'Country',
    color: 'Black',
    dob: new Date().toISOString().split('T')[0],
    father_id: '',
    mother_id: '',
    category: 'Adult', // default for purchased
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_weight: '',
    purchase_price: '',
    seller_details: '',
    age_at_purchase: '',
    health_status: 'Healthy'
  });

  useEffect(() => {
    loadGoats();
  }, []);

  useEffect(() => {
    if (formType === 'purchased') {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const autoTag = `GP-${year}${month}${day}-${random}`;
      setForm(prev => ({ ...prev, goat_id: autoTag, name: '' }));
      setTagError('');
    } else {
      setForm(prev => ({ ...prev, goat_id: '', name: '' }));
    }
  }, [formType]);

  const loadGoats = async () => {
    try {
      const data = await api('/goats');
      setGoats(data);
    } catch (err) {
      console.error('Error fetching goats:', err);
    }
  };

  const checkDuplicateName = (name) => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;
    const duplicate = goats.find(g => g.name && g.name.toLowerCase().trim() === trimmedName);
    if (duplicate) {
      setNameError(`A goat named "${duplicate.name}" already exists (Tag ID: ${duplicate.goat_id})`);
      return true;
    }
    setNameError('');
    return false;
  };

  const checkDuplicateTag = (tag) => {
    if (formType === 'born') return false;
    const trimmedTag = tag.trim().toUpperCase();
    if (!trimmedTag) return false;
    const duplicate = goats.find(g => g.goat_id.toUpperCase().trim() === trimmedTag);
    if (duplicate) {
      setTagError(`Tag number "${trimmedTag}" already exists`);
      return true;
    }
    setTagError('');
    return false;
  };

  const getAgeInMonths = (dobString) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    const diffTime = Math.abs(today - dob);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 30.43;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkDuplicateName(form.name)) {
      return;
    }
    if (formType === 'purchased') {
      if (checkDuplicateTag(form.goat_id)) {
        return;
      }
    }

    setLoading(true);

    try {
      let payload = {
        gender: form.gender,
        breed: form.breed,
        color: form.color,
        dob: new Date(form.dob),
        source_type: formType,
        father_id: form.father_id || null,
        mother_id: form.mother_id || null
      };

      if (formType === 'born') {
        // Born in farm: goes to Kids module if < 3 months, otherwise Adult module
        const ageInMonths = getAgeInMonths(form.dob);
        payload.category = ageInMonths >= 3.0 ? 'Adult' : 'Kid';
        payload.name = form.name.trim();
      } else {
        // Purchased goat
        payload.name = form.name;
        payload.goat_id = form.goat_id.trim();
        payload.category = form.category; // Adult or Kid based on toggle
        payload.purchase_details = {
          purchase_date: new Date(form.purchase_date),
          purchase_weight: form.purchase_weight ? parseFloat(form.purchase_weight) : null,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
          purchase_cost: form.purchase_price ? parseFloat(form.purchase_price) : null, // compatibility
          seller_name: form.seller_details, // compatibility
          seller_details: form.seller_details,
          age_at_purchase: form.age_at_purchase,
          health_status: form.health_status
        };
      }

      await api('/goats', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Redirect based on category
      if (payload.category === 'Kid') {
        navigate('/kids');
      } else {
        navigate('/goats');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const males = goats.filter(g => g.gender === 'male');
  const females = goats.filter(g => g.gender === 'female');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Add Goat Record
        </h1>
        <p style={{ color: 'var(--gray-600)', margin: '6px 0 0', fontSize: '0.92rem' }}>
          Register new livestock arrivals by birth delivery or purchase.
        </p>
      </div>

      {/* ── FORM CONTAINER ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        
        {/* TAB NAVIGATION TABS (NO EMOJIS) */}
        <div style={{
          display: 'flex',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => setFormType('born')}
            style={{
              flex: 1,
              padding: '16px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              background: formType === 'born' ? 'white' : 'transparent',
              color: formType === 'born' ? 'var(--primary-green)' : 'var(--gray-600)',
              borderBottom: formType === 'born' ? '3px solid var(--primary-green)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Born in Farm
          </button>
          <button
            type="button"
            onClick={() => setFormType('purchased')}
            style={{
              flex: 1,
              padding: '16px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              background: formType === 'purchased' ? 'white' : 'transparent',
              color: formType === 'purchased' ? 'var(--primary-green)' : 'var(--gray-600)',
              borderBottom: formType === 'purchased' ? '3px solid var(--primary-green)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Purchased Goat
          </button>
        </div>

        {/* MAIN FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          
          {formType === 'born' && (
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                Goat Name / Temporary Label *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  checkDuplicateName(e.target.value);
                }}
                required
                placeholder="e.g. Betsy Jr, Spot, Kid A"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: nameError ? '1.5px solid var(--danger)' : '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
              {nameError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{nameError}</p>}
            </div>
          )}
          
          {formType === 'purchased' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                  Permanent Tag Number (Goat ID) *
                </label>
                <input
                  type="text"
                  value={form.goat_id}
                  disabled
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 700,
                    outline: 'none',
                    fontSize: '0.95rem',
                    cursor: 'not-allowed'
                  }}
                />
                <small style={{ color: 'var(--gray-600)', display: 'block', marginTop: '6px', fontSize: '0.78rem' }}>
                  Automatically assigned for Purchased goats (Prefix GP).
                </small>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                  Goat Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    checkDuplicateName(e.target.value);
                  }}
                  required
                  placeholder="e.g. Betsy"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: nameError ? '1.5px solid var(--danger)' : '1.5px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.95rem'
                  }}
                />
                {nameError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>{nameError}</p>}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                Gender *
              </label>
              
              {/* Professional Capsule Selectors instead of standard radio dots */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: 'male' })}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: form.gender === 'male' ? '1.5px solid var(--primary-green)' : '1.5px solid #cbd5e1',
                    background: form.gender === 'male' ? '#e8f5e9' : 'white',
                    color: form.gender === 'male' ? 'var(--primary-green)' : 'var(--gray-600)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.15s'
                  }}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: 'female' })}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: form.gender === 'female' ? '1.5px solid var(--primary-green)' : '1.5px solid #cbd5e1',
                    background: form.gender === 'female' ? '#e8f5e9' : 'white',
                    color: form.gender === 'female' ? 'var(--primary-green)' : 'var(--gray-600)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.15s'
                  }}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                Date of Birth *
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
              {formType === 'born' && (
                <small style={{ color: 'var(--gray-600)', display: 'block', marginTop: '6px', fontSize: '0.78rem' }}>
                  Will enter Kids Module. Classified as Kid for the first 3 months.
                </small>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                Breed
              </label>
              <select
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                <option value="Country">Country</option>
                <option value="Local">Local</option>
                <option value="Saanen">Saanen</option>
                <option value="Boer">Boer</option>
                <option value="Alpine">Alpine</option>
                <option value="Nubian">Nubian</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                Color
              </label>
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  background: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                <option value="White">White</option>
                <option value="Black">Black</option>
                <option value="Brown">Brown</option>
                <option value="Gray">Gray</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {formType === 'born' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                  Male Parent (Optional)
                </label>
                <select
                  value={form.father_id}
                  onChange={(e) => setForm({ ...form, father_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    background: 'white',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Male Parent</option>
                  {males.map(m => (
                    <option key={m.goat_id} value={m.goat_id}>{m.name || m.goat_id} ({m.goat_id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '8px' }}>
                  Female Parent (Optional)
                </label>
                <select
                  value={form.mother_id}
                  onChange={(e) => setForm({ ...form, mother_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    background: 'white',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="">Select Female Parent</option>
                  {females.map(f => (
                    <option key={f.goat_id} value={f.goat_id}>{f.name || f.goat_id} ({f.goat_id})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formType === 'purchased' && (
            <div style={{
              background: '#f8fafc',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '28px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-green)', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                Purchase Details
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                    required={formType === 'purchased'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Age at Purchase
                  </label>
                  <input
                    type="text"
                    value={form.age_at_purchase}
                    onChange={(e) => setForm({ ...form, age_at_purchase: e.target.value })}
                    placeholder="e.g. 1 year, 6 months"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Purchase Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.purchase_weight}
                    onChange={(e) => setForm({ ...form, purchase_weight: e.target.value })}
                    required={formType === 'purchased'}
                    placeholder="Weight in kg"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.purchase_price}
                    onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                    required={formType === 'purchased'}
                    placeholder="Amount paid"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Seller Details
                  </label>
                  <input
                    type="text"
                    value={form.seller_details}
                    onChange={(e) => setForm({ ...form, seller_details: e.target.value })}
                    placeholder="Name, Contact, Location"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>
                    Health Status at Purchase
                  </label>
                  <select
                    value={form.health_status}
                    onChange={(e) => setForm({ ...form, health_status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      background: 'white',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Sick">Sick</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Quarantined">Quarantined</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  <input
                    type="checkbox"
                    checked={form.category === 'Adult'}
                    onChange={(e) => setForm({ ...form, category: e.target.checked ? 'Adult' : 'Kid' })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Directly enter Adult module (Uncheck to enter as Kid)
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || nameError || tagError}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary-green)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: (loading || nameError || tagError) ? 'not-allowed' : 'pointer',
              opacity: (loading || nameError || tagError) ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(46,125,50,0.15)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!(loading || nameError || tagError)) {
                e.target.style.background = 'var(--dark-green)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(loading || nameError || tagError)) {
                e.target.style.background = 'var(--primary-green)';
              }
            }}
          >
            {loading ? 'Adding Goat...' : formType === 'born' ? 'Add Newborn Kid' : 'Add Purchased Goat'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddGoat;