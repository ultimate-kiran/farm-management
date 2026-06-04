import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function GoatProfile() {
  const { id } = useParams();
  const { api, fetchNotifications } = useApp();
  const navigate = useNavigate();
  const [goat, setGoat] = useState(null);
  const [weights, setWeights] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [matings, setMatings] = useState([]);
  const [kidding, setKidding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [familyTree, setFamilyTree] = useState({ father: null, mother: null, kids: [] });

  // Sale Modal State
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellForm, setSellForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    weight_at_sale: '',
    sale_price: '',
    buyer_details: '',
    reason_for_sale: ''
  });
  const [sellLoading, setSellLoading] = useState(false);

  // Promotion Modal State (for Kids)
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteForm, setPromoteForm] = useState({ name: '', goat_id: '' });
  const [promoteLoading, setPromoteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [goatData, weightData, treatmentData, matingData, kiddingData, allGoats] = await Promise.all([
        api(`/goats/${id}`),
        api(`/weight/${id}`),
        api(`/treatments/${id}`),
        api(`/mating?female_goat_id=${id}`),
        api(`/kidding`),
        api('/goats')
      ]);

      setGoat(goatData);
      setWeights(weightData);
      setTreatments(treatmentData);
      setMatings(matingData);

      const kidRecords = kiddingData.filter(k => k.mother_goat_id === id || k.kids?.includes(id));
      setKidding(kidRecords);

      const father = allGoats.find(g => g.goat_id === goatData.father_id);
      const mother = allGoats.find(g => g.goat_id === goatData.mother_id);
      const kids = allGoats.filter(g => g.father_id === id || g.mother_id === id);
      setFamilyTree({ father, mother, kids });
    } catch (err) {
      console.error(err);
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

    if (months === 0) return `${diffDays} days`;
    return `${months}m ${days}d`;
  };

  const getAgeInMonths = (dobString) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    const diffTime = Math.abs(today - dob);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 30.43;
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSellLoading(true);
    try {
      const purchasePrice = goat.purchase_details?.purchase_price || 0;
      const salePrice = parseFloat(sellForm.sale_price);
      const profitLoss = salePrice - purchasePrice;

      const payload = {
        status: 'sold',
        sale_details: {
          sale_date: new Date(sellForm.sale_date),
          weight_at_sale: parseFloat(sellForm.weight_at_sale),
          sale_price: salePrice,
          buyer_details: sellForm.buyer_details,
          profit_loss: profitLoss,
          reason_for_sale: sellForm.reason_for_sale
        }
      };

      await api(`/goats/${goat.goat_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setShowSellModal(false);
      loadData();
      if (fetchNotifications) fetchNotifications();
      alert('💸 Goat marked as Sold successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSellLoading(false);
    }
  };

  const handleOpenPromote = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    setPromoteForm({
      name: '',
      goat_id: `GF-${year}${month}${day}-${random}`
    });
    setShowPromoteModal(true);
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    setPromoteLoading(true);
    try {
      await api(`/goats/promote/${goat.goat_id}`, {
        method: 'POST',
        body: JSON.stringify(promoteForm)
      });
      setShowPromoteModal(false);
      // Since tag ID might have changed, navigate to the new ID
      navigate(`/goats/${promoteForm.goat_id}`);
      if (fetchNotifications) fetchNotifications();
      alert('🎉 Kid promoted to Adult successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setPromoteLoading(false);
    }
  };

  const generatePDF = () => {
    alert('Report generated! (Full PDF export coming soon)');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!goat) {
    return (
      <div className="no-data">
        <h3>Goat not found</h3>
        <Link to="/goats" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Goats</Link>
      </div>
    );
  }

  const currentWeight = weights[0]?.weight || 'N/A';
  const weightChartData = [...weights].reverse().map(w => ({
    date: new Date(w.recorded_date).toLocaleDateString(),
    weight: w.weight
  }));

  const estimatedProfit = sellForm.sale_price 
    ? (parseFloat(sellForm.sale_price) - (goat.purchase_details?.purchase_price || 0)).toFixed(2)
    : 0;

  const ageMonths = getAgeInMonths(goat.dob);
  const isInactive = goat.status === 'deceased' || goat.status === 'sold';
  const isReadyForPromotion = ageMonths >= 3.0 && !isInactive;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Link 
          to={goat.category === 'Kid' ? '/kids' : '/goats'} 
          style={{ color: 'var(--gray-600)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to {goat.category === 'Kid' ? 'Kids Module' : 'Adult Goats'}
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={generatePDF}>Download Report</button>
        </div>
      </div>

      {/* Kid Status Banner */}
      {goat.category === 'Kid' && (
        <div style={{
          background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
          borderLeft: '5px solid #2E7D32',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <h4 style={{ margin: 0, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
              👶 Newborn Kid (Kids Module)
            </h4>
            <p style={{ margin: '4px 0 0', color: '#33691E', fontSize: '0.9rem' }}>
              This goat is in the Kid Stage. Age: <strong>{calculateAge(goat.dob)}</strong>. 
              {ageMonths >= 3.0 ? " Reached 3 months of age! Ready for promotion." : " Newborn kids automatically remain in kid category for the first 3 months."}
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ 
              background: !isReadyForPromotion ? '#cbd5e1' : '#2E7D32',
              color: !isReadyForPromotion ? '#94a3b8' : 'white',
              cursor: !isReadyForPromotion ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: !isReadyForPromotion ? 'none' : '0 2px 8px rgba(46,125,50,0.2)'
            }}
            disabled={!isReadyForPromotion}
            onClick={handleOpenPromote}
            title={isInactive ? 'Cannot promote a deceased or sold animal' : (ageMonths < 3.0 ? 'Kids under 3 months cannot be promoted' : 'Promote to Adult')}
          >
            Promote to Adult 🐐
          </button>
        </div>
      )}

      <div className="profile-header">
        <span className="goat-id">{goat.goat_id}</span>
        <h2>{goat.name || 'Unnamed Kid'}</h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <span className={`badge badge-${goat.category}`} style={{ background: goat.category === 'Kid' ? '#E0F7FA' : '#E8F5E9', color: goat.category === 'Kid' ? '#006064' : '#1B5E20', fontWeight: 700 }}>
            {goat.category}
          </span>
          <span className={`badge badge-${goat.gender}`}>{goat.gender}</span>
          <span className={`badge badge-${goat.status}`}>{goat.status}</span>
          <span style={{ opacity: 0.9 }}>Current Weight: {currentWeight} kg</span>
          {goat.gender === 'female' && goat.mating_eligibility && (
            <span className={`badge badge-${goat.mating_eligibility.status === 'Eligible' ? 'active' : 'inactive'}`} style={{
              background: goat.mating_eligibility.status === 'Eligible' ? '#E8F5E9' : '#FFEBEE',
              color: goat.mating_eligibility.status === 'Eligible' ? '#1B5E20' : '#C62828'
            }}>
              Mating: {goat.mating_eligibility.status}
            </span>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`profile-tab ${activeTab === 'weight' ? 'active' : ''}`} onClick={() => setActiveTab('weight')}>Weight</button>
        <button className={`profile-tab ${activeTab === 'treatments' ? 'active' : ''}`} onClick={() => setActiveTab('treatments')}>Treatments</button>
        {goat.category === 'Adult' && <button className={`profile-tab ${activeTab === 'mating' ? 'active' : ''}`} onClick={() => setActiveTab('mating')}>Mating</button>}
        {goat.category === 'Adult' && <button className={`profile-tab ${activeTab === 'kidding' ? 'active' : ''}`} onClick={() => setActiveTab('kidding')}>Kidding</button>}
        <button className={`profile-tab ${activeTab === 'family' ? 'active' : ''}`} onClick={() => setActiveTab('family')}>Family</button>
      </div>

      <div className="profile-content">
        {activeTab === 'overview' && (
          <div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Breed</label>
                <span>{goat.breed}</span>
              </div>
              <div className="detail-item">
                <label>Color</label>
                <span>{goat.color}</span>
              </div>
              <div className="detail-item">
                <label>Date of Birth</label>
                <span>{new Date(goat.dob).toLocaleDateString()} ({calculateAge(goat.dob)})</span>
              </div>
              <div className="detail-item">
                <label>Source Type</label>
                <span>{goat.source_type === 'born' ? 'Born in Farm' : 'Purchased'}</span>
              </div>
              
              {goat.gender === 'female' && goat.mating_eligibility && (
                <div className="detail-item">
                  <label>Breeding Mating Eligibility</label>
                  <span style={{ color: goat.mating_eligibility.status === 'Eligible' ? '#2E7D32' : '#C62828', fontWeight: 600 }}>
                    {goat.mating_eligibility.status} ({goat.mating_eligibility.reason})
                  </span>
                </div>
              )}
            </div>

            {/* Purchase Details */}
            {goat.source_type === 'purchased' && goat.purchase_details && (
              <div style={{ marginTop: 32, background: '#f5f7fa', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  💰 Purchase Information
                </h3>
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="detail-item">
                    <label>Purchase Date</label>
                    <span>{goat.purchase_details.purchase_date ? new Date(goat.purchase_details.purchase_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Age at Purchase</label>
                    <span>{goat.purchase_details.age_at_purchase || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Purchase Weight</label>
                    <span>{goat.purchase_details.purchase_weight ? `${goat.purchase_details.purchase_weight} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Purchase Price</label>
                    <span>{goat.purchase_details.purchase_price ? `$${goat.purchase_details.purchase_price}` : 'N/A'}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label>Seller Details</label>
                    <span>{goat.purchase_details.seller_details || goat.purchase_details.seller_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Health Status at Purchase</label>
                    <span>{goat.purchase_details.health_status || 'Healthy'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Details */}
            {goat.status === 'sold' && goat.sale_details && (
              <div style={{ marginTop: 32, background: '#FFF3E0', padding: 24, borderRadius: 12, border: '1px solid #FFE0B2' }}>
                <h3 style={{ marginBottom: 16, color: '#E65100', display: 'flex', alignItems: 'center', gap: 8 }}>
                  💸 Sale Information
                </h3>
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="detail-item">
                    <label>Sale Date</label>
                    <span>{goat.sale_details.sale_date ? new Date(goat.sale_details.sale_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Weight at Sale</label>
                    <span>{goat.sale_details.weight_at_sale ? `${goat.sale_details.weight_at_sale} kg` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sale Price</label>
                    <span>{goat.sale_details.sale_price ? `$${goat.sale_details.sale_price}` : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Profit / Loss</label>
                    <span style={{ 
                      color: (goat.sale_details.profit_loss || 0) >= 0 ? '#2E7D32' : '#C62828', 
                      fontWeight: 700 
                    }}>
                      {(goat.sale_details.profit_loss || 0) >= 0 ? '+' : ''}${goat.sale_details.profit_loss?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label>Buyer Details</label>
                    <span>{goat.sale_details.buyer_details || 'N/A'}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label>Reason for Sale</label>
                    <span>{goat.sale_details.reason_for_sale || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weight' && (
          <div>
            {weightChartData.length > 0 ? (
              <div style={{ height: 300, marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#2E7D32" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>No weight records yet</p>
            )}

            <h4 style={{ marginBottom: 16 }}>Weight History</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {weights.map(w => (
                  <tr key={w.weight_id}>
                    <td>{new Date(w.recorded_date).toLocaleDateString()}</td>
                    <td>{w.weight}</td>
                    <td>{w.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'treatments' && (
          <div>
            {treatments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>No treatment records</p>
            ) : (
              treatments.map(t => (
                <div key={t.treatment_id} className="treatment-card">
                  <h4>{t.problem}</h4>
                  <p>Date: {new Date(t.treatment_date).toLocaleDateString()}</p>
                  <p>Notes: {t.notes || 'None'}</p>
                  {t.medicines?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <h5>Medicines:</h5>
                      {t.medicines.map((m, i) => (
                        <div key={i} className="medicine-item">
                          <h5>{m.medicine_name}</h5>
                          <p>Dosage: {m.dosage} | Type: {m.type} | Duration: {m.duration}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'mating' && (
          <div>
            {goat.gender === 'female' ? (
              matings.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>No mating records</p>
              ) : (
                matings.map(m => (
                  <div key={m.mating_id} className="mating-card">
                    <h4>Mating with {m.male_goat_id}</h4>
                    <p>Date: {new Date(m.mating_date).toLocaleDateString()}</p>
                    <p>Expected Kidding: {new Date(m.expected_kidding_date).toLocaleDateString()}</p>
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                  </div>
                ))
              )
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>Mating records shown on female goats</p>
            )}
          </div>
        )}

        {activeTab === 'kidding' && (
          <div>
            {goat.gender === 'female' ? (
              kidding.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>No kidding records</p>
              ) : (
                kidding.map(k => (
                  <div key={k.kidding_id} className="treatment-card">
                    <h4>Kidding on {new Date(k.kidding_date).toLocaleDateString()}</h4>
                    <p>Number of Kids: {k.kids_count}</p>
                    <p>Male: {k.father_goat_id}</p>
                  </div>
                ))
              )
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 40 }}>Kidding history is for female goats</p>
            )}
          </div>
        )}

        {activeTab === 'family' && (
          <div className="family-tree">
            <div className="family-level">
              {familyTree.father ? (
                <div className="family-node" onClick={() => navigate(`/goats/${familyTree.father.goat_id}`)}>
                  <div>♂ {familyTree.father.name || 'Unnamed Kid'}</div>
                  <small>{familyTree.father.goat_id}</small>
                </div>
              ) : (
                <div className="family-node" style={{ opacity: 0.5 }}>Unknown Male Parent</div>
              )}
              {familyTree.mother ? (
                <div className="family-node" onClick={() => navigate(`/goats/${familyTree.mother.goat_id}`)}>
                  <div>♀ {familyTree.mother.name || 'Unnamed Kid'}</div>
                  <small>{familyTree.mother.goat_id}</small>
                </div>
              ) : (
                <div className="family-node" style={{ opacity: 0.5 }}>Unknown Female Parent</div>
              )}
            </div>
            <div className="family-connector"></div>
            <div className="family-node" style={{ background: 'var(--accent-green)', color: 'var(--white)' }}>
              <div>{goat.gender === 'male' ? '♂' : '♀'} {goat.name || 'Unnamed Kid'}</div>
              <small>{goat.goat_id}</small>
            </div>
            {familyTree.kids.length > 0 && (
              <>
                <div className="family-connector"></div>
                <div className="family-level">
                  {familyTree.kids.map(kid => (
                    <div key={kid.goat_id} className="family-node" onClick={() => navigate(`/goats/${kid.goat_id}`)}>
                      <div>{kid.gender === 'male' ? '♂' : '♀'} {kid.name || 'Unnamed Kid'}</div>
                      <small>{kid.goat_id}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Sell Goat Modal ── */}
      {showSellModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32,
            width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <h3 style={{ marginBottom: 4 }}>💸 Record Goat Sale</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 14 }}>
              Record the sale information for <strong>{goat.name || goat.goat_id}</strong>. Note that the goat will not be deleted, but marked as sold.
            </p>

            <form onSubmit={handleSellSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Sale Date *</label>
                  <input
                    type="date"
                    value={sellForm.sale_date}
                    onChange={(e) => setSellForm({ ...sellForm, sale_date: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Weight at Sale (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sellForm.weight_at_sale}
                    onChange={(e) => setSellForm({ ...sellForm, weight_at_sale: e.target.value })}
                    required
                    placeholder="Weight in kg"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Sale Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellForm.sale_price}
                    onChange={(e) => setSellForm({ ...sellForm, sale_price: e.target.value })}
                    required
                    placeholder="Amount received"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Estimated Profit / Loss</label>
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, background: '#f5f7fa',
                    fontWeight: 700, color: parseFloat(estimatedProfit) >= 0 ? '#2E7D32' : '#C62828'
                  }}>
                    {parseFloat(estimatedProfit) >= 0 ? '+' : ''}${parseFloat(estimatedProfit).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Buyer Details</label>
                <input
                  type="text"
                  value={sellForm.buyer_details}
                  onChange={(e) => setSellForm({ ...sellForm, buyer_details: e.target.value })}
                  placeholder="Name, Contact, Location"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Reason for Sale</label>
                <input
                  type="text"
                  value={sellForm.reason_for_sale}
                  onChange={(e) => setSellForm({ ...sellForm, reason_for_sale: e.target.value })}
                  placeholder="e.g. Excess stock, Market price, Health reasons"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, background: 'var(--gray-200)', color: 'var(--gray-700)' }}
                  onClick={() => setShowSellModal(false)}
                  disabled={sellLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, background: 'var(--warning)' }}
                  disabled={sellLoading}
                >
                  {sellLoading ? 'Saving Sale...' : 'Confirm Sale 💸'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Kid Promotion Modal ── */}
      {showPromoteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32,
            width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <h3 style={{ marginBottom: 4 }}>🐐 Promote Kid to Adult</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 14 }}>
              System will assign permanent tag details and move this goat to the Adult module. All histories will be preserved.
            </p>

            <form onSubmit={handlePromoteSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Temporary Kid ID</label>
                <input
                  type="text"
                  value={goat.goat_id}
                  disabled
                  style={{ width: '100%', background: 'var(--gray-100)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Permanent Tag Number (Goat ID) *</label>
                <input
                  type="text"
                  value={promoteForm.goat_id}
                  disabled
                  required
                  style={{ width: '100%', background: 'var(--gray-100)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Goat Name *</label>
                <input
                  type="text"
                  value={promoteForm.name}
                  onChange={(e) => setPromoteForm({ ...promoteForm, name: e.target.value })}
                  required
                  placeholder="Enter permanent name, e.g. Daisy"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, background: 'var(--gray-200)', color: 'var(--gray-700)' }}
                  onClick={() => setShowPromoteModal(false)}
                  disabled={promoteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, background: 'var(--success)' }}
                  disabled={promoteLoading}
                >
                  {promoteLoading ? 'Promoting...' : 'Confirm Promotion 🐐'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoatProfile;