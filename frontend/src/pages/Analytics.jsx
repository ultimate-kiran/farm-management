import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function Analytics() {
  const { api } = useApp();
  
  // Separate Weight data states for Adults and Kids
  const [adultWeightData, setAdultWeightData] = useState([]);
  const [kidWeightData, setKidWeightData] = useState([]);
  
  const [genderData, setGenderData] = useState([]);
  const [breedData, setBreedData] = useState([]);
  const [birthData, setBirthData] = useState([]);
  const [treatmentData, setTreatmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wAdult, wKid, g, b, br, t] = await Promise.all([
        api('/analytics/weight-chart?category=Adult'),
        api('/analytics/weight-chart?category=Kid'),
        api('/analytics/gender-ratio'),
        api('/analytics/breed-distribution'),
        api('/analytics/birth-rate'),
        api('/analytics/treatment-frequency')
      ]);
      setAdultWeightData(wAdult);
      setKidWeightData(wKid);
      setGenderData(g);
      setBreedData(b);
      setBirthData(br);
      setTreatmentData(t);
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
      <h1 style={{ marginBottom: 24 }}>Analytics & Performance Trends</h1>

      <div className="charts-grid">
        {/* 📈 Average Adult Weight Chart */}
        <div className="chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2E7D32' }}>
            <span>🐐 Average Adult Weight by Month</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adultWeightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} kg`, 'Avg Weight']} />
              <Line type="monotone" dataKey="avgWeight" stroke="#2E7D32" strokeWidth={2.5} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
          {adultWeightData.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem', margin: '20px 0 0' }}>No historical adult weight logs recorded yet.</p>
          )}
        </div>

        {/* 🐣 Average Kid Weight Chart */}
        <div className="chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#006064' }}>
            <span>🐣 Average Kid Weight by Month</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kidWeightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} kg`, 'Avg Weight']} />
              <Line type="monotone" dataKey="avgWeight" stroke="#006064" strokeWidth={2.5} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
          {kidWeightData.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem', margin: '20px 0 0' }}>No historical kid weight logs recorded yet.</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Population by Gender</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                <Cell fill="#1976D2" />
                <Cell fill="#9C27B0" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Population by Breed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="breed" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Birth Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={birthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" style={{ fontSize: 11 }} />
              <YAxis style={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" fill="#81C784" stroke="#2E7D32" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Treatment Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={treatmentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" style={{ fontSize: 11 }} />
              <YAxis dataKey="problem" type="category" width={100} style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#F57C00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;