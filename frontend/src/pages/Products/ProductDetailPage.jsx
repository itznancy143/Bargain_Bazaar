import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Eye,
  Heart,
  Handshake,
  CheckCircle,
  ShieldCheck,
  Lock,
  Edit3,
  Trash2,
  Share2,
  AlertCircle,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { productService } from '../../services/productService';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { RatingStars } from '../../components/common/RatingStars';
import './ProductDetail.css';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isWishlisted, toggleWishlist } = useApp();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
        setSelectedImage(data.image || (data.images && data.images[0]) || '');
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const wishlisted = product ? isWishlisted(product._id || product.id) : false;

  const handleWishlistClick = () => {
    if (product) {
      toggleWishlist(product._id || product.id);
    }
  };

  const handleNegotiateClick = () => {
    if (product) {
      navigate(`/negotiation/${product._id || product.id}`);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(product._id || product.id);
      navigate('/dashboard/products', {
        state: { message: 'Product listing deleted successfully.' }
      });
    } catch (err) {
      alert(err.message || 'Failed to delete product listing');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="container product-detail-root">
        <div className="surface-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Loading product details...</h3>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container product-detail-root">
        <div className="surface-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={40} className="text-danger" style={{ margin: '0 auto 16px' }} />
          <h2>Product Not Found</h2>
          <p className="text-muted" style={{ margin: '8px 0 24px' }}>
            {error || 'The product listing you requested could not be found.'}
          </p>
          {error && (
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()} style={{ marginBottom: '12px' }}>
              Retry
            </button>
          )}
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const productId = product._id || product.id;
  const isOwner =
    product.isOwner ||
    (currentUser &&
      product.seller &&
      (currentUser.id === product.seller._id || currentUser.id === product.seller.id || currentUser.id === product.seller));

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const discountPercent =
    product.originalPrice && product.originalPrice > product.askingPrice
      ? Math.round(((product.originalPrice - product.askingPrice) / product.originalPrice) * 100)
      : null;

  const sellerName = product.seller?.name || 'Verified Seller';
  const sellerAvatar =
    product.seller?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=2563EB&color=fff&bold=true`;

  return (
    <div className="container product-detail-root">
      {/* Breadcrumb Navigation */}
      <div className="product-detail-breadcrumb">
        <Link to="/" className="breadcrumb-link">
          Home
        </Link>
        <ChevronRight size={14} />
        <Link to="/products" className="breadcrumb-link">
          Products
        </Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${product.categorySlug || product.category?.toLowerCase()}`} className="breadcrumb-link">
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{product.title}</span>
      </div>

      <div className="product-detail-layout">
        {/* Left Column: Image Gallery */}
        <div className="detail-gallery-wrap">
          <div className="main-image-container">
            <img src={selectedImage || product.image} alt={product.title} className="main-image" />
          </div>

          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb-btn ${selectedImage === img ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="gallery-thumb-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="detail-info-wrap">
          {/* Top Tags */}
          <div className="detail-tags-row">
            <Badge variant="category" size="md">
              {product.category}
            </Badge>
            <Badge variant="condition" size="md">
              {product.condition || 'Good'}
            </Badge>
            {product.isNegotiable && (
              <Badge variant="negotiable" size="md" pulse>
                Negotiable
              </Badge>
            )}
            <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
              {product.status ? product.status.toUpperCase() : 'ACTIVE'}
            </span>
          </div>

          {/* Title */}
          <h1 className="detail-title">{product.title}</h1>

          {/* Location and Views */}
          <div className="detail-location-views">
            <div className="detail-location-item">
              <MapPin size={15} className="text-primary" />
              <span>{product.location || 'India'}</span>
            </div>
            {product.viewsCount !== undefined && (
              <div className="detail-location-item">
                <Eye size={15} />
                <span>{product.viewsCount} views</span>
              </div>
            )}
          </div>

          {/* Price Box */}
          <div className="detail-price-box">
            <div className="detail-price-row">
              <span className="detail-current-price">₹{Number(product.askingPrice).toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="detail-original-price">
                  ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && (
                <span className="detail-discount-badge">{discountPercent}% OFF Original</span>
              )}
            </div>
            {product.isNegotiable && (
              <div className="detail-bargain-note">
                <Handshake size={14} />
                <span>Open for Bargaining: Make an offer below asking price</span>
              </div>
            )}
          </div>

          {/* PRIVACY HIGHLIGHT: Seller-Only Private Minimum Price Box */}
          {isOwner && (
            <div className="detail-owner-banner animate-fade-in">
              <div className="owner-banner-header">
                <div className="owner-banner-title">
                  <Lock size={16} />
                  <span>Seller Private Information</span>
                </div>
                <span className="badge badge-warning">Owner View</span>
              </div>
              <div className="owner-banner-note">
                Your private minimum acceptable price for bargaining algorithms is:
              </div>
              <div className="owner-secret-price">
                ₹{Number(product.minimumPrice || product.askingPrice).toLocaleString('en-IN')}
              </div>
              <div className="owner-banner-note">
                🔒 Protected: Buyers cannot see this value anywhere on the site or API.
              </div>

              <div className="owner-action-buttons">
                <Link to={`/dashboard/products/edit/${productId}`} className="btn btn-secondary btn-sm">
                  <Edit3 size={15} />
                  <span>Edit Listing</span>
                </Link>

                {!deleteConfirm ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <Trash2 size={15} />
                    <span>Delete Listing</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteProduct}
                    disabled={deleting}
                  >
                    <span>{deleting ? 'Deleting...' : 'Confirm Delete?'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Buyer Action Buttons */}
          {!isOwner && (
            <div className="detail-actions-row">
              <button
                type="button"
                className="btn btn-primary btn-lg btn-bargain-main"
                onClick={handleNegotiateClick}
              >
                <Handshake size={20} />
                <span>Make Offer / Bargain</span>
              </button>

              <button
                type="button"
                className={`btn btn-secondary btn-lg btn-wishlist-detail ${wishlisted ? 'active' : ''}`}
                onClick={handleWishlistClick}
              >
                <Heart size={20} className={wishlisted ? 'heart-filled' : ''} />
                <span>{wishlisted ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
            </div>
          )}

          {/* Description Section */}
          <div className="detail-description-card">
            <h3 className="detail-section-title">Product Description</h3>
            <p className="detail-description-text">{product.description}</p>
          </div>

          {/* Safe Seller Card */}
          <div className="detail-seller-card">
            <div className="seller-profile-flex">
              <img src={sellerAvatar} alt={sellerName} className="detail-seller-avatar" />
              <div>
                <div className="detail-seller-name">
                  <span>{sellerName}</span>
                  <CheckCircle size={15} className="text-success" title="Verified Seller" />
                </div>
                <div className="detail-seller-meta">
                  <span>Verified Seller</span>
                  {product.seller?.email && <span> • Contact available upon deal</span>}
                </div>
              </div>
            </div>

            <div className="desktop-only">
              <span className="badge badge-primary">Bargain Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
