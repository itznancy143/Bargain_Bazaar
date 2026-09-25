import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Package,
  Star,
  MessageSquare,
  Camera,
  X,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import { resolveImageUrl } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { RatingStars, StarRatingInput } from '../../components/common/RatingStars';
import './OrderDetails.css';

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const STATUS_STEPS = ['pending_payment', 'processing', 'shipped', 'delivered'];
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

const getProductImage = (product) => product?.image || product?.images?.[0] || FALLBACK_PRODUCT_IMAGE;

const AddressBlock = ({ address }) => {
  if (!address || !address.addressLine1) return <p className="order-details-muted">Delivery address is unavailable.</p>;

  return (
    <address className="order-details-address">
      {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
      {address.city}, {address.state} {address.postalCode}<br />
      {address.country || 'India'}
    </address>
  );
};

export const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useApp();
  const fileInputRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Review states
  const [orderReview, setOrderReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{ file, previewUrl, id }]
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/orders/${id}`)}`);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const orderData = await orderService.getOrderById(id);
        setOrder(orderData);

        // If order is delivered, check for existing review
        if (orderData?.orderStatus === 'delivered') {
          try {
            const rev = await reviewService.getOrderReview(orderData._id);
            if (rev) setOrderReview(rev);
          } catch (revErr) {
            console.error('Failed to load order review:', revErr);
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load this order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    return () => {
      // Clean up object URLs
      selectedPhotos.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="container order-details-page">
        <div className="surface-card order-details-state">
          <Clock size={28} />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container order-details-page">
        <div className="surface-card order-details-state">
          <AlertCircle size={40} className="text-danger" />
          <h1>Order unavailable</h1>
          <p>{error || 'This order could not be found.'}</p>
          <Link to="/orders" className="btn btn-primary"><ArrowLeft size={16} /> Back to Orders</Link>
        </div>
      </div>
    );
  }

  const product = order.product || {};
  const buyer = order.buyer || {};
  const seller = order.seller || {};
  const currentStatus = order.orderStatus || 'pending_payment';
  const currentUserId = currentUser?._id || currentUser?.id;
  const buyerId = buyer._id || buyer.id || buyer;
  const sellerId = seller._id || seller.id || seller;
  const isBuyer = String(currentUserId) === String(buyerId);
  const isSeller = String(currentUserId) === String(sellerId);
  const isDelivered = currentStatus === 'delivered';

  const updateStatus = async (nextStatus) => {
    if (statusUpdating) return;
    setStatusUpdating(true);
    setError('');
    try {
      const response = await orderService.updateOrderStatus(order._id, nextStatus);
      setOrder(response.order);

      // If newly marked delivered, check review status
      if (nextStatus === 'delivered') {
        try {
          const rev = await reviewService.getOrderReview(order._id);
          if (rev) setOrderReview(rev);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStatusAction = (nextStatus, confirmationMessage) => {
    if (window.confirm(confirmationMessage)) updateStatus(nextStatus);
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setReviewError('');

    if (selectedPhotos.length + files.length > 5) {
      setReviewError('You can upload a maximum of 5 photos per review.');
      return;
    }

    const newPhotos = [];

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type.toLowerCase())) {
        setReviewError(`"${file.name}" is not supported. Please upload JPG, PNG, or WEBP images.`);
        return;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        setReviewError(`"${file.name}" exceeds the 5 MB file size limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        file,
        previewUrl,
        id: `${file.name}-${Date.now()}-${Math.random()}`
      });
    }

    setSelectedPhotos((prev) => [...prev, ...newPhotos]);

    // Reset file input value so user can pick again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId) => {
    setSelectedPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating between 1 and 5.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await reviewService.createReview({
        orderId: order._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        photos: selectedPhotos.map((p) => p.file)
      });

      setOrderReview(response.review);
      setReviewSuccess('Thank you! Your review has been submitted successfully.');
      setShowReviewForm(false);
      // Clean up previews
      selectedPhotos.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      setSelectedPhotos([]);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const action = currentStatus === 'pending_payment' && isSeller
    ? { status: 'processing', label: 'Start Processing', confirmation: 'Start processing this order?' }
    : currentStatus === 'processing' && isSeller
    ? { status: 'shipped', label: 'Mark as Shipped', confirmation: 'Mark this order as shipped?' }
    : currentStatus === 'shipped' && isBuyer
    ? { status: 'delivered', label: 'Mark as Delivered', confirmation: 'Mark this order as delivered?' }
    : null;
  const canCancel = ['pending_payment', 'processing'].includes(currentStatus) && (isBuyer || isSeller);

  return (
    <div className="container order-details-page">
      <Link to="/orders" className="order-details-back"><ArrowLeft size={16} /> Back to Orders</Link>
      <div className="order-details-header">
        <div>
          <span className="orders-eyebrow">Order Details</span>
          <h1>Order #{order.orderId || order._id}</h1>
          <p><CalendarDays size={14} /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Date unavailable'}</p>
        </div>
        <span className={`order-status order-status-main order-status-${currentStatus}`}><CheckCircle2 size={14} /> {label(currentStatus)}</span>
      </div>

      {error && <div className="alert alert-danger order-details-alert">{error}</div>}

      <section className="surface-card order-status-timeline">
        <h2>Delivery Status</h2>
        <div className="order-status-steps">
          {STATUS_STEPS.map((status, index) => {
            const isComplete = currentStatus !== 'cancelled' && STATUS_STEPS.indexOf(currentStatus) >= index;
            const isCurrent = currentStatus === status;
            return (
              <React.Fragment key={status}>
                <div className={`order-status-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
                  <span className="order-status-step-dot">{isComplete ? <CheckCircle2 size={14} /> : index + 1}</span>
                  <span>{label(status)}</span>
                </div>
                {index < STATUS_STEPS.length - 1 && <span className={`order-status-connector ${isComplete && currentStatus !== status ? 'complete' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>
        {currentStatus === 'cancelled' && <div className="order-cancelled-state"><AlertCircle size={16} /> Order Cancelled</div>}
      </section>

      <div className="order-details-layout">
        <section className="surface-card order-details-product">
          <img
            src={getProductImage(product)}
            alt={product.title || 'Product'}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
          />
          <div>
            <span className="orders-eyebrow">Product</span>
            <h2>{product.title || 'Product information unavailable'}</h2>
            {product.category && <p>Category: {product.category}</p>}
            {product._id && (
              <Link to={`/products/${product._id}`} className="order-view-product-link">
                View Product Listing →
              </Link>
            )}
          </div>
        </section>

        <section className="surface-card order-details-panel">
          <h2>Order Summary</h2>
          <dl className="order-details-facts">
            <div><dt>Final Bargain Price</dt><dd>{formatMoney(order.agreedPrice)}</dd></div>
            <div><dt>Quantity</dt><dd>{order.quantity ?? 'Unavailable'}</dd></div>
            <div><dt>Total Amount</dt><dd>{formatMoney(order.totalAmount)}</dd></div>
            <div><dt>Payment Status</dt><dd>{label(order.paymentStatus) || 'Unavailable'}</dd></div>
          </dl>
        </section>

        <section className="surface-card order-details-panel order-status-actions">
          <h2>Manage Order Status</h2>
          {action && (
            <button type="button" className="btn btn-primary" disabled={statusUpdating} onClick={() => handleStatusAction(action.status, action.confirmation)}>
              {statusUpdating ? 'Updating...' : action.label}
            </button>
          )}
          {canCancel && (
            <button type="button" className="btn btn-secondary order-cancel-button" disabled={statusUpdating} onClick={() => handleStatusAction('cancelled', 'Cancel this order?')}>
              {statusUpdating ? 'Updating...' : 'Cancel Order'}
            </button>
          )}
          {!action && !canCancel && <p className="order-details-muted">No status actions are available for this order.</p>}
        </section>

        <section className="surface-card order-details-panel">
          <h2>Participants</h2>
          <p><strong>Buyer:</strong> {buyer.name || 'Buyer information unavailable'}</p>
          {buyer.email && <p className="order-details-muted">{buyer.email}</p>}
          <p className="order-details-spaced"><strong>Seller:</strong> {seller.name || 'Seller information unavailable'}</p>
          {seller.email && <p className="order-details-muted">{seller.email}</p>}
        </section>

        <section className="surface-card order-details-panel">
          <h2><Package size={18} /> Delivery Address</h2>
          <AddressBlock address={order.deliveryAddress} />
        </section>

        {/* REVIEWS & RATINGS SECTION */}
        {isDelivered && (
          <section className="surface-card order-details-panel order-review-section">
            <div className="order-review-header">
              <h2>
                <Star size={18} className="star-icon filled" />
                <span>Reviews & Ratings</span>
              </h2>
              {orderReview && (
                <span className="badge badge-success order-review-status-badge">
                  <CheckCircle2 size={13} />
                  <span>Review Submitted</span>
                </span>
              )}
            </div>

            {reviewSuccess && (
              <div className="alert alert-success order-review-alert">
                <CheckCircle2 size={16} />
                <span>{reviewSuccess}</span>
              </div>
            )}

            {/* Case 1: Review already submitted */}
            {orderReview ? (
              <div className="order-review-submitted-box">
                <div className="order-review-score-row">
                  <RatingStars mode="full" rating={orderReview.rating} size={18} showNumber={true} />
                  <span className="order-review-date">
                    Reviewed on {new Date(orderReview.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {orderReview.comment ? (
                  <p className="order-review-comment">"{orderReview.comment}"</p>
                ) : (
                  <p className="order-review-no-comment">No written comment provided.</p>
                )}

                {/* Display review photos if present */}
                {orderReview.images && orderReview.images.length > 0 && (
                  <div className="order-review-photos-grid">
                    {orderReview.images.map((imgObj, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="order-review-photo-thumb"
                        onClick={() => setLightboxImage(resolveImageUrl(imgObj.url))}
                        title="Click to view full photo"
                      >
                        <img
                          src={resolveImageUrl(imgObj.url)}
                          alt={`Review photo ${idx + 1}`}
                          className="review-thumb-img"
                        />
                        <span className="photo-zoom-overlay">
                          <ZoomIn size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {isBuyer && (
                  <div className="order-review-verified-pill">
                    <CheckCircle2 size={13} />
                    <span>Verified Purchase Review</span>
                  </div>
                )}
              </div>
            ) : isBuyer ? (
              /* Case 2: Buyer has not reviewed yet */
              <div className="order-review-prompt-box">
                {!showReviewForm ? (
                  <div className="order-review-cta-wrap">
                    <p className="order-review-cta-text">
                      Your order was delivered! Please share your rating, review, and actual product photos.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-write-review"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <Star size={16} />
                      <span>Write a Review</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="order-review-form">
                    <div className="review-form-field">
                      <label className="review-form-label">
                        Rating <span className="text-danger">*</span>
                      </label>
                      <StarRatingInput
                        value={reviewRating}
                        onChange={setReviewRating}
                        size={32}
                        disabled={reviewSubmitting}
                      />
                    </div>

                    <div className="review-form-field">
                      <label className="review-form-label" htmlFor="review-comment-input">
                        Review Comment (Optional)
                      </label>
                      <textarea
                        id="review-comment-input"
                        className="review-textarea"
                        rows={4}
                        placeholder="Describe product quality, delivery experience, or seller communication..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        maxLength={1000}
                        disabled={reviewSubmitting}
                      />
                      <div className="review-char-count">
                        {reviewComment.length} / 1000 characters
                      </div>
                    </div>

                    {/* Photo Upload Section */}
                    <div className="review-form-field">
                      <div className="review-photo-field-header">
                        <label className="review-form-label">
                          Product Photos (Optional)
                        </label>
                        <span className="review-photo-count-hint">
                          {selectedPhotos.length} / 5 photos selected
                        </span>
                      </div>

                      <p className="review-photo-helper">
                        Attach up to 5 photos showing the condition of the delivered item (JPG, PNG, WEBP, max 5 MB each).
                      </p>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden-file-input"
                        onChange={handlePhotoSelect}
                        disabled={reviewSubmitting || selectedPhotos.length >= 5}
                      />

                      {/* Photo Previews + Add Button Grid */}
                      <div className="review-photos-uploader-wrap">
                        {selectedPhotos.map((photo) => (
                          <div key={photo.id} className="photo-preview-item">
                            <img src={photo.previewUrl} alt="Preview" className="photo-preview-img" />
                            <button
                              type="button"
                              className="photo-preview-remove-btn"
                              onClick={() => handleRemovePhoto(photo.id)}
                              disabled={reviewSubmitting}
                              title="Remove photo"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {selectedPhotos.length < 5 && (
                          <button
                            type="button"
                            className="btn-add-photos-trigger"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={reviewSubmitting}
                          >
                            <Camera size={20} />
                            <span>Add Photos</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {reviewError && (
                      <div className="alert alert-danger order-review-alert">
                        <AlertCircle size={16} />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <div className="review-form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={reviewSubmitting || reviewRating === 0}
                      >
                        {reviewSubmitting ? 'Submitting Review...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewError('');
                          // Clean up selected photos
                          selectedPhotos.forEach((p) => {
                            if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
                          });
                          setSelectedPhotos([]);
                        }}
                        disabled={reviewSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Case 3: Seller viewing, but no review yet */
              <div className="order-review-empty-box">
                <p className="order-details-muted">
                  The buyer has not submitted a review for this delivered order yet.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Lightbox Modal for enlarged photo inspection */}
      {lightboxImage && (
        <div className="review-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="review-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setLightboxImage(null)}
              aria-label="Close photo preview"
            >
              <X size={20} />
            </button>
            <img src={lightboxImage} alt="Enlarged review photo" className="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
