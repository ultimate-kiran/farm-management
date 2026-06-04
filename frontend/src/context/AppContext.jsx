import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  };

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    throw new Error(data.message);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const api = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    return res.json();
  };

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifications(true);
      const [goats, matings, treatments, weightRecords] = await Promise.all([
        api('/goats'),
        api('/mating'),
        api('/treatments'),
        api('/weight')
      ]);

      const list = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Mating Readiness (Female completed recovery period >= 60 days)
      const adultFemales = goats.filter(g => g.gender === 'female' && g.category === 'Adult' && g.status === 'active');
      adultFemales.forEach(female => {
        const eligibility = female.mating_eligibility;
        if (eligibility && eligibility.status === 'Eligible') {
          list.push({
            id: `mating-ready-${female.goat_id}`,
            category: 'mating',
            title: 'Mating Eligibility',
            message: `Female ${female.name || female.goat_id} is active and ready for mating.`,
            link: '/mating'
          });
        }
      });

      // 2. Kid Promotion (Age >= 3 months)
      const kids = goats.filter(g => g.category === 'Kid' && g.status === 'active');
      kids.forEach(kid => {
        if (kid.dob) {
          const dob = new Date(kid.dob);
          const diffTime = Math.abs(today - dob);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const ageMonths = diffDays / 30.43;
          if (ageMonths >= 3.0) {
            list.push({
              id: `kid-promote-${kid.goat_id}`,
              category: 'promotion',
              title: 'Kid Promotion Ready',
              message: `Newborn ${kid.name || kid.goat_id} is ${ageMonths.toFixed(1)} months old and ready to be promoted to Adult.`,
              link: '/kids'
            });
          }
        }
      });

      // 3. Pending Mating Checks (100 days elapsed)
      const pendingMatings = matings.filter(m => m.status === 'pending');
      pendingMatings.forEach(mating => {
        if (mating.mating_date) {
          const matingDate = new Date(mating.mating_date);
          matingDate.setHours(0, 0, 0, 0);
          const diffTime = today - matingDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 100) {
            const maleGoat = goats.find(g => g.goat_id === mating.male_goat_id);
            const femaleGoat = goats.find(g => g.goat_id === mating.female_goat_id);
            const maleName = maleGoat ? (maleGoat.name || maleGoat.goat_id) : mating.male_goat_id;
            const femaleName = femaleGoat ? (femaleGoat.name || femaleGoat.goat_id) : mating.female_goat_id;

            list.push({
              id: `mating-check-${mating.mating_id}`,
              category: 'mating_check',
              title: 'Pregnancy Check Required',
              message: `Mating between Male ${maleName} and Female ${femaleName} reached ${diffDays} days. Please update status.`,
              link: '/mating'
            });
          }
        }
      });

      // 3.5 Expected Kidding Due (Pregnant goats that reached/passed expected kidding date)
      const pregnantMatings = matings.filter(m => m.status === 'pregnant');
      pregnantMatings.forEach(mating => {
        if (mating.expected_kidding_date) {
          const expectedKidding = new Date(mating.expected_kidding_date);
          expectedKidding.setHours(0, 0, 0, 0);
          if (expectedKidding <= today) {
            const femaleGoat = goats.find(g => g.goat_id === mating.female_goat_id);
            const femaleName = femaleGoat ? (femaleGoat.name || femaleGoat.goat_id) : mating.female_goat_id;
            const diffTime = today - expectedKidding;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            let timeStr = 'today';
            if (diffDays > 0) {
              timeStr = `${diffDays} day${diffDays !== 1 ? 's' : ''} overdue`;
            }

            list.push({
              id: `kidding-due-${mating.mating_id}`,
              category: 'kidding_due',
              title: 'Expected Kidding Due',
              message: `Female ${femaleName} is expected to give birth (${timeStr}). Kidding expected on ${expectedKidding.toLocaleDateString()}.`,
              link: '/mating'
            });
          }
        }
      });

      // 3.8 Weight Loss Alerts (Latest weight is lower than previous, recorded in the last 30 days)
      const weightsByGoat = {};
      (weightRecords || []).forEach(w => {
        if (!weightsByGoat[w.goat_id]) {
          weightsByGoat[w.goat_id] = [];
        }
        weightsByGoat[w.goat_id].push(w);
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dismissedAlerts = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');

      Object.keys(weightsByGoat).forEach(goatId => {
        const sorted = weightsByGoat[goatId].sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date));
        if (sorted.length >= 2) {
          const latest = sorted[0];
          const previous = sorted[1];
          const latestDate = new Date(latest.recorded_date);

          if (latestDate >= thirtyDaysAgo && latest.weight < previous.weight) {
            const alertId = `weight-loss-${latest.weight_id}`;
            if (!dismissedAlerts.includes(alertId)) {
              const goat = goats.find(g => g.goat_id === goatId);
              const goatName = goat ? (goat.name || goat.goat_id) : goatId;
              const loss = (previous.weight - latest.weight).toFixed(1);
              
              list.push({
                id: alertId,
                category: 'weight_loss',
                title: 'Weight Loss Alert',
                message: `Goat ${goatName} lost ${loss} kg. Weight dropped from ${previous.weight} kg on ${new Date(previous.recorded_date).toLocaleDateString()} to ${latest.weight} kg on ${latestDate.toLocaleDateString()}.`,
                link: '/weight'
              });
            }
          }
        }
      });

      // 4. Treatment medication checkup
      const activeTreatments = treatments || [];
      const latestCheckupByGoat = {};
      activeTreatments.forEach(t => {
        if (t.next_checkup) {
          const currentLatest = latestCheckupByGoat[t.goat_id];
          if (!currentLatest || new Date(t.treatment_date) > new Date(currentLatest.treatment_date)) {
            latestCheckupByGoat[t.goat_id] = t;
          }
        }
      });

      Object.values(latestCheckupByGoat).forEach(t => {
        const checkupDate = new Date(t.next_checkup);
        checkupDate.setHours(0, 0, 0, 0);
        if (checkupDate <= today) {
          const hasNewerTreatment = activeTreatments.some(other => 
            other.goat_id === t.goat_id && 
            new Date(other.treatment_date) > new Date(t.treatment_date)
          );

          if (!hasNewerTreatment) {
            const goat = goats.find(g => g.goat_id === t.goat_id);
            const nameStr = goat ? (goat.name || goat.goat_id) : t.goat_id;
            list.push({
              id: `treatment-${t.treatment_id}`,
              category: 'treatment',
              title: 'Treatment Follow-up',
              message: `Goat ${nameStr} has a follow-up checkup scheduled for ${checkupDate.toLocaleDateString()}. Diagnosis: ${t.problem}.`,
              link: '/treatments'
            });
          }
        }
      });

      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const dismissNotification = (id) => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('dismissedAlerts', JSON.stringify(dismissed));
      }
      fetchNotifications();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [token]);

  return (
    <AppContext.Provider value={{ 
      user, token, login, logout, api, isAuthenticated: !!token,
      notifications, loadingNotifications, fetchNotifications, dismissNotification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}