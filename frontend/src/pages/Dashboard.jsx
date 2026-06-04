import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function Dashboard() {
  const { api } = useApp();
  const [stats, setStats] = useState(null);
  const [populationGrowth, setPopulationGrowth] = useState([]);
  const [genderRatio, setGenderRatio] = useState([]);
  const [breedDistribution, setBreedDistribution] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, popData, genderData, breedData, alertData] = await Promise.all([
        api('/analytics/dashboard'),
        api('/analytics/population-growth'),
        api('/analytics/gender-ratio'),
        api('/analytics/breed-distribution'),
        api('/analytics/alerts')
      ]);

      setStats(statsData);
      setPopulationGrowth(popData);
      setGenderRatio(genderData);
      setBreedDistribution(breedData);
      setAlerts(alertData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      {/* 📊 High-Level Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.totalGoats || 0}</h3>
            <p>Total Goats</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.maleGoats || 0}</h3>
            <p>Male Goats</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5"/>
              <path d="M3 21v-2a7 7 0 0 1 14 0v2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.femaleGoats || 0}</h3>
            <p>Female Goats</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.pregnantGoats || 0}</h3>
            <p>Pregnant Goats</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon brown">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="12" cy="10" r="3"/>
              <path d="M7 21v-2a4 4 0 0 1 4-4h2"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.kidsThisMonth || 0}</h3>
            <p>Kids This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18"/>
              <rect x="4" y="8" width="4" height="8"/>
              <rect x="10" y="12" width="4" height="4"/>
              <rect x="16" y="6" width="4" height="10"/>
            </svg>
          </div>
          <div className="stat-info">
            <h3>{stats?.avgWeight || 0} kg</h3>
            <p>Average Weight</p>
          </div>
        </div>
      </div>

      {/* 📈 Dashboard Census Charts (Executive Census Overview) */}
      <div className="charts-grid" style={{ marginTop: 8 }}>
        {/* 📈 Population Growth over Time */}
        <div className="chart-card">
          <h3 style={{ color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
            <span>📈 Herd Population Growth</span>
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={populationGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" fill="rgba(46, 125, 50, 0.12)" stroke="var(--primary-green)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 🧬 Breed Distribution Bar Chart */}
        <div className="chart-card">
          <h3 style={{ color: 'var(--earth-brown)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
            <span>🐐 Breed Census</span>
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={breedDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="breed" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--secondary-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ⚖️ Gender Ratio Pie Chart */}
        <div className="chart-card">
          <h3 style={{ color: '#1976D2', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
            <span>🧬 Gender Ratio Balance</span>
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={genderRatio}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#1976D2" />
                <Cell fill="#9C27B0" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔔 Expected Kidding Dates Alerts */}
      {alerts.expectedKidding?.length > 0 && (
        <div className="alerts-section" style={{ marginTop: 12 }}>
          <h3>🔔 Upcoming Expected Kidding Dates (Next 30 Days)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
            {alerts.expectedKidding.map((alert, i) => (
              <div key={i} className="alert-card" style={{ borderLeft: '4px solid var(--warning)', margin: 0 }}>
                <h4 style={{ margin: '0 0 4px 0' }}>{alert.name || 'Unnamed Female'} ({alert.goat_id})</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  Expected: <strong>{new Date(alert.expected_date).toLocaleDateString()}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;