import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

function Settings() {
  const { api } = useApp();
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [exporting, setExporting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    try {
      const response = await api('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      });
      setMessage({ text: response.message || 'Password updated successfully', type: 'success' });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [goats, weights, treatments, matings, kidding] = await Promise.all([
        api('/goats'),
        api('/weight'),
        api('/treatments'),
        api('/mating'),
        api('/kidding')
      ]);

      const wb = XLSX.utils.book_new();

      // Goats Sheet
      const goatsData = goats.map(g => ({
        'Goat ID': g.goat_id,
        'Name': g.name || '',
        'Gender': g.gender,
        'Breed': g.breed,
        'Color': g.color,
        'Date of Birth': g.dob ? new Date(g.dob).toLocaleDateString() : '',
        'Source': g.source_type,
        'Status': g.status,
        'Father ID': g.father_id || '',
        'Mother ID': g.mother_id || '',
        'Purchase Date': g.purchase_details?.purchase_date ? new Date(g.purchase_details.purchase_date).toLocaleDateString() : '',
        'Seller Name': g.purchase_details?.seller_name || '',
        'Purchase Cost': g.purchase_details?.purchase_cost || '',
        'Source Farm': g.purchase_details?.source_farm || ''
      }));
      const goatsSheet = XLSX.utils.json_to_sheet(goatsData);
      XLSX.utils.book_append_sheet(wb, goatsSheet, 'Goats');

      // Weight Records Sheet
      const weightData = weights.map(w => ({
        'Weight ID': w.weight_id,
        'Goat ID': w.goat_id,
        'Weight (kg)': w.weight,
        'Date': w.recorded_date ? new Date(w.recorded_date).toLocaleDateString() : '',
        'Notes': w.notes || ''
      }));
      const weightSheet = XLSX.utils.json_to_sheet(weightData);
      XLSX.utils.book_append_sheet(wb, weightSheet, 'Weight Records');

      // Treatment Records Sheet
      const treatmentData = treatments.map(t => ({
        'Treatment ID': t.treatment_id,
        'Goat ID': t.goat_id,
        'Date': t.treatment_date ? new Date(t.treatment_date).toLocaleDateString() : '',
        'Problem/Diagnosis': t.problem,
        'Notes': t.notes || '',
        'Treated By': t.treated_by || '',
        'Next Checkup': t.next_checkup ? new Date(t.next_checkup).toLocaleDateString() : '',
        'Medicines': t.medicines?.map(m => `${m.medicine_name} (${m.dosage}, ${m.type})`).join('; ') || ''
      }));
      const treatmentSheet = XLSX.utils.json_to_sheet(treatmentData);
      XLSX.utils.book_append_sheet(wb, treatmentSheet, 'Treatments');

      // Mating Records Sheet
      const matingData = matings.map(m => ({
        'Mating ID': m.mating_id,
        'Male Goat ID': m.male_goat_id,
        'Female Goat ID': m.female_goat_id,
        'Mating Date': m.mating_date ? new Date(m.mating_date).toLocaleDateString() : '',
        'Expected Kidding Date': m.expected_kidding_date ? new Date(m.expected_kidding_date).toLocaleDateString() : '',
        'Status': m.status
      }));
      const matingSheet = XLSX.utils.json_to_sheet(matingData);
      XLSX.utils.book_append_sheet(wb, matingSheet, 'Mating Records');

      // Kidding Records Sheet
      const kiddingData = kidding.map(k => ({
        'Kidding ID': k.kidding_id,
        'Mother Goat ID': k.mother_goat_id,
        'Father Goat ID': k.father_goat_id,
        'Kidding Date': k.kidding_date ? new Date(k.kidding_date).toLocaleDateString() : '',
        'Number of Kids': k.kids_count,
        'Kids IDs': k.kids?.join(', ') || ''
      }));
      const kiddingSheet = XLSX.utils.json_to_sheet(kiddingData);
      XLSX.utils.book_append_sheet(wb, kiddingSheet, 'Kidding Records');

      // Generate and download Excel file
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `LivestockCorp_Export_${dateStr}.xlsx`);

      alert('Data exported successfully!');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

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
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '120px', bottom: '-80px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Settings
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
              System Config
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1.05rem', maxWidth: '650px', lineHeight: 1.5 }}>
            Configure your farm manager security credentials, view server metadata, and download complete backup archives of your livestock records.
          </p>
        </div>
      </div>

      {/* ── RESPONSIVE DUAL-COLUMN GRID ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '32px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Security Form */}
        <div style={{
          flex: '1 1 450px',
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          position: 'relative'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Password & Security
          </h3>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '24px', fontWeight: 600 }}>
            Update your login credentials below. For security, do not share credentials with staff.
          </p>
          
          <form onSubmit={handlePasswordChange}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Current Password</label>
              <input 
                type="password" 
                value={passwordForm.current} 
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>New Password</label>
              <input 
                type="password" 
                value={passwordForm.new} 
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-800)', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordForm.confirm} 
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
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
              Update Password
            </button>
          </form>
          {message.text && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
              color: message.type === 'error' ? '#991b1b' : '#065f46',
              border: message.type === 'error' ? '1px solid #fca5a5' : '1px solid #6ee7b7'
            }}>
              {message.text}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Backup */}
        <div style={{
          flex: '1 1 450px',
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Data Archival & Backup
          </h3>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px', fontWeight: 600 }}>
            Export a complete backup database of all registered livestock records to an Excel file. This includes individual sheets for Goats, Weight Records, Treatments, Mating Runs, and Kidding Deliveries.
          </p>
          <button 
            onClick={handleExport} 
            disabled={exporting}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              background: 'var(--primary-green)',
              color: 'white',
              cursor: exporting ? 'not-allowed' : 'pointer',
              boxShadow: exporting ? 'none' : '0 4px 12px rgba(46,125,50,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => { if (!exporting) e.target.style.background = 'var(--dark-green)'; }}
            onMouseLeave={(e) => { if (!exporting) e.target.style.background = 'var(--primary-green)'; }}
          >
            {exporting ? 'Exporting Archive...' : 'Download Full Backup (Excel)'}
          </button>
        </div>

      </div>

    </div>
  );
}

export default Settings;