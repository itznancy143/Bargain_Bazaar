import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowRight, ShieldCheck, DollarSign, Users } from 'lucide-react';
import './SellerCTASection.css';

export const SellerCTASection = () => {
  return (
    <section className="seller-cta-root">
      <div className="container">
        <div className="seller-cta-card">
          <div className="seller-cta-content">
            <span className="seller-cta-badge">Zero Listing Fees</span>
            <h2 className="seller-cta-title">
              Turn Unused Gadgets & Goods into Cash Today
            </h2>
            <p className="seller-cta-text">
              Set your asking price, receive verified buyer offers, and close deals effortlessly on your own terms.
            </p>

            <div className="seller-cta-perks">
              <div className="perk-item">
                <ShieldCheck size={18} className="text-white" />
                <span>100% Secure Payouts</span>
              </div>
              <div className="perk-item">
                <DollarSign size={18} className="text-white" />
                <span>Fair Price Controls</span>
              </div>
              <div className="perk-item">
                <Users size={18} className="text-white" />
                <span>50,000+ Active Buyers</span>
              </div>
            </div>

            <div className="seller-cta-action-row">
              <Link to="/dashboard/products/new" className="btn btn-white btn-lg">
                <PlusCircle size={20} className="text-primary" />
                <span>Create a Listing Now</span>
              </Link>
              <Link to="/dashboard" className="btn btn-transparent btn-lg">
                <span>View Seller Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
