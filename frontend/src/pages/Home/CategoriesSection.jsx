import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Grid } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CategoryCard } from '../../components/product/CategoryCard';
import './CategoriesSection.css';

export const CategoriesSection = () => {
  return (
    <section className="categories-section-root">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-flex">
          <div>
            <span className="section-kicker">Curated Marketplace</span>
            <h2 className="section-heading">Browse by Category</h2>
            <p className="section-subheading">
              Explore thousands of negotiable listings across our most popular categories.
            </p>
          </div>
          <Link to="/products" className="btn btn-outline-primary desktop-only">
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="categories-mobile-cta mobile-only">
          <Link to="/products" className="btn btn-outline-primary btn-block">
            <span>Explore All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
