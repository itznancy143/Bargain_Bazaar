import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Package, ShoppingBag } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useApp } from '../../context/AppContext';
import './Orders.css';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

const getProductImage = (product) => (
  product?.image ||
  (product?.images && product.images.length > 0 ? product.images[0] : FALLBACK_PRODUCT_IMAGE)
);

export const OrdersPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/orders');
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const [buyerOrders, sellerOrders] = await Promise.all([
          orderService.getMyOrders(),
          orderService.getSellerOrders()
        ]);
        const uniqueOrders = new Map();
        [...buyerOrders, ...sellerOrders].forEach((order) => uniqueOrders.set(order._id, order));
        setOrders([...uniqueOrders.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        setError(err.message || 'Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, navigate]);

  const currentUserId = currentUser?._id || currentUser?.id;

  return (
    <div className="container orders-page">
      <div className="orders-header">
        <div>
          <span className="orders-eyebrow">Bargain Bazaar</span>
          <h1>My Orders & Selling Orders</h1>
          <p>Track purchases and confirmed deals for products you own.</p>
        </div>
        <ShoppingBag size={34} className="orders-header-icon" />
      </div>

      {error && <div className="alert alert-danger orders-alert">{error}</div>}
      {loading ? (
        <div className="surface-card orders-empty"><Clock size={28} /><p>Loading orders...</p></div>
      ) : orders.length === 0 ? (
        <div className="surface-card orders-empty">
          <Package size={42} />
          <h2>No orders yet</h2>
          <p>Your confirmed purchases and sales will appear here.</p>
          <Link className="btn btn-primary" to="/products">Explore Products</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const product = order.product || {};
            const orderStatus = order.orderStatus || 'pending_payment';
            const orderSellerId = order.seller?._id || order.seller;
            const isOrderSeller = String(orderSellerId) === String(currentUserId);
            const person = isOrderSeller ? order.buyer : order.seller;
            return (
              <article className="surface-card order-card" key={order._id}>
                <img
                  className="order-product-image"
                  src={getProductImage(product)}
                  alt={product.title || 'Product'}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />
                <div className="order-card-main">
                  <div className="order-card-topline">
                    <span className="order-id">Order #{order.orderId}</span>
                    <span className="order-date"><CalendarDays size={14} /> {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h2><Link to={`/orders/${order._id}`}>{product.title || 'Product'}</Link></h2>
                  <p className="order-person">{isOrderSeller ? 'Buyer' : 'Seller'}: <strong>{person?.name || 'User'}</strong></p>
                  <div className="order-facts">
                    <div><span>Final Bargain Price</span><strong>{formatMoney(order.agreedPrice)}</strong></div>
                    <div><span>Quantity</span><strong>{order.quantity}</strong></div>
                    <div><span>Total</span><strong>{formatMoney(order.totalAmount)}</strong></div>
                  </div>
                  {isOrderSeller && order.deliveryAddress && (
                    <p className="order-address"><strong>Delivery:</strong> {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
                  )}
                </div>
                <div className="order-statuses">
                  <span className="order-status order-status-main"><CheckCircle2 size={14} /> {label(orderStatus)}</span>
                  <span className="order-status order-status-payment">Payment: {label(order.paymentStatus)}</span>
                  <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">View Details</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;