import React from 'react';
import './PriceDisplay.css';

export const PriceDisplay = ({
  price,
  originalPrice,
  isNegotiable = true,
  size = 'md',
  showDiscount = true
}) => {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  const formattedOriginal = originalPrice
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(originalPrice)
    : null;

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <div className={`price-display-wrapper size-${size}`}>
      <div className="price-main-row">
        <span className="price-current">{formattedPrice}</span>
        {formattedOriginal && (
          <span className="price-original">{formattedOriginal}</span>
        )}
        {showDiscount && discountPercent && (
          <span className="price-discount-tag">{discountPercent}% OFF</span>
        )}
      </div>
      {isNegotiable && (
        <div className="negotiable-pill">
          <span className="negotiable-dot"></span>
          <span>Price Negotiable</span>
        </div>
      )}
    </div>
  );
};
