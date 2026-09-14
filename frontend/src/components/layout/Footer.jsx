import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, ShieldCheck, Zap, RefreshCw, Mail, ArrowRight, Heart } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer-root">
      {/* Value Proposition Highlights */}
      <div className="footer-highlights">
        <div className="container highlights-grid">
          <div className="highlight-item">
            <div className="highlight-icon-box">
              <Handshake size={22} className="text-primary" />
            </div>
            <div>
              <h4 className="highlight-title">Fair Negotiation</h4>
              <p className="highlight-text">Counter-offer in real time with verified buyers and sellers</p>
            </div>
          </div>

          <div className="highlight-item">
            <div className="highlight-icon-box">
              <ShieldCheck size={22} className="text-success" />
            </div>
            <div>
              <h4 className="highlight-title">Buyer Protection</h4>
              <p className="highlight-text">Funds held securely in escrow until deal satisfaction</p>
            </div>
          </div>

          <div className="highlight-item">
            <div className="highlight-icon-box">
              <Zap size={22} className="text-warning" />
            </div>
            <div>
              <h4 className="highlight-title">Instant Chat & Deals</h4>
              <p className="highlight-text">Direct messaging with structured dynamic offer cards</p>
            </div>
          </div>

          <div className="highlight-item">
            <div className="highlight-icon-box">
              <RefreshCw size={22} className="text-primary" />
            </div>
            <div>
              <h4 className="highlight-title">Zero Hidden Fees</h4>
              <p className="highlight-text">Transparent commission and completely free listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container footer-main">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="brand-logo-link">
              <div className="brand-logo-icon-wrap">
                <Handshake size={20} className="brand-icon" />
              </div>
              <div className="brand-text-wrap">
                <span className="brand-title">Bargain<span className="brand-highlight">Bazaar</span></span>
                <span className="brand-tagline">Buy Smart. Sell Better. Bargain Freely.</span>
              </div>
            </Link>
            <p className="footer-about-text">
              India's Marketplace for Smart Bargaining. Buy and sell electronics, fashion, furniture, home decor, appliances, gaming products, and other high-value items while negotiating directly with sellers to get the best deal.
            </p>
            <div className="footer-newsletter">
              <span className="newsletter-label">Subscribe to Price Drop Alerts</span>
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" className="newsletter-input" />
                <button type="button" className="newsletter-submit-btn" aria-label="Subscribe">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Marketplace</h4>
            <ul className="footer-links">
              <li><Link to="/products">Explore All Items</Link></li>
              <li><Link to="/products?category=electronics">Electronics & Gadgets</Link></li>
              <li><Link to="/products?category=fashion">Sneakers & Watches</Link></li>
              <li><Link to="/products?category=furniture">Home & Office Furniture</Link></li>
              <li><Link to="/products?category=appliances">Appliances & TVs</Link></li>
              <li><Link to="/products?condition=brand-new">Brand New Open Box</Link></li>
            </ul>
          </div>

          {/* How It Works & Selling */}
          <div className="footer-col">
            <h4 className="footer-col-title">How Bargaining Works</h4>
            <ul className="footer-links">
              <li><Link to="/#how-it-works">Bargaining Timeline</Link></li>
              <li><Link to="/dashboard/products/new">List an Item for Sale</Link></li>
              <li><Link to="/dashboard">Seller Analytics Hub</Link></li>
              <li><Link to="/orders">Order Tracking & Escrow</Link></li>
              <li><span>Live Seller Chat (Coming Soon)</span></li>
              <li><span>Reputation & Badges (Coming Soon)</span></li>
            </ul>
          </div>

          {/* Trust & Support */}
          <div className="footer-col">
            <h4 className="footer-col-title">Trust & Security</h4>
            <ul className="footer-links">
              <li><Link to="/#trust">Community Guidelines</Link></li>
              <li><Link to="/#trust">Seller Verification Program</Link></li>
              <li><Link to="/#trust">Bargaining Etiquette</Link></li>
              <li><span>Admin Moderation (Coming Soon)</span></li>
              <li><Link to="/#">Privacy Policy</Link></li>
              <li><Link to="/#">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright-text">
            © {new Date().getFullYear()} Bargain Bazaar Technologies Inc. Built with modern React & clean architecture.
          </p>
          <div className="footer-bottom-links">
            <span className="badge badge-primary">Final-Year BCA Capstone Project</span>
            <span className="developed-tag">
              Designed with <Heart size={13} className="heart-mini text-error" /> for Seamless Deals
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
