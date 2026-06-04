import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllGoats from './pages/AllGoats';
import AddGoat from './pages/AddGoat';
import Kids from './pages/Kids';
import SoldGoats from './pages/SoldGoats'; // Import Sold Goats Module
import GoatProfile from './pages/GoatProfile';
import WeightTracker from './pages/WeightTracker';
import Treatments from './pages/Treatments';
import Mating from './pages/Mating';

import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goats" element={<AllGoats />} />
            <Route path="/kids" element={<Kids />} />
            <Route path="/sold-goats" element={<SoldGoats />} />
            <Route path="/goats/add" element={<AddGoat />} />
            <Route path="/goats/:id" element={<GoatProfile />} />
            <Route path="/weight" element={<WeightTracker />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/mating" element={<Mating />} />

            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;