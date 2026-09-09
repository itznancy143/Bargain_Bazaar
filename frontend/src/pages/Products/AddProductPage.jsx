import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  PlusCircle,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Info,
  DollarSign
} from 'lucide-react';
import { productService } from '../../services/productService';
import { CATEGORIES } from '../../data/categories';
import { useApp } from '../../context/AppContext';
import './AddProduct.css';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Furniture / Chair', url: 'https://images.unsplash.com/photo-1580481077194-4d876fa5638c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80' }
];

export const AddProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists, it's Edit Mode
  const isEditMode = !!id;
  const { currentUser, isAuthenticated } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'Like New',
    askingPrice: '',
    minimumPrice: '',
    originalPrice: '',
    location: 'Delhi NCR',
    brand: '',
    image: SAMPLE_IMAGE_PRESETS[0].url,
    status: 'active',
    isNegotiable: true
  });

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch product data if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const fetchExistingProduct = async () => {
        setFetchingProduct(true);
        try {
          const product = await productService.getProductById(id);
          setFormData({
            title: product.title || '',
            description: product.description || '',
            category: product.category || 'Electronics',
            condition: product.condition || 'Good',
            askingPrice: product.askingPrice || '',
            minimumPrice: product.minimumPrice || product.askingPrice || '',
            originalPrice: product.originalPrice || '',
            location: product.location || 'India',
            brand: product.brand || '',
            image: product.image || (product.images && product.images[0]) || SAMPLE_IMAGE_PRESETS[0].url,
            status: product.status || 'active',
            isNegotiable: product.isNegotiable !== undefined ? product.isNegotiable : true
          });
        } catch (err) {
          setErrorMessage(err.message || 'Failed to load product for editing');
        } finally {
          setFetchingProduct(false);
        }
      };
      fetchExistingProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSelectPreset = (url) => {
    setFormData((prev) => ({ ...prev, image: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isAuthenticated) {
      setErrorMessage('Please sign in to list a product for sale.');
      navigate('/login', { state: { from: '/dashboard/products/new' } });
      return;
    }

    const {
      title,
      description,
      category,
      condition,
      askingPrice,
      minimumPrice,
      originalPrice,
      location,
      brand,
      image,
      status,
      isNegotiable
    } = formData;

    // Client-side Validations
    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Title is required and must be at least 3 characters.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Description must be at least 10 characters long.');
      return;
    }

    if (!category) {
      setErrorMessage('Please select a valid category.');
      return;
    }

    const asking = Number(askingPrice);
    const minPrice = Number(minimumPrice);

    if (isNaN(asking) || asking <= 0) {
      setErrorMessage('Asking price must be a valid number greater than 0.');
      return;
    }

    if (isNaN(minPrice) || minPrice <= 0) {
      setErrorMessage('Minimum price must be a valid number greater than 0.');
      return;
    }

    if (minPrice > asking) {
      setErrorMessage('Minimum Acceptable Price cannot be greater than the Asking Price.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        condition,
        askingPrice: asking,
        minimumPrice: minPrice,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        location: location.trim() || 'India',
        brand: brand ? brand.trim() : undefined,
        image: image || SAMPLE_IMAGE_PRESETS[0].url,
        images: [image || SAMPLE_IMAGE_PRESETS[0].url],
        status,
        isNegotiable
      };

      if (isEditMode) {
        await productService.updateProduct(id, payload);
        setSuccessMessage('Product updated successfully!');
      } else {
        await productService.createProduct(payload);
        setSuccessMessage('Product listing created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard/products');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save product listing. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="container add-product-root">
        <div className="surface-card add-product-card" style={{ textAlign: 'center', padding: '50px' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h3>Loading product information...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container add-product-root">
      <div className="surface-card add-product-card animate-fade-in">
        <div className="add-product-header">
          <Link to="/dashboard/products" className="btn btn-secondary btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={15} />
            <span>Back to My Listings</span>
          </Link>
          <h1 className="add-product-title">{isEditMode ? 'Edit Product Listing' : 'List a Product for Sale'}</h1>
          <p className="add-product-subtitle">
            Set your public asking price and private minimum bargaining threshold.
          </p>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert auth-alert-success" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-product-form" noValidate>
          {/* Title */}
          <div className="form-field-group">
            <label className="form-field-label" htmlFor="product-title">
              Product Title *
            </label>
            <input
              id="product-title"
              type="text"
              name="title"
              placeholder="e.g. Apple iPhone 15 Pro 128GB Natural Titanium"
              value={formData.title}
              onChange={handleChange}
              className="form-field-input"
              required
            />
          </div>

          {/* Category and Condition */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-field-label" htmlFor="product-category">
                Category *
              </label>
              <select
                id="product-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-field-select"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-field-label" htmlFor="product-condition">
                Condition *
              </label>
              <select
                id="product-condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="form-field-select"
              >
                <option value="Brand New">Brand New (Unopened)</option>
                <option value="Like New">Like New (Mint / No scratches)</option>
                <option value="Excellent">Excellent (Minimal wear)</option>
                <option value="Good">Good (Working fine)</option>
                <option value="Fair">Fair (Noticeable wear)</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-field-label" htmlFor="asking-price">
                Public Asking Price (₹) *
              </label>
              <input
                id="asking-price"
                type="number"
                name="askingPrice"
                placeholder="e.g. 75000"
                value={formData.askingPrice}
                onChange={handleChange}
                className="form-field-input"
                min="1"
                required
              />
              <span className="text-xs text-muted">The initial price shown to all buyers.</span>
            </div>

            <div className="form-field-group">
              <label className="form-field-label" htmlFor="original-price">
                Original MRP / Purchase Price (₹)
              </label>
              <input
                id="original-price"
                type="number"
                name="originalPrice"
                placeholder="e.g. 134900"
                value={formData.originalPrice}
                onChange={handleChange}
                className="form-field-input"
                min="0"
              />
              <span className="text-xs text-muted">Optional: Used to show % discount badge.</span>
            </div>
          </div>

          {/* PRIVACY SECURITY SECTION: Minimum Price */}
          <div className="secret-price-highlight-box">
            <div className="secret-price-header">
              <Lock size={16} />
              <span>Private Minimum Acceptable Price (₹) *</span>
            </div>
            <p className="secret-price-desc">
              <strong>100% Confidential:</strong> This price will <strong>NEVER</strong> be visible to buyers or in public API responses. It defines your secret floor price for automated smart bargaining engine decisions.
            </p>
            <input
              id="minimum-price"
              type="number"
              name="minimumPrice"
              placeholder="e.g. 70000"
              value={formData.minimumPrice}
              onChange={handleChange}
              className="form-field-input"
              min="1"
              style={{ backgroundColor: '#fff', borderColor: '#F59E0B' }}
              required
            />
          </div>

          {/* Brand & Location */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-field-label" htmlFor="product-brand">
                Brand / Model (Optional)
              </label>
              <input
                id="product-brand"
                type="text"
                name="brand"
                placeholder="e.g. Apple, Sony, Nike"
                value={formData.brand}
                onChange={handleChange}
                className="form-field-input"
              />
            </div>

            <div className="form-field-group">
              <label className="form-field-label" htmlFor="product-location">
                City / Location *
              </label>
              <input
                id="product-location"
                type="text"
                name="location"
                placeholder="e.g. Mumbai, Bengaluru, Kanpur"
                value={formData.location}
                onChange={handleChange}
                className="form-field-input"
                required
              />
            </div>
          </div>

          {/* Image URL & Preset Selection */}
          <div className="form-field-group">
            <label className="form-field-label" htmlFor="product-image">
              Product Image URL
            </label>
            <input
              id="product-image"
              type="url"
              name="image"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={handleChange}
              className="form-field-input"
            />

            <div className="image-presets-wrap">
              <span className="text-xs text-muted">Quick sample presets:</span>
              {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`preset-chip-btn ${formData.image === preset.url ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset.url)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {formData.image && (
              <div className="image-preview-box">
                <img src={formData.image} alt="Preview" className="image-preview-img" />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-field-group">
            <label className="form-field-label" htmlFor="product-desc">
              Description & Condition Notes *
            </label>
            <textarea
              id="product-desc"
              name="description"
              placeholder="Mention age of item, bill/box availability, reason for selling, and specs..."
              value={formData.description}
              onChange={handleChange}
              className="form-field-textarea"
              required
            ></textarea>
          </div>

          {/* Status (when in edit mode) */}
          {isEditMode && (
            <div className="form-field-group">
              <label className="form-field-label" htmlFor="product-status">
                Listing Status
              </label>
              <select
                id="product-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-field-select"
              >
                <option value="active">Active (Available for Offers)</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved / Deal in Progress</option>
                <option value="inactive">Inactive / Hidden</option>
              </select>
            </div>
          )}

          {/* Submit Footer */}
          <div className="form-actions-footer">
            <Link to="/dashboard/products" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving Listing...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>{isEditMode ? 'Save Changes' : 'Publish Product Listing'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
