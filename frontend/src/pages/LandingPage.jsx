import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      color: '#2d3748',
      background: '#fff',
      minHeight: '100vh',
      scrollBehavior: 'smooth'
    }}>
      
      {/* ── 🟢 PREMIUM STICKY HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '3px solid var(--secondary-green)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 6%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => handleScroll('home')}>
          <span style={{ fontSize: '28px' }}>🌾</span>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-green)', letterSpacing: '0.5px' }}>
            V Organic
          </h2>
        </div>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['home', 'about', 'products', 'contact'].map(sec => (
            <button
              key={sec}
              onClick={() => handleScroll(sec)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#4a5568',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'color 0.2s',
                padding: '6px 0'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-green)'}
              onMouseLeave={(e) => e.target.style.color = '#4a5568'}
            >
              {sec}
            </button>
          ))}
        </nav>

        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          style={{
            background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--dark-green) 100%)',
            color: '#fff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '24px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(46,125,50,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(46,125,50,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(46,125,50,0.2)';
          }}
        >
          {isAuthenticated ? 'Dashboard 📊' : 'Portal Login 🔑'}
        </button>
      </header>

      {/* ── ⚡ HERO BANNER SECTION ── */}
      <section id="home" style={{
        position: 'relative',
        minHeight: '85vh',
        background: 'linear-gradient(135deg, rgba(27,94,32,0.92) 0%, rgba(46,125,50,0.85) 100%), url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1470&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: '0 6%',
        textAlign: 'center'
      }}>
        {/* Background Leaves Pattern Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(#fff 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div style={{ maxWidth: '800px', zIndex: 2 }}>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 18px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '20px',
            display: 'inline-block',
            backdropFilter: 'blur(4px)'
          }}>
            🌱 100% Certified Organic Farm
          </span>
          <h1 style={{
            fontSize: '3.8rem',
            fontWeight: 800,
            margin: '12px 0 20px 0',
            lineHeight: 1.15,
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.15)'
          }}>
            Fresh. Organic. Trusted.
          </h1>
          <p style={{
            fontSize: '1.25rem',
            lineHeight: 1.6,
            marginBottom: '36px',
            opacity: 0.95,
            fontWeight: 600,
            maxWidth: '650px',
            margin: '0 auto 40px auto'
          }}>
            Nourishing families with premium milk, fresh poultry eggs, and organically nurtured livestock. Farmed with integrity, delivered with care.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleScroll('products')}
              style={{
                padding: '14px 32px',
                borderRadius: '30px',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                background: '#fff',
                color: 'var(--dark-green)',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              Explore Products 🌾
            </button>
          </div>
        </div>
      </section>

      {/* ── 📖 ABOUT SECTION ── */}
      <section id="about" style={{ padding: '80px 10% 60px 10%', background: 'var(--cream, #FFF8E1)' }}>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
          
          {/* Card Left */}
          <div style={{ flex: 1, minWidth: '320px' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              OUR STORY
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--dark-green)', margin: '0 0 20px 0', lineHeight: 1.2 }}>
              Meet V Organic Farms
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#4a5568', marginBottom: '20px' }}>
              Founded and managed by **Vijay Kumar**, V Organic Farms is located in the heart of Tamil Nadu. We believe in working hand-in-hand with nature. Our methods are strictly organic, avoiding synthetic fertilizers, hormones, or chemical additives.
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#4a5568', marginBottom: '24px' }}>
              We raise healthy **Goats, Cows, and Free-Range Hens** in clean, pasture-based habitats. Through intensive, rotational organic feeding and uncompromising quality standards, we ensure that every product leaving our farm is pure and highly nutritious.
            </p>

            {/* Quote block */}
            <div style={{
              borderLeft: '4px solid var(--secondary-green)',
              paddingLeft: '16px',
              fontStyle: 'italic',
              color: 'var(--earth-brown)',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}>
              "Our philosophy is simple: healthy soil, healthy pasture, healthy animals, healthy people."
              <span style={{ display: 'block', fontSize: '0.9rem', fontStyle: 'normal', color: 'var(--light-earth)', marginTop: '8px', fontWeight: 700 }}>
                — Vijay Kumar, Owner & Founder
              </span>
            </div>
          </div>

          {/* Photo Right */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1500595046899-2f5a6b115b7c?q=80&w=600&auto=format&fit=crop"
                alt="Organic farming"
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  border: '6px solid #fff'
                }}
              />
              <div style={{
                position: 'absolute', bottom: '-20px', right: '-20px',
                background: 'var(--primary-green)', color: '#fff',
                padding: '16px 24px', borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(46,125,50,0.3)',
                textAlign: 'center'
              }}>
                <strong style={{ fontSize: '1.8rem', display: 'block' }}>100%</strong>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Chemical Free</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 🍎 PRODUCTS & SERVICES ── */}
      <section id="products" style={{ padding: '80px 10%' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--primary-green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.1px' }}>
            WHAT WE GROW
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--dark-green)', marginTop: '8px' }}>
            Fresh Farm Products
          </h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: '550px', margin: '8px auto 0 auto', fontSize: '1.05rem' }}>
            Wholesome, chemical-free organic selections sourced directly from our fields.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          
          {/* Card 1: Milk */}
          <div style={{
            background: '#ffffff', border: '1px solid var(--gray-200)',
            borderRadius: '12px', padding: '32px', textAlign: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--secondary-green)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(76,175,80,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--gray-200)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.03)';
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🥛</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-green)', marginBottom: '12px' }}>
              Fresh Creamy Milk
            </h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Rich, wholesome raw milk gathered fresh every morning from grass-fed cows. High in creaminess, fully pastured, and free from antibiotics.
            </p>
            <span style={{
              background: '#E8F5E9', color: '#1B5E20', padding: '6px 16px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700
            }}>
              Available Daily
            </span>
          </div>

          {/* Card 2: Goat Meat */}
          <div style={{
            background: '#ffffff', border: '1px solid var(--gray-200)',
            borderRadius: '12px', padding: '32px', textAlign: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--secondary-green)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(76,175,80,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--gray-200)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.03)';
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🐐</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-green)', marginBottom: '12px' }}>
              Premium Goat Meat
            </h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Organically fed, pastured free-range goat meat. Lean, highly tender, and harvested following strict hygienic practices.
            </p>
            <span style={{
              background: '#FFF3E0', color: '#E65100', padding: '6px 16px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700
            }}>
              Certified Quality
            </span>
          </div>

          {/* Card 3: Eggs */}
          <div style={{
            background: '#ffffff', border: '1px solid var(--gray-200)',
            borderRadius: '12px', padding: '32px', textAlign: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'var(--secondary-green)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(76,175,80,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--gray-200)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.03)';
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🥚</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-green)', marginBottom: '12px' }}>
              Free-Range Eggs
            </h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Nutritious free-range country hen eggs. Rich golden yolks, rich in proteins, laid by hens nurtured strictly on organic grain feeds.
            </p>
            <span style={{
              background: '#EDE9FE', color: '#5B21B6', padding: '6px 16px',
              borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700
            }}>
              100% Country Eggs
            </span>
          </div>

        </div>
      </section>

      {/* ── 🌟 FARM HIGHLIGHTS ── */}
      <section style={{ padding: '60px 10% 80px 10%', background: '#F8FAF5' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--dark-green)' }}>Our Core Standards</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px', background: '#E8F5E9', padding: '8px', borderRadius: '50%' }}>🐂</span>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Healthy Livestock</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>Our animals are raised in clean, stress-free pastures with daily health logs.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px', background: '#E0F7FA', padding: '8px', borderRadius: '50%' }}>🌾</span>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Organic Feeding</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>Rotation pastures and 100% pesticide-free grains ensure premium quality output.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px', background: '#F3E5F5', padding: '8px', borderRadius: '50%' }}>🛡️</span>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Quality Assurance</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>Uncompromising hygiene protocols are kept during harvest and packaging.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px', background: '#FFF3E0', padding: '8px', borderRadius: '50%' }}>🤝</span>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Trusted Local Farm</h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>Serving families in Tamil Nadu with honest values and farming practices.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── 📞 CONTACT SECTION ── */}
      <section id="contact" style={{ padding: '80px 10%', background: '#ffffff' }}>
        <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <span style={{ color: 'var(--primary-green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              GET IN TOUCH
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--dark-green)', margin: '0 0 16px 0' }}>
              Contact V Organic
            </h2>
            <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '32px', fontSize: '1.05rem' }}>
              Have questions about our pasture practices or want to purchase milk, eggs, or meat directly from the farm? Give us a call or send an email. We look forward to hearing from you!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '20px' }}>📞</span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700 }}>PHONE NUMBER</span>
                  <strong style={{ color: '#0f172a' }}>+91 98765 43210</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700 }}>EMAIL ADDRESS</span>
                  <strong style={{ color: '#0f172a' }}>contact@vorganicfarm.com</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700 }}>FARM ADDRESS</span>
                  <strong style={{ color: '#0f172a' }}>123 Farm Road, Tamil Nadu, India</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '20px' }}>📸</span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 700 }}>INSTAGRAM</span>
                  <strong style={{ color: '#0f172a' }}>@vorganicfarm</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Contact Form Placeholder */}
          <div style={{
            flex: 1.2, minWidth: '320px',
            background: 'var(--gray-50, #f8fafc)',
            border: '1px solid var(--gray-200)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark-green)' }}>Send Us a Message</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully! We will get back to you shortly.'); e.target.reset(); }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Your Name</label>
                  <input type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Your Email</label>
                  <input type="email" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Message</label>
                <textarea required rows="4" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Send Message ✉️
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ── 📜 FOOTER ── */}
      <footer style={{
        background: 'var(--dark-green)',
        color: '#fff',
        padding: '48px 10% 24px 10%',
        borderTop: '5px solid var(--secondary-green)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
              🌾 V Organic
            </h3>
            <p style={{ marginTop: 8, opacity: 0.8, fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.5 }}>
              Tamil Nadu's premier organic livestock and pasture farming business. Working in harmony with nature.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>QUICK LINKS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
              <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleScroll('home')}>Home</span>
              <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleScroll('about')}>About Vijay</span>
              <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleScroll('products')}>Products</span>
              <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleScroll('contact')}>Contact</span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>GET IN TOUCH</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.5 }}>
              Phone: +91 98765 43210<br />
              Email: contact@vorganicfarm.com<br />
              Tamil Nadu, India
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 24, fontSize: '0.85rem', opacity: 0.7 }}>
          <span>© 2026 V Organic Farm. All Rights Reserved.</span>
          <span>Farming strictly by Vijay Kumar & Team.</span>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
