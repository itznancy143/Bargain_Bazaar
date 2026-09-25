import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './RatingStars.css';

/**
 * Display rating stars (single star badge mode or full 5-star row mode)
 */
export const RatingStars = ({
  rating = 0,
  count,
  showNumber = true,
  size = 14,
  mode = 'single' // 'single' (star + score) or 'full' (5 stars)
}) => {
  const numericRating = Number(rating) || 0;

  if (mode === 'full') {
    return (
      <div className="rating-stars-full-wrap">
        <div className="rating-stars-row">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const isFilled = starIndex <= Math.round(numericRating);
            return (
              <Star
                key={starIndex}
                size={size}
                className={`star-icon ${isFilled ? 'filled' : 'empty'}`}
              />
            );
          })}
        </div>
        {showNumber && <span className="rating-score">{numericRating.toFixed(1)}</span>}
        {count !== undefined && <span className="rating-count">({count})</span>}
      </div>
    );
  }

  // Default compact single star mode
  return (
    <div className="rating-stars-container">
      <div className="rating-stars-icon-wrap">
        <Star size={size} className="star-icon filled" />
      </div>
      {showNumber && <span className="rating-score">{numericRating.toFixed(1)}</span>}
      {count !== undefined && <span className="rating-count">({count})</span>}
    </div>
  );
};

/**
 * Interactive Star Rating Input Component for submitting reviews (1 to 5 stars)
 */
export const StarRatingInput = ({ value = 0, onChange, size = 28, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const activeRating = hoverValue || value;

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Select a rating';
    }
  };

  return (
    <div className="star-rating-input-container">
      <div className="star-rating-input-stars">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= activeRating;
          return (
            <button
              key={starIndex}
              type="button"
              disabled={disabled}
              className={`star-input-btn ${isFilled ? 'active' : ''}`}
              onClick={() => onChange && onChange(starIndex)}
              onMouseEnter={() => !disabled && setHoverValue(starIndex)}
              onMouseLeave={() => !disabled && setHoverValue(0)}
              aria-label={`Rate ${starIndex} out of 5 stars`}
            >
              <Star
                size={size}
                className={`star-icon ${isFilled ? 'filled' : 'empty'}`}
              />
            </button>
          );
        })}
      </div>
      <span className="star-rating-input-label">{getRatingLabel(activeRating)}</span>
    </div>
  );
};

export default RatingStars;
