import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Clock, Package } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useApp } from '../../context/AppContext';
import './OrderDetails.css';

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

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
  const { isAuthenticated } = useApp();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/orders/${id}`)}`);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError('');
      try {
        setOrder(await orderService.getOrderById(id));
      } catch (err) {
        setError(err.message || 'Unable to load this order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return <div className="container order-details-page"><div className="surface-card order-details-state"><Clock size={28} /><p>Loading order details...</p></div></div>;
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

  return (
    <div className="container order-details-page">
      <Link to="/orders" className="order-details-back"><ArrowLeft size={16} /> Back to Orders</Link>
      <div className="order-details-header">
        <div>
          <span className="orders-eyebrow">Order Details</span>
          <h1>Order #{order.orderId || order._id}</h1>
          <p><CalendarDays size={14} /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Date unavailable'}</p>
        </div>
        <span className="order-status order-status-main"><CheckCircle2 size={14} /> {label(order.orderStatus)}</span>
      </div>

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
      </div>
    </div>
  );
};

export default OrderDetailsPage;
