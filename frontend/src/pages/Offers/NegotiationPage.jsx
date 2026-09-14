import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Tag,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { productService } from '../../services/productService';
import { offerService } from '../../services/offerService';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import './Negotiation.css';

export const NegotiationPage = () => {
  const { productId, id: offerIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useApp();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [product, setProduct] = useState(null);
  const [offer, setOffer] = useState(null);

  // Form states
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);

  // Load negotiation data
  const loadData = async () => {
    setLoading(true);
    setError('');
    setCounterAmount('');
    setCounterMessage('');
    setShowCounterInput(false);
    try {
      if (offerIdParam) {
        // Direct offer view
        const res = await offerService.getOfferById(offerIdParam);
        if (res.success && res.offer) {
          setOffer(res.offer);
          setProduct(res.offer.product);
          setDeliveryAddress((previous) => ({ ...previous, ...(res.offer.deliveryAddress || {}) }));
        }
      } else if (productId) {
        // Look up product first
        const prod = await productService.getProductById(productId);
        setProduct(prod);

        // Check if there is an active offer for this product & current user
        if (currentUser) {
          const existingOffer = await offerService.getOfferByProduct(productId);
          if (existingOffer) {
            setOffer(existingOffer);
            setDeliveryAddress((previous) => ({ ...previous, ...(existingOffer.deliveryAddress || {}) }));
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load negotiation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId, offerIdParam, currentUser]);

  const getEntityId = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'object') {
      return String(entity._id || entity.id || '');
    }
    return String(entity);
  };

  const currentUserId = getEntityId(currentUser?.id || currentUser?._id);
  const isOwner =
    product &&
    currentUser &&
    product.seller &&
    getEntityId(product.seller) === currentUserId;

  const isBuyer =
    offer &&
    currentUser &&
    offer.buyer &&
    getEntityId(offer.buyer) === currentUserId;

  const isSeller =
    offer &&
    currentUser &&
    offer.seller &&
    getEntityId(offer.seller) === currentUserId;

  const lastOfferedById = offer?.lastOfferedBy?._id || offer?.lastOfferedBy?.id || offer?.lastOfferedBy;
  const isMyTurn =
    offer &&
    (offer.status === 'pending' || offer.status === 'countered') &&
    lastOfferedById &&
    getEntityId(lastOfferedById) !== currentUserId;

  // Handle Initial Offer creation by Buyer
  const handleInitialOffer = async (e) => {
    e.preventDefault();
    if (!counterAmount || Number(counterAmount) <= 0) {
      setError('Please enter a valid offer amount greater than 0');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await offerService.createOffer({
        productId: product._id || product.id,
        amount: Number(counterAmount),
        message: counterMessage
      });

      if (res.success && res.offer) {
        setOffer(res.offer);
        setCounterAmount('');
        setCounterMessage('');
        setSuccessMsg(res.message || 'Offer submitted successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle acceptance of the proposed price; seller confirmation is separate.
  const handleAcceptOffer = async () => {
    if (!offer) return;
    if (isBuyer && ['addressLine1', 'city', 'state', 'postalCode'].some((field) => !deliveryAddress[field].trim())) {
      setError('Please complete your delivery address before accepting the price.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await offerService.acceptOffer(
        offer._id,
        counterMessage || 'Price accepted. Waiting for seller confirmation.',
        isBuyer ? deliveryAddress : undefined
      );
      if (res.success && res.offer) {
        setOffer(res.offer);
        setSuccessMsg(res.message || 'Price accepted. Waiting for seller confirmation.');
      }
    } catch (err) {
      setError(err.message || 'Failed to accept offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeal = async () => {
    if (!offer || !isSeller) return;
    if (!window.confirm(`Confirm this deal at ₹${Number(offer.agreedPrice || offer.amount).toLocaleString('en-IN')}?`)) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await offerService.confirmDeal(offer._id);
      if (res.success && res.offer) {
        setOffer(res.offer);
        setSuccessMsg(res.message || 'Deal confirmed successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm deal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Rejecting Offer
  const handleRejectOffer = async () => {
    if (!offer) return;
    if (!window.confirm('Are you sure you want to decline this offer? This will end this negotiation.')) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await offerService.rejectOffer(offer._id, counterMessage || 'Declined offer.');
      if (res.success && res.offer) {
        setOffer(res.offer);
        setSuccessMsg('Offer has been rejected.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reject offer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Counteroffer Submission
  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    if (!offer || !counterAmount || Number(counterAmount) <= 0) {
      setError('Please enter a valid counteroffer amount greater than 0');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await offerService.counterOffer(offer._id, {
        amount: Number(counterAmount),
        message: counterMessage
      });

      if (res.success && res.offer) {
        setOffer(res.offer);
        setCounterAmount('');
        setCounterMessage('');
        setSuccessMsg(res.message || 'Counteroffer submitted successfully!');
        setShowCounterInput(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit counteroffer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container negotiation-page-root">
        <div className="surface-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Loading Negotiation Room...</h3>
        </div>
      </div>
    );
  }

  if (!product && !offer) {
    return (
      <div className="container negotiation-page-root">
        <div className="surface-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={40} className="text-danger" style={{ margin: '0 auto 16px' }} />
          <h2>Negotiation Not Found</h2>
          <p className="text-muted">{error || 'Could not find this product or offer negotiation.'}</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const askingPrice = product?.askingPrice || offer?.product?.askingPrice || 0;
  const currentOfferAmount = offer?.amount || counterAmount;
  const isWaitingForSellerConfirmation = offer?.status === 'waiting_seller_confirmation';
  const isDealConfirmed = offer?.status === 'deal_confirmed';
  const isRejected = offer?.status === 'rejected';

  return (
    <div className="container negotiation-page-root">
      {/* Back Link */}
      <Link
        to={product?._id || product?.id ? `/products/${product._id || product.id}` : '/offers'}
        className="negotiation-back-link"
      >
        <ArrowLeft size={16} />
        <span>Back to {product?.title ? 'Product Details' : 'Offers'}</span>
      </Link>

      {/* Notifications / Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Product Summary Header Card */}
      <div className="negotiation-product-header">
        <div className="neg-prod-left">
          <img
            src={product?.image || (product?.images && product?.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
            alt={product?.title}
            className="neg-prod-thumb"
          />
          <div>
            <h1 className="neg-prod-title">{product?.title}</h1>
            <div className="neg-prod-meta">
              <Badge variant="category" size="sm">
                {product?.category}
              </Badge>
              <Badge variant="condition" size="sm">
                {product?.condition || 'Good'}
              </Badge>
              <span>📍 {product?.location || 'India'}</span>
              <span>👤 Seller: {product?.seller?.name || 'Verified Seller'}</span>
            </div>
          </div>
        </div>

        <div className="neg-prod-right">
          <div className="neg-asking-label">Original Asking Price</div>
          <div className="neg-asking-price">₹{Number(askingPrice).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Deal confirmed banner */}
      {isDealConfirmed && (
        <div className="deal-agreed-card animate-fade-in">
          <div className="deal-agreed-badge">
            <Sparkles size={16} />
            <span>DEAL CONFIRMED</span>
          </div>
          <h2 className="deal-agreed-heading">🎉 Deal Confirmed!</h2>
          <div className="deal-agreed-price-wrap">
            <div className="deal-agreed-label">Final Agreed Bargain Price</div>
            <div className="deal-agreed-price">₹{Number(offer.agreedPrice || offer.amount).toLocaleString('en-IN')}</div>
          </div>
          <p className="deal-agreed-details">
            The seller confirmed this deal at{' '}
            <strong>{new Date(offer.dealConfirmedAt || offer.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>.
            This deal is locked.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/offers" className="btn btn-secondary">
              View All Deals & Offers
            </Link>
            <Link to="/products" className="btn btn-primary">
              <ShoppingBag size={16} />
              <span>Explore More Products</span>
            </Link>
          </div>
        </div>
      )}

      {/* Active Status Banner */}
      {!isDealConfirmed && offer && (
        <div
          className={`neg-status-banner ${
            isRejected
              ? 'status-rejected'
              : isMyTurn
              ? 'status-action-required'
              : 'status-waiting'
          }`}
        >
          <div className="neg-status-banner-left">
            {isRejected ? (
              <XCircle size={24} className="neg-status-icon text-danger" />
            ) : isMyTurn ? (
              <Handshake size={24} className="neg-status-icon text-primary" />
            ) : (
              <Clock size={24} className="neg-status-icon text-warning" />
            )}
            <div>
              <div className="neg-status-title">
                {isRejected
                  ? 'Negotiation Closed (Offer Declined)'
                  : isWaitingForSellerConfirmation
                  ? isSeller
                    ? `Ready to Confirm Deal at ₹${Number(offer.agreedPrice || offer.amount).toLocaleString('en-IN')}`
                    : 'Price Accepted — Waiting for Seller Confirmation'
                  : isMyTurn
                  ? `Your Turn to Respond: Current Offer ₹${Number(offer.amount).toLocaleString('en-IN')}`
                  : `Waiting for ${isBuyer ? 'Seller' : 'Buyer'} to respond to ₹${Number(offer.amount).toLocaleString('en-IN')}`}
              </div>
              <div className="neg-status-sub">
                {isRejected
                  ? 'This negotiation has ended.'
                  : isWaitingForSellerConfirmation
                  ? isSeller
                    ? 'Review the agreed price and confirm the deal when ready.'
                    : 'Your acceptance was recorded. The seller must explicitly confirm the deal.'
                  : isMyTurn
                  ? 'You can Accept this price, propose a Counteroffer, or Decline.'
                  : 'You will be notified as soon as they review your offer.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation History Stream (if offer exists) */}
      {offer && offer.history && offer.history.length > 0 && (
        <div className="neg-timeline-section">
          <div className="neg-timeline-title">
            <span>Negotiation Timeline & History</span>
            <span className="badge badge-neutral">{offer.history.length} Round(s)</span>
          </div>

          <div className="neg-timeline-list">
            {offer.history.map((step, idx) => {
              const isMine =
                step.sender &&
                  getEntityId(step.sender) === currentUserId;

              const senderName = isMine
                ? 'You'
                : step.sender?.name || (step.senderRole === 'seller' ? 'Seller' : 'Buyer');

              const senderRoleLabel = step.senderRole ? step.senderRole.toUpperCase() : 'USER';
              const avatar =
                step.sender?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=2563EB&color=fff&bold=true`;

              return (
                <div key={idx} className={`neg-timeline-item ${isMine ? 'mine' : ''}`}>
                  <img src={avatar} alt={senderName} className="neg-avatar" />
                  <div className="neg-bubble">
                    <div className="neg-bubble-header">
                      <span className="neg-sender-name">
                        {senderName} ({senderRoleLabel})
                      </span>
                      <span className={`neg-action-tag tag-${step.action}`}>
                        {step.action === 'offer'
                          ? 'Initial Offer'
                          : step.action === 'counter'
                          ? 'Counteroffer'
                          : step.action === 'accept'
                          ? 'Price Accepted'
                          : 'Declined'}
                      </span>
                    </div>

                    <div className="neg-amount-row">
                      <span className="neg-amount-val">
                        ₹{Number(step.amount).toLocaleString('en-IN')}
                      </span>
                      {askingPrice > 0 && (
                        <span className="text-xs text-muted">
                          ({Math.round(((askingPrice - step.amount) / askingPrice) * 100)}% below asking)
                        </span>
                      )}
                    </div>

                    {step.message && <p className="neg-message-text">"{step.message}"</p>}

                    <div className="neg-time-stamp">
                      {new Date(step.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case 1: Initial Offer Form (Buyer viewing product for the first time) */}
      {!offer && !isOwner && (
        <div className="neg-action-box animate-fade-in">
          <h2 className="neg-action-title">Make Your Bargain Offer</h2>
          <p className="neg-action-desc">
            Enter the amount you would like to purchase this product for. The seller can accept, decline, or send a counteroffer.
          </p>

          <form onSubmit={handleInitialOffer}>
            <div className="neg-form-group">
              <label className="form-label">Your Offer Price (₹)</label>
              <div className="neg-input-wrap">
                <span className="neg-currency-symbol">₹</span>
                <input
                  type="number"
                  className="neg-amount-input"
                  placeholder="e.g. 42000"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  min="1"
                  max={askingPrice * 2}
                  required
                />
              </div>
            </div>

            <div className="neg-form-group">
              <label className="form-label">Optional Note to Seller</label>
              <textarea
                className="neg-textarea"
                placeholder="e.g. Can pick up today, let me know if this works for you!"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                maxLength="300"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Send size={18} />
              <span>{submitting ? 'Submitting Offer...' : `Submit Offer (₹${Number(counterAmount || 0).toLocaleString('en-IN')})`}</span>
            </button>
          </form>
        </div>
      )}

      {/* Case 2: Action Box for Current Turn (Accept, Reject, Counter) */}
      {offer && isMyTurn && !isWaitingForSellerConfirmation && !isDealConfirmed && !isRejected && (
        <div className="neg-action-box animate-fade-in">
          <h2 className="neg-action-title">Respond to Current Offer</h2>
          <p className="neg-action-desc">
            The other party has offered <strong>₹{Number(offer.amount).toLocaleString('en-IN')}</strong>. What would you like to do?
          </p>

          {!showCounterInput ? (
            <>
              {isBuyer && (
                <div className="neg-address-form">
                  <h3>Delivery Address</h3>
                  <p className="neg-action-desc">Required to create your order after the seller confirms this deal.</p>
                  <input className="neg-text-input" placeholder="Address line 1" value={deliveryAddress.addressLine1} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, addressLine1: e.target.value })} />
                  <input className="neg-text-input" placeholder="Address line 2 (optional)" value={deliveryAddress.addressLine2} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, addressLine2: e.target.value })} />
                  <div className="neg-address-grid">
                    <input className="neg-text-input" placeholder="City" value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })} />
                    <input className="neg-text-input" placeholder="State" value={deliveryAddress.state} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })} />
                    <input className="neg-text-input" placeholder="Postal code" value={deliveryAddress.postalCode} onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="neg-button-group">
              <button
                type="button"
                className="btn-accept-deal"
                onClick={handleAcceptOffer}
                disabled={submitting}
              >
                <CheckCircle2 size={18} />
                <span>Accept Offer (₹{Number(offer.amount).toLocaleString('en-IN')})</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCounterAmount('');
                  setCounterMessage('');
                  setShowCounterInput(true);
                }}
                disabled={submitting}
              >
                <Handshake size={18} />
                <span>Make a Counteroffer</span>
              </button>

              <button
                type="button"
                className="btn-reject-deal"
                onClick={handleRejectOffer}
                disabled={submitting}
              >
                <XCircle size={18} />
                <span>Decline Offer</span>
              </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCounterSubmit} className="animate-fade-in">
              <div className="neg-form-group">
                <label className="form-label">Your Counteroffer Amount (₹)</label>
                <div className="neg-input-wrap">
                  <span className="neg-currency-symbol">₹</span>
                  <input
                    type="number"
                    className="neg-amount-input"
                    placeholder="Enter counter amount"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="neg-form-group">
                <label className="form-label">Note for Counteroffer (Optional)</label>
                <textarea
                  className="neg-textarea"
                  placeholder="e.g. Best I can offer is this amount."
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  maxLength="300"
                />
              </div>

              <div className="neg-button-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Sending Counter...' : `Submit Counter (₹${Number(counterAmount || 0).toLocaleString('en-IN')})`}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCounterAmount('');
                    setCounterMessage('');
                    setShowCounterInput(false);
                  }}
                  disabled={submitting}
                >
                  Cancel Counter
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {offer && isSeller && isWaitingForSellerConfirmation && (
        <div className="neg-action-box animate-fade-in">
          <h2 className="neg-action-title">Confirm Deal</h2>
          <p className="neg-action-desc">
            The buyer accepted the proposed price. Confirm this deal at <strong>₹{Number(offer.agreedPrice || offer.amount).toLocaleString('en-IN')}</strong>?
          </p>
          <button
            type="button"
            className="btn-accept-deal"
            onClick={handleConfirmDeal}
            disabled={submitting}
          >
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Confirming Deal...' : 'Confirm Deal'}</span>
          </button>
        </div>
      )}

      {/* Case 3: Waiting State when it's NOT your turn */}
      {offer && !isMyTurn && !isWaitingForSellerConfirmation && !isDealConfirmed && !isRejected && (
        <div className="neg-waiting-card animate-fade-in">
          <Clock size={32} style={{ margin: '0 auto 12px', color: '#D97706' }} />
          <div className="neg-waiting-title">Awaiting Response</div>
          <div className="neg-waiting-desc">
            The current offer is <strong>₹{Number(offer.amount).toLocaleString('en-IN')}</strong>. Waiting for{' '}
            <strong>{isBuyer ? 'Seller' : 'Buyer'}</strong> to review and respond.
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationPage;
