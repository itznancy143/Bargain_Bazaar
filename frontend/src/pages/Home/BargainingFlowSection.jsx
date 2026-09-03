import React from 'react';
import { Tag, Send, RefreshCw, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import './BargainingFlowSection.css';

export const BargainingFlowSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Asking Price Set',
      description: 'Seller lists a verified product with condition specs and transparent initial asking price.',
      icon: Tag,
      color: '#2563EB',
      bgLight: '#EFF6FF'
    },
    {
      step: '02',
      title: 'Buyer Makes Offer',
      description: 'Buyer proposes a reasonable counter-price along with an optional custom message.',
      icon: Send,
      color: '#8B5CF6',
      bgLight: '#F5F3FF'
    },
    {
      step: '03',
      title: 'Counter & Negotiate',
      description: 'Instant live counter-offers allow both parties to converge quickly on a fair market deal.',
      icon: RefreshCw,
      color: '#F59E0B',
      bgLight: '#FFFBEB'
    },
    {
      step: '04',
      title: 'Agreement & Escrow',
      description: 'Once accepted, price locks immediately and buyer pays securely with escrow protection.',
      icon: CheckCircle2,
      color: '#16A34A',
      bgLight: '#ECFDF5'
    }
  ];

  return (
    <section className="flow-section-root" id="how-it-works">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-kicker">Transparent & Dynamic</span>
          <h2 className="section-heading">How Bargaining Works on Bargain Bazaar</h2>
          <p className="section-subheading">
            No endless back-and-forth haggling. Our structured bargaining room helps buyers and sellers reach a win-win price in minutes.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="flow-steps-grid">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flow-step-card surface-card">
                <div className="step-header">
                  <span className="step-number" style={{ color: item.color }}>
                    {item.step}
                  </span>
                  <div
                    className="step-icon-bubble"
                    style={{ background: item.bgLight, color: item.color }}
                  >
                    <Icon size={22} />
                  </div>
                </div>

                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>

                {index < steps.length - 1 && (
                  <div className="step-connector-arrow">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="flow-guarantee-box">
          <div className="guarantee-icon">
            <Shield size={24} className="text-primary" />
          </div>
          <div className="guarantee-text">
            <strong>The Bargain Bazaar Fair Price Promise:</strong> Minimum reserve prices remain 100% private to sellers, preventing lowball spam and ensuring respectful, high-quality negotiations.
          </div>
        </div>
      </div>
    </section>
  );
};
