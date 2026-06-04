import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function Layout() {
  const { logout, user, api, notifications, loadingNotifications, fetchNotifications, dismissNotification } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/goats', icon: '🐐', label: 'Adult Goats' },
    { path: '/kids', icon: '🐣', label: 'Kids Module' },
    { path: '/sold-goats', icon: '💸', label: 'Sold Goats' },
    { path: '/goats/add', icon: '➕', label: 'Add Goat' },
    { path: '/mating', icon: '🔄', label: 'Mating' },
    { path: '/weight', icon: '⚖️', label: 'Weight Tracker' },
    { path: '/treatments', icon: '💊', label: 'Treatments' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/reports', icon: '📄', label: 'Reports' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-leaves"></div>
        <div className="sidebar-header">
          <h1>🌾 V Organic</h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 4 }}>Farm Management System</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2>Farm Management System</h2>
          </div>
          <div className="navbar-user">
            {/* Bell Icon Notification Trigger */}
            <button 
              onClick={() => {
                fetchNotifications();
                setDrawerOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '50%',
                marginRight: '8px',
                transition: 'background 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              title="Action Center Alerts"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px white'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>

            <span>Welcome, {user?.username || 'Admin'}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* ── GLOBAL NOTIFICATION DRAWER ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: drawerOpen ? 0 : '-440px',
        width: '420px',
        maxWidth: '100%',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transition: 'right 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Nunito', sans-serif"
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>Action Center</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', fontWeight: 700 }}>
              {notifications.length} task{notifications.length !== 1 ? 's' : ''} require attention
            </span>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#f8fafc'
        }}>
          {loadingNotifications ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Syncing action items...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--gray-600)' }}>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-dark)' }}>All Caught Up!</strong>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>No mating readiness, kid promotions, expected kidding dates, weight loss alerts, or treatment updates pending.</span>
            </div>
          ) : (
            notifications.map(n => {
              let color = '#3b82f6';
              if (n.category === 'promotion') color = '#f59e0b';
              if (n.category === 'treatment') color = '#ef4444';
              if (n.category === 'mating_check') color = '#6366f1';
              if (n.category === 'kidding_due') color = '#ec4899';
              if (n.category === 'weight_loss') color = '#e11d48';

              return (
                <div 
                  key={n.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    borderLeft: `4px solid ${color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {n.title}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.45, fontWeight: 600 }}>
                    {n.message}
                  </p>
                  {n.category === 'weight_loss' ? (
                    <button
                      onClick={() => {
                        if (dismissNotification) {
                          dismissNotification(n.id);
                        }
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-green)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: 0,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Noted
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(n.link);
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-green)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        padding: 0,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Resolve Task →
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Drawer Overlay Backdrop */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;