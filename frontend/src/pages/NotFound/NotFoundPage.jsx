import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }} className="surface-card">
        <div style={{ padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '4rem', color: 'var(--primary)', fontWeight: 800 }}>404</h1>
          <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            The product or bargaining room you are looking for might have been moved or is currently unavailable.
          </p>
          <Link to="/" className="btn btn-primary">
            <Home size={18} />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
