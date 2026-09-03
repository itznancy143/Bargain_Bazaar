import React from 'react';
import './Badge.css';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  pulse = false,
  className = ''
}) => {
  return (
    <span className={`custom-badge badge-${variant} badge-sz-${size} ${pulse ? 'badge-pulse' : ''} ${className}`}>
      {pulse && <span className="pulse-indicator"></span>}
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className="badge-icon" />}
      <span>{children}</span>
    </span>
  );
};
