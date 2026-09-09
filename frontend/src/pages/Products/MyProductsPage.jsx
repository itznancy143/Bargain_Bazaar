import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Layers,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  LogIn,
  Sliders
} from 'lucide-react';
import { productService } from '../../services/productService';
import { useApp } from '../../context/AppContext';
import './MyProducts.css';

export const MyProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated, authLoading } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyProducts = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load your product listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchMyProducts();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleDelete = async (id, title) => {
    const confirm = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`);
    if (!confirm) return;

    setDeletingId(id);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      setToastMessage('Product deleted successfully.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete product listing');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="container my-products-root">
        <div className="surface-card" style={{ padding: '50px', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h3>Checking authentication...</h3>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container my-products-root">
        <div className="surface-card dashboard-empty-state">
          <div className="empty-state-icon">
            <LogIn size={32} />
          </div>
          <h2>Seller Authentication Required</h2>
          <p className="text-muted" style={{ maxWidth: '400px' }}>
            Please sign in with your seller account to view and manage your product listings and private bargaining prices.
          </p>
          <Link to="/login" state={{ from: '/dashboard/products' }} className="btn btn-primary">
            <LogIn size={16} />
            <span>Sign In to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalListings = products.length;
  const activeListings = products.filter((p) => p.status === 'active').length;
  const totalValue = products.reduce((acc, p) => acc + (Number(p.askingPrice) || 0), 0);

  return (
    <div className="container my-products-root">
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Seller Product Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{currentUser?.name}</strong>. Manage your inventory and private floor prices.
          </p>
        </div>

        <Link to="/dashboard/products/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>List New Product</span>
        </Link>
      </div>

      {/* Success Banner / Toast */}
      {toastMessage && (
        <div className="auth-alert auth-alert-success animate-fade-in" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-icon-wrap">
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{totalListings}</div>
            <div className="stat-label">Total Listings</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-wrap success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{activeListings}</div>
            <div className="stat-label">Active on Marketplace</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-wrap warning">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">₹{totalValue.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Inventory Asking Value</div>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="my-listings-container">
        <div className="listings-table-header">
          <span className="table-header-title">My Product Inventory</span>
          <span className="text-xs text-muted">{products.length} items recorded</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <p className="text-muted text-sm">Loading your listings...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-state-icon">
              <Package size={32} />
            </div>
            <h3>No products listed yet</h3>
            <p className="text-muted" style={{ maxWidth: '400px' }}>
              You haven't listed any items for sale yet. Start selling with smart bargaining and instant buyer offers!
            </p>
            <Link to="/dashboard/products/new" className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              <span>List Your First Product</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Asking Price</th>
                  <th>Private Min Price</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const id = p._id || p.id;
                  const image = p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

                  return (
                    <tr key={id}>
                      <td>
                        <div className="table-product-cell">
                          <img src={image} alt={p.title} className="table-product-thumb" />
                          <Link to={`/products/${id}`} className="table-product-name" title={p.title}>
                            {p.title}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-category">{p.category}</span>
                      </td>
                      <td>
                        <span className="table-price-asking">₹{Number(p.askingPrice).toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <div className="table-price-secret" title="Private to you: Buyers cannot see this price">
                          <Lock size={12} />
                          <span>₹{Number(p.minimumPrice || p.askingPrice).toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {p.status ? p.status.toUpperCase() : 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">{p.viewsCount || 0}</span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <Link to={`/products/${id}`} className="btn-icon-action" title="View Public Page">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/dashboard/products/edit/${id}`} className="btn-icon-action" title="Edit Listing">
                            <Edit3 size={15} />
                          </Link>
                          <button
                            type="button"
                            className="btn-icon-action danger"
                            title="Delete Listing"
                            onClick={() => handleDelete(id, p.title)}
                            disabled={deletingId === id}
                          >
                            {deletingId === id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProductsPage;
