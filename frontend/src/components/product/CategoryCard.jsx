import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import './CategoryCard.css';

export const CategoryCard = ({ category }) => {
  const { name, slug, description, count, icon, bgLight, accentColor, featuredImage } = category;

  // Dynamically resolve icon from lucide-react with fallback
  const IconComponent = Icons[icon] || Icons.Package;

  return (
    <Link to={`/products?category=${slug}`} className="category-card-item">
      <div className="category-card-inner">
        <div className="category-card-bg-wrap">
          <img src={featuredImage} alt={name} className="category-card-bg-image" loading="lazy" />
          <div className="category-card-overlay"></div>
        </div>

        <div className="category-card-content">
          <div className="category-icon-bubble" style={{ background: bgLight, color: accentColor }}>
            <IconComponent size={24} />
          </div>

          <div className="category-card-details">
            <div className="category-header-line">
              <h3 className="category-title">{name}</h3>
              <span className="category-count-badge">{count}+ items</span>
            </div>
            <p className="category-description">{description}</p>
          </div>

          <div className="category-card-footer">
            <span className="category-explore-link">
              Explore Deals
              <Icons.ArrowUpRight size={16} className="category-arrow-icon" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
