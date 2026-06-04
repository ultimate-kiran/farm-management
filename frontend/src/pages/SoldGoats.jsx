import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

function SoldGoats() {
  const { api } = useApp();
  const navigate = useNavigate();

  const handleExportExcel = () => {
    if (soldGoats.length === 0) {
      alert('No sales data available to export.');
      return;
    }

    const formattedData = soldGoats.map(g => ({
      'Goat ID': g.goat_id,
      'Name': g.name || 'Unnamed',
      'Gender': g.gender,
      'Breed': g.breed || 'Country',
      'Sale Date': g.sale_details?.sale_date ? new Date(g.sale_details.sale_date).toLocaleDateString() : 'N/A',
      'Weight at Sale': g.sale_details?.weight_at_sale ? `${g.sale_details.weight_at_sale} kg` : 'N/A',
      'Sale Price (INR)': g.sale_details?.sale_price || 0,
      'Profit / Loss (INR)': g.sale_details?.profit_loss || 0,
      'Buyer Details': g.sale_details?.buyer_details || '—',
      'Reason for Sale': g.sale_details?.reason_for_sale || '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sold Goats Ledger');
    XLSX.writeFile(workbook, 'V_Organic_Sold_Goats_Ledger.xlsx');
  };

  const [soldGoats, setSoldGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSoldGoats();
  }, []);

  const loadSoldGoats = async () => {
    try {
      const data = await api('/goats?status=sold');
      setSoldGoats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoats = soldGoats.filter(g => 
    g.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Financial Metrics Calculations
  const totalRevenue = soldGoats.reduce((sum, g) => sum + (g.sale_details?.sale_price || 0), 0);
  const totalProfitLoss = soldGoats.reduce((sum, g) => sum + (g.sale_details?.profit_loss || 0), 0);
  const averageSalePrice = soldGoats.length > 0 ? (totalRevenue / soldGoats.length).toFixed(2) : 0;

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
        <div>
          <h1 style={{ margin: 0 }}>Sold Goats Registry</h1>
          <p style={{ color: 'var(--gray-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Historical sales records and financial ledger
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleExportExcel}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
        >
          📥 Export Ledger (Excel)
        </button>
      </div>

      {/* 📊 Sales Metric Panels */}
      {soldGoats.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ borderLeft: '5px solid #d97706' }}>
            <div className="stat-icon orange" style={{ background: '#FEF3C7', color: '#D97706' }}>📈</div>
            <div className="stat-info">
              <h3>{soldGoats.length}</h3>
              <p>Total Goats Sold</p>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '5px solid #10b981' }}>
            <div className="stat-icon green" style={{ background: '#D1FAE5', color: '#10B981' }}>💰</div>
            <div className="stat-info">
              <h3>₹ {totalRevenue.toLocaleString()}</h3>
              <p>Total Revenue (INR)</p>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: `5px solid ${totalProfitLoss >= 0 ? '#10b981' : '#EF4444'}` }}>
            <div className="stat-icon" style={{
              background: totalProfitLoss >= 0 ? '#D1FAE5' : '#FEE2E2',
              color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444'
            }}>
              🪙
            </div>
            <div className="stat-info">
              <h3 style={{ color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444' }}>
                {totalProfitLoss >= 0 ? '+' : ''}₹ {totalProfitLoss.toLocaleString()}
              </h3>
              <p>Total Profit / Loss</p>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '5px solid #8B5CF6' }}>
            <div className="stat-icon blue" style={{ background: '#EDE9FE', color: '#8B5CF6' }}>⚖️</div>
            <div className="stat-info">
              <h3>₹ {parseFloat(averageSalePrice).toLocaleString()}</h3>
              <p>Avg. Price per Sale</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search sold goats by ID or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {soldGoats.length === 0 ? (
        <div className="no-data">
          <span style={{ fontSize: '48px' }}>💸</span>
          <h3>No sold goats found</h3>
          <p>Goats will appear here once they are marked as Sold in the Adult Goats module.</p>
        </div>
      ) : filteredGoats.length === 0 ? (
        <div className="no-data">
          <h3>No search results match</h3>
          <p>Try querying a different goat name or ID number.</p>
        </div>
      ) : (
        <div className="goats-table">
          <table>
            <thead>
              <tr>
                <th>Goat ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Breed</th>
                <th>Sale Date</th>
                <th>Weight at Sale</th>
                <th>Sale Price (INR)</th>
                <th>Profit / Loss</th>
                <th>Buyer / Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoats.map(goat => {
                const profitLoss = goat.sale_details?.profit_loss || 0;
                
                return (
                  <tr key={goat.goat_id} onClick={() => navigate(`/goats/${goat.goat_id}`)} style={{ cursor: 'pointer' }}>
                    <td><span className="goat-card-id">{goat.goat_id}</span></td>
                    <td><strong>{goat.name || 'Unnamed Kid'}</strong></td>
                    <td><span className={`badge badge-${goat.gender}`}>{goat.gender}</span></td>
                    <td>{goat.breed}</td>
                    <td>
                      {goat.sale_details?.sale_date 
                        ? new Date(goat.sale_details.sale_date).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                    <td>
                      {goat.sale_details?.weight_at_sale 
                        ? `${goat.sale_details.weight_at_sale} kg` 
                        : 'N/A'}
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        ₹ {goat.sale_details?.sale_price ? goat.sale_details.sale_price.toLocaleString() : '0'}
                      </strong>
                    </td>
                    <td>
                      <span style={{ 
                        color: profitLoss >= 0 ? '#10b981' : '#ef4444', 
                        fontWeight: 700 
                      }}>
                        {profitLoss >= 0 ? '+' : ''}₹ {profitLoss.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                      {goat.sale_details?.buyer_details || '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-btn" 
                        style={{ background: 'var(--info)', color: 'white', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/goats/${goat.goat_id}`)}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SoldGoats;
