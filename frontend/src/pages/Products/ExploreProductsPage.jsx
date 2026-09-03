import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, MapPin, Sparkles } from 'lucide-react';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/product/ProductCard';
import { CATEGORIES } from '../../data/categories';
import './ExploreProducts.css';

export const ExploreProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await productService.getProducts({
        category: selectedCategory,
        search: searchTerm,
        condition: selectedCondition,
        sortBy
      });
      setProducts(res);
      setLoading(false);
    };
    fetch();
  }, [selectedCategory, searchTerm, selectedCondition, sortBy]);

  return (
    <div className="explore-page-root container">
      {/* Header */}
      <div className="explore-header">
        <div>
          <h1 className="explore-title">Explore Marketplace</h1>
          <p className="explore-subtitle">
            Showing {products.length} negotiable items across verified sellers
          </p>
        </div>

        {/* Quick Search */}
        <div className="explore-search-wrap">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Filter by title, brand, or specs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="explore-search-input"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="explore-filter-bar surface-card">
        <div className="filter-group">
          <label className="filter-label">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Condition:</label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="filter-select"
          >
            <option value="all">Any Condition</option>
            <option value="Brand New">Brand New</option>
            <option value="Like New">Like New</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recommended">Recommended / Deals</option>
            <option value="newest">Newest Listed</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="explore-loading">Loading marketplace catalog...</div>
      ) : products.length > 0 ? (
        <div className="explore-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="explore-empty surface-card">
          <h3>No products matching your filters</h3>
          <p>Try clearing your search query or selecting a different category.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelectedCategory('all');
              setSearchTerm('');
              setSelectedCondition('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
