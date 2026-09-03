import React from 'react';
import { Star } from 'lucide-react';
import './RatingStars.css';

export const RatingStars = ({ rating = 5, count, showNumber = true, size = 14 }) => {
  return (
    <div className="rating-stars-container">
      <div className="rating-stars-icon-wrap">
        <Star size={size} className="star-icon filled" />
      </div>
      {showNumber && <span className="rating-score">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="rating-count">({count})</span>}
    </div>
  );
};
