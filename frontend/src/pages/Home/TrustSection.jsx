import React from 'react';
import { ShieldCheck, UserCheck, MessageSquareCheck, RefreshCw, Award, Lock } from 'lucide-react';
import './TrustSection.css';

export const TrustSection = () => {
  const trustFeatures = [
    {
      icon: UserCheck,
      title: 'Verified Profiles Only',
      desc: 'Sellers and buyers undergo phone, email, and identity validation to keep the marketplace safe.'
    },
    {
      icon: Lock,
      title: 'Escrow Payment Security',
      desc: 'When an offer is accepted, your payment stays guarded until you inspect and receive the item.'
    },
    {
      icon: RefreshCw,
      title: 'Algorithmic Fair Price Guide',
      desc: 'Get smart suggestions on market rates so your offers get accepted without unnecessary delays.'
    },
    {
      icon: MessageSquareCheck,
      title: 'Integrated Deal Chat',
      desc: 'Discuss product condition, ask for extra video clips, and negotiate directly in a dedicated chat.'
    }
  ];

  return (
    <section className="trust-section-root" id="trust">
      <div className="container">
        <div className="trust-container-card surface-card">
          <div className="trust-header-center">
            <span className="section-kicker">Security First</span>
            <h2 className="section-heading">Why Thousands Trust Bargain Bazaar</h2>
            <p className="section-subheading">
              A peer-to-peer marketplace engineered with built-in fraud prevention, trust scoring, and transparent negotiation logs.
            </p>
          </div>

          <div className="trust-features-grid">
            {trustFeatures.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="trust-feature-item">
                  <div className="trust-icon-wrap">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="trust-item-title">{item.title}</h3>
                    <p className="trust-item-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
