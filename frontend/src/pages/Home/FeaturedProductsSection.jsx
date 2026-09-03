import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { productService } from '../../services/productService';
import { ProductCard } from '../../components/product/ProductCard';
import './FeaturedProductsSection.css';

export const FeaturedProductsSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All Featured' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'fashion', label: 'Fashion & Sneakers' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'appliances', label: 'Home Appliances' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await productService.getProducts({
          category: activeTab === 'all' ? undefined : activeTab
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeTab]);

  return (
    <section className="featured-section-root">
      <div className="container">
        {/* Section Header */}
        <div className="featured-header-wrap">
          <div>
            <div className="section-kicker-flex">
              <Sparkles size={16} className="text-warning" />
              <span className="section-kicker">Hot Negotiable Deals</span>
            </div>
            <h2 className="section-heading">Featured Listings</h2>
            <p className="section-subheading">
              Hand-picked verified products currently open for buyer offers and immediate negotiation.
            </p>
          </div>

          <Link to="/products" className="btn btn-secondary desktop-only">
            <span>Explore All {products.length}+ Items</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="featured-tabs-row">
          <div className="tabs-pill-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="featured-loading-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="product-skeleton-card">
                <div className="skeleton-image"></div>
                <div className="skeleton-text-line width-30"></div>
                <div className="skeleton-text-line width-80"></div>
                <div className="skeleton-text-line width-50"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="featured-product-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="featured-empty-box surface-card">
            <p>No listings found in this category right now.</p>
            <Link to="/products" className="btn btn-primary btn-sm">
              Browse All Products
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="featured-bottom-cta">
          <Link to="/products" className="btn btn-primary btn-lg">
            <span>View All Available Marketplace Deals</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
