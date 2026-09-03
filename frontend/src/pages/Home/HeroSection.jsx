import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingDown,
  Handshake,
  CheckCircle2,
  Lock,
  Search,
  Tag
} from 'lucide-react';
import './HeroSection.css';

export const HeroSection = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <section className="hero-root">
      <div className="hero-background-effects">
        <div className="hero-glow glow-1"></div>
        <div className="hero-glow glow-2"></div>
        <div className="hero-grid-pattern"></div>
      </div>

      <div className="container hero-container">
        {/* Left Column: Hero Content & CTAs */}
        <div className="hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={15} className="text-primary" />
            <span>Bargain with confidence • Find the right price • Make the deal</span>
          </div>

          <h1 className="hero-headline">
            India's Marketplace for <br />
            <span className="gradient-text">Smart Bargaining</span>
          </h1>

          <p className="hero-subtext">
            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Buy Smart. Sell Better. Bargain Freely.
            </strong>
            Buy and sell electronics, fashion, furniture, home decor, appliances, gaming products, and other high-value items while negotiating directly with sellers to get the best deal.
          </p>

          {/* Quick Search in Hero */}
          <form onSubmit={handleHeroSearch} className="hero-search-box surface-card">
            <div className="hero-search-input-wrap">
              <Search size={20} className="hero-search-icon" />
              <input
                type="text"
                placeholder="Search products: iPhone 15 Pro, Nike Jordans, Sony Bravia..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="hero-search-input"
              />
            </div>
            <button type="submit" className="btn btn-primary hero-search-btn">
              <span>Find Deals</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Popular Tag Pills */}
          <div className="hero-popular-tags">
            <span className="popular-label">Popular Deals:</span>
            <Link to="/products?category=electronics" className="popular-pill">
              Smartphones
            </Link>
            <Link to="/products?category=electronics" className="popular-pill">
              Laptops
            </Link>
            <Link to="/products?category=fashion" className="popular-pill">
              Sneakers
            </Link>
            <Link to="/products?category=furniture" className="popular-pill">
              Ergonomic Chairs
            </Link>
          </div>

          {/* CTAs */}
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg hero-cta-btn">
              <span>Explore Products</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard/products/new" className="btn btn-secondary btn-lg hero-cta-btn">
              <span>Start Selling</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="hero-trust-row">
            <div className="hero-trust-item">
              <ShieldCheck size={18} className="text-success" />
              <span>Verified Sellers</span>
            </div>
            <div className="hero-trust-item">
              <Handshake size={18} className="text-primary" />
              <span>Direct Negotiation</span>
            </div>
            <div className="hero-trust-item">
              <Lock size={18} className="text-primary" />
              <span>Escrow Protected</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Bargaining Simulation Composition */}
        <div className="hero-visual-col">
          <div className="live-bargain-showcase surface-card">
            {/* Header / Product Info */}
            <div className="bargain-showcase-header">
              <div className="showcase-product-thumb">
                <img
                  src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=300&q=80"
                  alt="iPhone 15 Pro"
                />
              </div>
              <div className="showcase-product-info">
                <div className="showcase-live-badge">
                  <span className="live-pulse-dot"></span>
                  <span>LIVE BARGAINING ROOM</span>
                </div>
                <h4 className="showcase-title">Apple iPhone 15 Pro (128GB)</h4>
                <div className="showcase-price-line">
                  <span className="text-xs text-muted">Asking Price:</span>
                  <span className="showcase-asking-price">₹75,000</span>
                </div>
              </div>
            </div>

            {/* Negotiation Timeline Bubbles */}
            <div className="bargain-timeline-feed">
              {/* Offer 1 */}
              <div className="timeline-item buyer animate-fade-in">
                <div className="timeline-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Buyer"
                  />
                </div>
                <div className="timeline-bubble">
                  <div className="bubble-header">
                    <span className="bubble-user">Buyer (Ananya)</span>
                    <span className="bubble-time">10:14 AM</span>
                  </div>
                  <div className="bubble-offer-card buyer-offer">
                    <div className="offer-type">Initial Offer</div>
                    <div className="offer-amount">₹65,000</div>
                  </div>
                  <p className="bubble-text">"Can complete payment instantly if in mint condition!"</p>
                </div>
              </div>

              {/* Offer 2 (Counter) */}
              <div className="timeline-item seller animate-fade-in">
                <div className="timeline-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                    alt="Seller"
                  />
                </div>
                <div className="timeline-bubble">
                  <div className="bubble-header">
                    <span className="bubble-user">Seller (Aarav - Verified)</span>
                    <span className="bubble-time">10:18 AM</span>
                  </div>
                  <div className="bubble-offer-card seller-counter">
                    <div className="offer-type">Seller Counter-Offer</div>
                    <div className="offer-amount">₹72,000</div>
                  </div>
                  <p className="bubble-text">"Includes original box and Spigen case. How about ₹72,000?"</p>
                </div>
              </div>

              {/* Offer 3 (Final Counter) */}
              <div className="timeline-item buyer animate-fade-in">
                <div className="timeline-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Buyer"
                  />
                </div>
                <div className="timeline-bubble">
                  <div className="bubble-header">
                    <span className="bubble-user">Buyer (Ananya)</span>
                    <span className="bubble-time">10:22 AM</span>
                  </div>
                  <div className="bubble-offer-card buyer-offer">
                    <div className="offer-type">Final Counter</div>
                    <div className="offer-amount">₹70,000</div>
                  </div>
                </div>
              </div>

              {/* Agreement Banner */}
              <div className="timeline-agreement-banner animate-fade-in">
                <div className="agreement-icon-wrap">
                  <CheckCircle2 size={24} className="text-success" />
                </div>
                <div className="agreement-info">
                  <div className="agreement-title">Agreement Reached at ₹70,000!</div>
                  <div className="agreement-subtitle">Seller accepted. Product reserved for checkout.</div>
                </div>
                <span className="agreement-savings-tag">
                  <TrendingDown size={14} />
                  Saved ₹5,000
                </span>
              </div>
            </div>

            {/* Simulated Action Bar */}
            <div className="bargain-showcase-footer">
              <Link to="/negotiation/prod-101" className="btn btn-primary btn-block showcase-cta-btn">
                <Handshake size={18} />
                <span>Try Negotiation Demo</span>
              </Link>
            </div>
          </div>

          {/* Floating Floating Stat Badges */}
          <div className="floating-stat-badge stat-badge-left animate-pulse-glow">
            <Zap size={18} className="text-warning" />
            <div>
              <div className="stat-value">Instant Responses</div>
              <div className="stat-sub">Avg &lt; 15 min negotiation</div>
            </div>
          </div>

          <div className="floating-stat-badge stat-badge-right">
            <ShieldCheck size={18} className="text-success" />
            <div>
              <div className="stat-value">100% Escrow</div>
              <div className="stat-sub">Zero fraud guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
