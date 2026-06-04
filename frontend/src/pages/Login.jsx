import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();

  // Redirect to dashboard automatically if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Style block for smooth custom transitions, focus state animations, and keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-fade-in {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .login-card-responsive {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          padding: 40px 32px;
          width: 90%;
          max-width: 420px;
          box-sizing: border-box;
        }
        @media (max-width: 480px) {
          .login-card-responsive {
            padding: 28px 20px;
          }
        }
        .login-input {
          width: 100% !important;
          height: 52px !important;
          padding: 14px 16px 14px 44px !important;
          border: 2px solid #e2e8f0 !important;
          border-radius: 10px !important;
          font-size: 1rem !important;
          font-family: 'Nunito', sans-serif !important;
          transition: all 0.25s ease !important;
          background: #f8fafc !important;
          box-sizing: border-box !important;
        }
        .login-input:focus {
          outline: none !important;
          border-color: var(--secondary-green) !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.15) !important;
        }
        .login-input-password {
          padding-right: 48px !important;
        }
        .login-btn-gradient {
          background: linear-gradient(135deg, var(--primary-green) 0%, var(--dark-green) 100%) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 14px !important;
          border-radius: 10px !important;
          font-size: 1rem !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          width: 100% !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 15px rgba(46,125,50,0.25) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          height: 52px !important;
        }
        .login-btn-gradient:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(46,125,50,0.35) !important;
          filter: brightness(1.05) !important;
        }
        .login-btn-gradient:active:not(:disabled) {
          transform: translateY(0) !important;
        }
        .login-btn-gradient:disabled {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
        }
      `}</style>

      <div className="login-card-responsive animate-fade-in">
        {/* V Organic Brand Identity */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontSize: '44px',
            marginBottom: '10px',
            display: 'inline-block',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.06))'
          }}>
            🌾
          </div>
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            color: 'var(--dark-green)',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            V Organic
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--gray-600)',
            margin: 0,
            fontWeight: 600
          }}>
            Management Portal Login
          </p>
        </div>

        {/* Validation Errors & Alert Banner */}
        {error && (
          <div className="animate-shake" style={{
            background: '#FEF2F2',
            borderLeft: '4px solid #EF4444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(239,68,68,0.08)'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{
              color: '#991B1B',
              fontSize: '0.9rem',
              fontWeight: 700,
              lineHeight: 1.4
            }}>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Username Input Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
              />
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#94a3b8',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                👤
              </span>
            </div>
          </div>

          {/* Password Input Field with Show/Hide Toggle */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#94a3b8',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🔑
              </span>
              
              {/* Show/Hide Password Switch */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary-green)'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="login-btn-gradient"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: '#ffffff',
                  animation: 'spin 0.8s linear infinite',
                  marginRight: '4px'
                }} />
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                Authenticating...
              </>
            ) : (
              'Sign In to Dashboard 🚀'
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '28px',
          padding: '14px',
          background: 'rgba(255, 248, 225, 0.7)',
          border: '1px dashed rgba(224, 185, 116, 0.4)',
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--earth-brown)'
        }}>
          <strong>Demo Access Credentials:</strong>
          <div style={{ marginTop: '4px', letterSpacing: '0.3px' }}>
            Username: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>admin</code>
            {' '}&nbsp;{' '}
            Password: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>admin123</code>
          </div>
        </div>

        {/* Navigation Link to Return to the Landing Page */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-green)',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            ← Back to Public Website
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;