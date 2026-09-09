import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, CheckCircle, MessageSquare, Handshake } from 'lucide-react';
import { PriceDisplay } from '../common/PriceDisplay';
import { Badge } from '../common/Badge';
import { RatingStars } from '../common/RatingStars';
import { useApp } from '../../context/AppContext';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useApp();

  if (!product) return null;

  const id = product._id || product.id;
  const {
    title,
    category,
    askingPrice,
    originalPrice,
    isNegotiable = true,
    condition = 'Good',
    location = 'India',
    seller,
    activeOffersCount = 0
  } = product;

  const image = product.image || (product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');
  const sellerAvatar = seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'Seller')}&background=2563EB&color=fff&bold=true`;

  const wishlisted = isWishlisted(id);

  const handleCardClick = () => {
    navigate(`/products/${id}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleWishlist(id);
  };

  const handleNegotiateClick = (e) => {
    e.stopPropagation();
    navigate(`/negotiation/${id}`);
  };

  return (
    <div className="product-card-container surface-card surface-card-hover" onClick={handleCardClick}>
      {/* Top Image & Floating Badges */}
      <div className="product-card-image-wrap">
        <img src={image} alt={title} className="product-card-image" loading="lazy" />

        {/* Floating Badges */}
        <div className="product-image-top-badges">
          <Badge variant="condition" size="sm">
            {condition}
          </Badge>
          {isNegotiable && (
            <Badge variant="negotiable" size="sm" pulse>
              Negotiable
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          className={`product-wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} className={wishlisted ? 'heart-filled' : ''} />
        </button>

        {/* Active Offers Overlay Pill */}
        {activeOffersCount > 0 && (
          <div className="active-offers-pill">
            <Handshake size={13} />
            <span>{activeOffersCount} offers active</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="product-card-body">
        {/* Category & Location */}
        <div className="product-meta-row">
          <span className="product-category-tag">{category}</span>
          <div className="product-location-tag">
            <MapPin size={13} className="pin-icon" />
            <span>{location.split(',')[0]}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="product-card-title" title={title}>
          {title}
        </h3>

        {/* Price Section */}
        <div className="product-price-section">
          <PriceDisplay
            price={askingPrice}
            originalPrice={originalPrice}
            isNegotiable={false}
            size="md"
          />
        </div>

        {/* Seller Info & Micro Rating */}
        <div className="product-seller-row">
          <div className="seller-left">
            <img src={sellerAvatar} alt={seller?.name || 'Seller'} className="seller-avatar-mini" />
            <div className="seller-name-box">
              <span className="seller-name">{seller?.name || 'Verified Seller'}</span>
              {seller?.verified && (
                <CheckCircle size={13} className="seller-verified-icon" title="Verified Seller" />
              )}
            </div>
          </div>
          {seller?.rating && (
            <RatingStars rating={seller.rating} count={seller.dealsCompleted} size={12} />
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="product-card-actions">
        <button
          type="button"
          className="btn-action-negotiate"
          onClick={handleNegotiateClick}
          title="Start Price Negotiation"
        >
          <Handshake size={16} />
          <span>Bargain / Offer</span>
        </button>

        <button
          type="button"
          className="btn-action-details"
          onClick={handleCardClick}
          title="View full product details"
        >
          <span>Details</span>
        </button>
      </div>
    </div>
  );
};
