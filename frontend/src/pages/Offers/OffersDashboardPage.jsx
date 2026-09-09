import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Handshake,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  ShoppingBag,
  Inbox,
  Send,
  PlusCircle
} from 'lucide-react';
import { offerService } from '../../services/offerService';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import './OffersDashboard.css';

export const OffersDashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useApp();

  const [activeTab, setActiveTab] = useState('received'); // 'received' (seller) or 'sent' (buyer)
  const [statusFilter, setStatusFilter] = useState('all');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/offers');
      return;
    }

    const loadOffers = async () => {
      setLoading(true);
      try {
        const role = activeTab === 'received' ? 'seller' : 'buyer';
        const data = await offerService.getMyOffers({
          role,
          status: statusFilter
        });
        setOffers(data || []);
      } catch (err) {
        console.error('Failed to load offers:', err);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, [activeTab, statusFilter, isAuthenticated, navigate]);

  const currentUserId = currentUser?.id || currentUser?._id;

  return (
    <div className="container offers-hub-root">
      {/* Header */}
      <div className="offers-hub-header">
        <h1 className="offers-hub-title">Offers & Bargains Hub</h1>
        <p className="offers-hub-subtitle">
          Track and manage all your ongoing price negotiations, counteroffers, and agreed deals.
        </p>
      </div>

      {/* Tabs */}
      <div className="offers-hub-tabs">
        <button
          type="button"
          className={`offers-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          <Inbox size={18} />
          <span>Received Offers (As Seller)</span>
        </button>

        <button
          type="button"
          className={`offers-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <Send size={18} />
          <span>My Sent Offers (As Buyer)</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="offers-filter-row">
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Negotiations
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'countered' ? 'active' : ''}`}
          onClick={() => setStatusFilter('countered')}
        >
          Countered
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'waiting_seller_confirmation' ? 'active' : ''}`}
          onClick={() => setStatusFilter('waiting_seller_confirmation')}
        >
          Waiting for Seller Confirmation
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'deal_confirmed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('deal_confirmed')}
        >
          Deal Confirmed
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Declined
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="surface-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Loading your negotiations...</h3>
        </div>
      ) : offers.length === 0 ? (
        <div className="offers-empty-state animate-fade-in">
          <Handshake size={48} className="offers-empty-icon" />
          <h3 className="offers-empty-title">
            {activeTab === 'received' ? 'No Received Offers Yet' : 'No Offers Placed Yet'}
          </h3>
          <p className="offers-empty-desc">
            {activeTab === 'received'
              ? 'When buyers make bargain offers on your listed products, they will appear here.'
              : 'You have not made any bargain offers on products yet. Find items and negotiate your price!'}
          </p>
          {activeTab === 'received' ? (
            <Link to="/dashboard/products/new" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>List a New Product</span>
            </Link>
          ) : (
            <Link to="/products" className="btn btn-primary">
              <ShoppingBag size={16} />
              <span>Explore Products</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="offers-list-grid">
          {offers.map((item) => {
            const prod = item.product || {};
            const isDealConfirmed = item.status === 'deal_confirmed';
            const isWaitingForSellerConfirmation = item.status === 'waiting_seller_confirmation';
            const isRejected = item.status === 'rejected';

            const lastOfferedById = item.lastOfferedBy?._id || item.lastOfferedBy?.id || item.lastOfferedBy;
            const isMyTurn =
              (item.status === 'pending' || item.status === 'countered') &&
              lastOfferedById &&
              lastOfferedById.toString() !== currentUserId?.toString();

            const otherPersonName =
              activeTab === 'received'
                ? item.buyer?.name || 'Buyer'
                : item.seller?.name || 'Seller';

            const askingPrice = prod.askingPrice || 0;
            const currentOffer = item.agreedPrice || item.amount;
            const discountPercent =
              askingPrice > 0
                ? Math.round(((askingPrice - currentOffer) / askingPrice) * 100)
                : 0;

            return (
              <div
                key={item._id}
                className={`offer-card ${
                  isDealConfirmed ? 'card-deal-agreed' : isMyTurn ? 'card-turn-mine' : ''
                } animate-fade-in`}
              >
                {/* Left: Product & Counterparty info */}
                <div className="offer-card-left">
                  <img
                    src={prod.image || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                    alt={prod.title || 'Product'}
                    className="offer-card-thumb"
                  />
                  <div>
                    <h3 className="offer-card-title">{prod.title || 'Product Listing'}</h3>
                    <div className="offer-card-meta">
                      <span>👤 {activeTab === 'received' ? 'Buyer' : 'Seller'}: <strong>{otherPersonName}</strong></span>
                      <span>•</span>
                      <span>Asking: ₹{Number(askingPrice).toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Offer amount & discount */}
                <div className="offer-card-center">
                  <span className="offer-amount-label">
                    {isDealConfirmed || isWaitingForSellerConfirmation ? 'Agreed Price' : 'Current Offer'}
                  </span>
                  <div className="offer-amount-val" style={{ color: isDealConfirmed ? '#16A34A' : 'var(--text-main)' }}>
                    ₹{Number(currentOffer).toLocaleString('en-IN')}
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-xs text-muted">
                      ({discountPercent}% below asking)
                    </span>
                  )}
                </div>

                {/* Right: Status badge & Negotiation button */}
                <div className="offer-card-right">
                  {isDealConfirmed ? (
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} />
                      <span>Deal Confirmed</span>
                    </span>
                  ) : isWaitingForSellerConfirmation ? (
                    <span className="badge badge-warning">
                      <Clock size={12} />
                      <span>Waiting for Seller Confirmation</span>
                    </span>
                  ) : isRejected ? (
                    <span className="badge badge-error">
                      <XCircle size={12} />
                      <span>Declined</span>
                    </span>
                  ) : isMyTurn ? (
                    <span className="badge badge-primary pulse">
                      Action Required
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      <Clock size={12} />
                      <span>Waiting</span>
                    </span>
                  )}

                  <Link
                    to={`/negotiation/offer/${item._id}`}
                    className={`btn btn-sm ${isMyTurn ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <span>{isMyTurn ? 'Respond' : 'View Room'}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersDashboardPage;
