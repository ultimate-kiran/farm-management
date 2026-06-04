import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

function Reports() {
  const { api } = useApp();
  const navigate = useNavigate();
  const [goats, setGoats] = useState([]);
  const [weights, setWeights] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Individual report states
  const [selectedGoat, setSelectedGoat] = useState('');
  const [reportType, setReportType] = useState('profile');

  // Bulk ledger generator states
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'born', 'purchased'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'Adult', 'Kid'
  const [kidStatusFilter, setKidStatusFilter] = useState('all'); // 'all', 'alive', 'deceased'
  const [generalStatusFilter, setGeneralStatusFilter] = useState('all'); // 'all', 'active', 'sold', 'deceased'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goatsData, weightsData, treatmentsData] = await Promise.all([
        api('/goats'),
        api('/weight'),
        api('/treatments')
      ]);
      setGoats(goatsData);
      setWeights(weightsData);
      setTreatments(treatmentsData);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGoats = () => {
    return goats.filter(g => {
      // 1. Source Filter
      if (sourceFilter === 'born' && g.source_type !== 'born') return false;
      if (sourceFilter === 'purchased' && g.source_type !== 'purchased') return false;

      // 2. Category Filter
      if (categoryFilter === 'Adult' && g.category !== 'Adult') return false;
      if (categoryFilter === 'Kid' && g.category !== 'Kid') return false;

      // 3. Kids Specific Status (only applies to kids)
      if (g.category === 'Kid') {
        if (kidStatusFilter === 'alive' && g.status !== 'active') return false;
        if (kidStatusFilter === 'deceased' && g.status !== 'deceased') return false;
      }

      // 4. General Status Filter (applies to all, but overrides kids status filters if set)
      if (generalStatusFilter === 'active' && g.status !== 'active') return false;
      if (generalStatusFilter === 'sold' && g.status !== 'sold') return false;
      if (generalStatusFilter === 'deceased' && g.status !== 'deceased') return false;

      return true;
    });
  };

  const exportIndividualReport = () => {
    if (!selectedGoat) {
      alert('Please select a goat profile first.');
      return;
    }

    const goat = goats.find(g => g.goat_id === selectedGoat);
    if (!goat) {
      alert('Goat not found.');
      return;
    }

    if (reportType === 'profile') {
      const data = [{
        'Tag Number': goat.goat_id,
        'Name': goat.name || 'Unnamed',
        'Gender': goat.gender ? goat.gender.toUpperCase() : 'N/A',
        'Breed': goat.breed || 'Local',
        'Color': goat.color || 'Mixed',
        'Category': goat.category || 'Adult',
        'Source': goat.source_type === 'born' ? 'Born in Farm' : 'Purchased',
        'Status': goat.status ? goat.status.toUpperCase() : 'ACTIVE',
        'Health': goat.health_status || 'Healthy',
        'Weight (kg)': goat.weight || 0,
        'Date of Birth': goat.dob ? new Date(goat.dob).toLocaleDateString() : 'N/A',
        'Female Parent ID': goat.mother_id || 'N/A',
        'Male Parent ID': goat.father_id || 'N/A'
      }];

      if (goat.source_type === 'purchased' && goat.purchase_details) {
        data[0]['Purchase Date'] = goat.purchase_details.purchase_date ? new Date(goat.purchase_details.purchase_date).toLocaleDateString() : 'N/A';
        data[0]['Purchase Weight'] = goat.purchase_details.purchase_weight ? `${goat.purchase_details.purchase_weight} kg` : 'N/A';
        data[0]['Purchase Price'] = goat.purchase_details.purchase_price ? `${goat.purchase_details.purchase_price} INR` : 'N/A';
        data[0]['Seller Details'] = goat.purchase_details.seller_details || 'N/A';
      }

      if (goat.status === 'sold' && goat.sale_details) {
        data[0]['Sale Date'] = goat.sale_details.sale_date ? new Date(goat.sale_details.sale_date).toLocaleDateString() : 'N/A';
        data[0]['Sale Weight'] = goat.sale_details.weight_at_sale ? `${goat.sale_details.weight_at_sale} kg` : 'N/A';
        data[0]['Sale Price'] = goat.sale_details.sale_price ? `${goat.sale_details.sale_price} INR` : 'N/A';
        data[0]['Profit/Loss'] = goat.sale_details.profit_loss ? `${goat.sale_details.profit_loss} INR` : 'N/A';
        data[0]['Buyer Details'] = goat.sale_details.buyer_details || 'N/A';
        data[0]['Reason for Sale'] = goat.sale_details.reason_for_sale || 'N/A';
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Profile Summary');
      XLSX.writeFile(workbook, `Profile_${goat.goat_id}.xlsx`);

    } else if (reportType === 'weight') {
      const goatWeights = weights.filter(w => w.goat_id === selectedGoat);
      if (goatWeights.length === 0) {
        alert('No records to export');
        return;
      }

      const data = goatWeights.map(w => ({
        'Record ID': w.weight_id,
        'Recorded Date': w.recorded_date ? new Date(w.recorded_date).toLocaleDateString() : 'N/A',
        'Weight (kg)': w.weight,
        'Notes': w.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Weight History');
      XLSX.writeFile(workbook, `Weight_History_${goat.goat_id}.xlsx`);

    } else if (reportType === 'treatment') {
      const goatTreatments = treatments.filter(t => t.goat_id === selectedGoat);
      if (goatTreatments.length === 0) {
        alert('No records to export');
        return;
      }

      const data = [];
      goatTreatments.forEach(t => {
        const baseRow = {
          'Treatment ID': t.treatment_id,
          'Treatment Date': t.treatment_date ? new Date(t.treatment_date).toLocaleDateString() : 'N/A',
          'Problem/Diagnosis': t.problem,
          'Treated By': t.treated_by || 'N/A',
          'Next Checkup': t.next_checkup ? new Date(t.next_checkup).toLocaleDateString() : 'N/A',
          'Notes': t.notes || ''
        };

        if (t.medicines && t.medicines.length > 0) {
          t.medicines.forEach((med, idx) => {
            data.push({
              ...baseRow,
              'Medicine Sequence': idx + 1,
              'Medicine Name': med.medicine_name,
              'Dosage': med.dosage,
              'Type': med.type,
              'Instructions': med.instructions || '',
              'Duration': med.duration || ''
            });
          });
        } else {
          data.push({
            ...baseRow,
            'Medicine Sequence': 'None',
            'Medicine Name': 'None',
            'Dosage': 'N/A',
            'Type': 'N/A',
            'Instructions': '',
            'Duration': ''
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical History');
      XLSX.writeFile(workbook, `Medical_History_${goat.goat_id}.xlsx`);
    }
  };

  const exportSpreadsheet = () => {
    const filteredList = getFilteredGoats();
    if (filteredList.length === 0) {
      alert('No records match the selected report options.');
      return;
    }

    const dataToExport = filteredList.map(g => {
      const row = {
        'Tag Number': g.goat_id,
        'Name': g.name || 'Unnamed',
        'Gender': g.gender ? g.gender.toUpperCase() : 'N/A',
        'Breed': g.breed || 'Local',
        'Color': g.color || 'Mixed',
        'Category': g.category || 'Adult',
        'Source': g.source_type === 'born' ? 'Born in Farm' : 'Purchased',
        'Status': g.status ? g.status.toUpperCase() : 'ACTIVE',
        'Health': g.health_status || 'Healthy',
        'Weight (kg)': g.weight || 0,
        'Date of Birth': g.dob ? new Date(g.dob).toLocaleDateString() : 'N/A',
        'Female Parent ID': g.mother_id || 'N/A',
        'Male Parent ID': g.father_id || 'N/A'
      };

      // Purchased Goats Details
      if (g.source_type === 'purchased' && g.purchase_details) {
        row['Purchase Date'] = g.purchase_details.purchase_date ? new Date(g.purchase_details.purchase_date).toLocaleDateString() : 'N/A';
        row['Purchase Weight'] = g.purchase_details.purchase_weight ? `${g.purchase_details.purchase_weight} kg` : 'N/A';
        row['Purchase Price'] = g.purchase_details.purchase_price ? `${g.purchase_details.purchase_price} INR` : 'N/A';
        row['Seller Details'] = g.purchase_details.seller_details || 'N/A';
      }

      // Sold Goats Details
      if (g.status === 'sold' && g.sale_details) {
        row['Sale Date'] = g.sale_details.sale_date ? new Date(g.sale_details.sale_date).toLocaleDateString() : 'N/A';
        row['Sale Weight'] = g.sale_details.weight_at_sale ? `${g.sale_details.weight_at_sale} kg` : 'N/A';
        row['Sale Price'] = g.sale_details.sale_price ? `${g.sale_details.sale_price} INR` : 'N/A';
        row['Profit/Loss'] = g.sale_details.profit_loss ? `${g.sale_details.profit_loss} INR` : 'N/A';
        row['Buyer Details'] = g.sale_details.buyer_details || 'N/A';
        row['Reason for Sale'] = g.sale_details.reason_for_sale || 'N/A';
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger Report');

    // Generate filename based on filters
    let prefix = 'V_Organic_';
    if (categoryFilter !== 'all') prefix += `${categoryFilter}_`;
    if (sourceFilter !== 'all') prefix += `${sourceFilter}_`;
    prefix += 'Ledger';

    XLSX.writeFile(workbook, `${prefix}.xlsx`);
  };

  const filteredGoats = getFilteredGoats();
  const bornCount = filteredGoats.filter(g => g.source_type === 'born').length;
  const purchasedCount = filteredGoats.filter(g => g.source_type === 'purchased').length;
  const kidsCount = filteredGoats.filter(g => g.category === 'Kid').length;
  const adultsCount = filteredGoats.filter(g => g.category === 'Adult').length;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', fontFamily: "'Nunito', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Reports Generator
        </h1>
        <p style={{ color: 'var(--gray-600)', margin: '6px 0 0', fontSize: '0.92rem' }}>
          Analyze farm records, generate individual profiles, and export filtered herd data sheets.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(46,125,50,0.1)', borderTop: '4px solid var(--primary-green)', borderRadius: '50%' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          
          {/* LEFT SIDE: BULK SPREADSHEET EXPORTER CARD */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green)', margin: '0 0 8px 0' }}>
              Export Herd Ledger Report
            </h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.4 }}>
              Filter farm livestock by categories, sources, and health status, then export a structured excel sheet.
            </p>

            {/* Filter 1: Goat Source */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Goat Source
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'born', 'purchased'].map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSourceFilter(src)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: sourceFilter === src ? '1.5px solid var(--primary-green)' : '1px solid #cbd5e1',
                      background: sourceFilter === src ? '#e8f5e9' : 'white',
                      color: sourceFilter === src ? 'var(--primary-green)' : 'var(--gray-800)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    {src === 'all' ? 'All Sources' : src === 'born' ? 'Farm Born' : 'Purchased'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Category */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Animal Category
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'Adult', 'Kid'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat);
                      // Reset kid filter if switching category
                      if (cat === 'Adult') setKidStatusFilter('all');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: categoryFilter === cat ? '1.5px solid var(--primary-green)' : '1px solid #cbd5e1',
                      background: categoryFilter === cat ? '#e8f5e9' : 'white',
                      color: categoryFilter === cat ? 'var(--primary-green)' : 'var(--gray-800)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    {cat === 'all' ? 'All' : cat === 'Adult' ? 'Adult Goats' : 'Kids Module'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: Kids Status Filter (Context-Aware, visible only if Kids can be included) */}
            {(categoryFilter === 'all' || categoryFilter === 'Kid') && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '20px',
                animation: 'fadeIn 0.2s'
              }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Kids Status Options
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['all', 'alive', 'deceased'].map(stat => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setKidStatusFilter(stat)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: kidStatusFilter === stat ? '1.5px solid var(--primary-green)' : '1px solid #cbd5e1',
                        background: kidStatusFilter === stat ? 'white' : '#f8fafc',
                        color: kidStatusFilter === stat ? 'var(--primary-green)' : 'var(--gray-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {stat === 'all' ? 'All Kids' : stat === 'alive' ? 'Alive Kids' : 'Deceased Kids'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter 4: General Status Filter */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Herd Status
              </label>
              <select
                value={generalStatusFilter}
                onChange={(e) => setGeneralStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: 'white',
                  outline: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                <option value="all">All Statuses (Active, Sold, Deceased)</option>
                <option value="active">Active / Alive Only</option>
                <option value="sold">Sold Registry Only</option>
                <option value="deceased">Deceased Registry Only</option>
              </select>
            </div>

            {/* LIVE PREVIEW AND SUBMIT */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed var(--primary-green)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '0.88rem'
            }}>
              <strong style={{ display: 'block', color: 'var(--dark-green)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Export Preview:
              </strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Farm Born Goats:</span>
                <strong style={{ color: 'var(--text-dark)' }}>{bornCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--gray-600)' }}>Purchased Goats:</span>
                <strong style={{ color: 'var(--text-dark)' }}>{purchasedCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: 'var(--gray-800)', fontWeight: 700 }}>Total Export Records:</span>
                <strong style={{ color: 'var(--primary-green)', fontWeight: 800 }}>{filteredGoats.length} Goats</strong>
              </div>
            </div>

            <button
              onClick={exportSpreadsheet}
              disabled={filteredGoats.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-green)',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: filteredGoats.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredGoats.length === 0 ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(46,125,50,0.12)',
                marginTop: 'auto'
              }}
            >
              Export Spreadsheet Report
            </button>
          </div>

          {/* RIGHT SIDE: INDIVIDUAL GOAT PROFILE REPORT CARD */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green)', margin: '0 0 8px 0' }}>
              Individual Profile Report
            </h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.4 }}>
              Select a specific animal to view its full interactive history, lineage details, weight charts, and treatment logs.
            </p>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Select Goat Profile
              </label>
              <select
                value={selectedGoat}
                onChange={(e) => setSelectedGoat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: 'white',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--text-dark)'
                }}
              >
                <option value="">Choose a goat...</option>
                {goats.map(g => (
                  <option key={g.goat_id} value={g.goat_id}>
                    {g.name || 'Unnamed'} ({g.goat_id}) - {g.gender === 'male' ? 'Male' : 'Female'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>
                Report Section Target
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {[
                  { id: 'profile', title: 'Full Card Profile', desc: 'Complete parentage details, history logs and family connections.' },
                  { id: 'weight', title: 'Weight Ledger & Chart', desc: 'Listing of weight tracking metrics and visual growth curves.' },
                  { id: 'treatment', title: 'Treatments & Prescriptions', desc: 'Active treatment log sheets and medicines logged.' }
                ].map(opt => {
                  const isSelected = reportType === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setReportType(opt.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--primary-green)' : '1px solid #e2e8f0',
                        background: isSelected ? '#e8f5e9' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: isSelected ? 'var(--dark-green)' : 'var(--text-dark)' }}>
                        {opt.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--gray-600)', lineHeight: 1.35 }}>
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={exportIndividualReport}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-green)',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46,125,50,0.12)'
              }}
            >
              Export Spreadsheet
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default Reports;