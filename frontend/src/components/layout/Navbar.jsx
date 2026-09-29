import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  PlusCircle,
  Menu,
  X,
  Layers,
  ShoppingBag,
  Sliders,
  LogOut,
  ChevronDown,
  Handshake,
  CheckCircle2,
  LogIn,
  Star,
  Tag,
  Loader2,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Navbar.css';

// Formatter for relative timestamps
const formatNotificationTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  });
};

export const Navbar = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    handleLogout,
    searchQuery,
    setSearchQuery,
    notifications,
    unreadNotificationsCount,
    notificationsLoading,
    notificationsError,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsRead
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      navigate(`/products?search=${encodeURIComponent(localSearch.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const onSignOut = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    handleLogout();
    navigate('/login');
  };

  const toggleNotifications = () => {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next && fetchNotifications) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (n) => {
    const notifId = n._id || n.id;
    if (!n.read && markNotificationAsRead) {
      markNotificationAsRead(notifId);
    }
    setNotificationsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'offer_received':
      case 'counteroffer_received':
        return <Handshake size={14} className="notif-type-icon notif-icon-offer" />;
      case 'offer_accepted':
      case 'deal_confirmed':
        return <CheckCircle2 size={14} className="notif-type-icon notif-icon-deal" />;
      case 'offer_rejected':
        return <X size={14} className="notif-type-icon notif-icon-reject" />;
      case 'order_created':
      case 'order_status_changed':
        return <ShoppingBag size={14} className="notif-type-icon notif-icon-order" />;
      case 'order_delivered':
        return <CheckCircle2 size={14} className="notif-type-icon notif-icon-delivered" />;
      case 'review_submitted':
        return <Star size={14} className="notif-type-icon notif-icon-review" />;
      default:
        return <Bell size={14} className="notif-type-icon notif-icon-default" />;
    }
  };

  const userAvatar =
    currentUser?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=2563EB&color=fff&bold=true`;

  return (
    <header className="navbar-root sticky-top">
      <div className="container navbar-container">
        {/* Left: Brand Logo */}
        <div className="navbar-left">
          <Link to="/" className="brand-logo-link">
            <div className="brand-logo-icon-wrap">
              <Handshake size={22} className="brand-icon" />
            </div>
            <div className="brand-text-wrap">
              <span className="brand-title">
                Bargain<span className="brand-highlight">Bazaar</span>
              </span>
              <span className="brand-tagline">Buy Smart • Sell Better • Bargain Freely</span>
            </div>
          </Link>
        </div>

        {/* Center: Nav Links & Quick Search */}
        <nav className="navbar-center desktop-only">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Explore
          </NavLink>
          {currentUser && (
            <NavLink to="/offers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Offers & Deals
            </NavLink>
          )}
          <div className="nav-search-bar-wrap">
            <form onSubmit={handleSearchSubmit} className="nav-search-form">
              <Search size={16} className="nav-search-icon" />
              <input
                type="text"
                placeholder="Search iPhone, MacBook, Shoes, Furniture..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="nav-search-input"
              />
              {localSearch && (
                <button
                  type="button"
                  className="nav-search-clear"
                  onClick={() => setLocalSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>
        </nav>

        {/* Right: Actions & User Menu */}
        <div className="navbar-right">
          {/* Sell Button CTA */}
          {currentUser && (
            <Link to="/dashboard/products/new" className="btn btn-primary btn-sm btn-sell-cta desktop-only">
              <PlusCircle size={16} />
              <span>Sell Product</span>
            </Link>
          )}

          {/* Notifications Dropdown */}
          {currentUser && (
            <div className="dropdown-wrapper" ref={notifRef}>
              <button
                type="button"
                className={`navbar-icon-btn ${notificationsOpen ? 'active' : ''}`}
                onClick={toggleNotifications}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="nav-badge-count pulse">{unreadNotificationsCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="nav-dropdown-menu notif-dropdown animate-fade-in">
                  <div className="dropdown-header">
                    <div className="notif-header-title-row">
                      <span className="font-bold">Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="notif-header-badge">{unreadNotificationsCount} unread</span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        className="notif-mark-read-btn"
                        onClick={markAllNotificationsRead}
                      >
                        <Check size={12} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="notif-list">
                    {notificationsError && notifications.length > 0 && (
                      <div className="notif-error-state" role="alert">
                        {notificationsError}
                      </div>
                    )}
                    {notificationsLoading && (!notifications || notifications.length === 0) ? (
                      <div className="notif-empty-state">
                        <Loader2 size={24} className="notif-spinner animate-spin" />
                        <span>Loading notifications...</span>
                      </div>
                    ) : notificationsError && notifications.length === 0 ? (
                      <div className="notif-empty-state notif-error-empty" role="alert">
                        <span>{notificationsError}</span>
                        <button type="button" className="notif-mark-read-btn" onClick={fetchNotifications}>
                          Try again
                        </button>
                      </div>
                    ) : !notifications || notifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <Bell size={28} className="notif-empty-icon" />
                        <span className="notif-empty-title">No notifications yet</span>
                        <span className="notif-empty-desc">
                          You'll receive alerts here when buyers make offers, send counteroffers, or update orders.
                        </span>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const notifId = n._id || n.id;
                        return (
                          <div
                            key={notifId}
                            className={`notif-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleNotificationClick(n);
                              }
                            }}
                          >
                            <div className="notif-item-left">
                              {!n.read && <div className="notif-bullet"></div>}
                              <div className="notif-icon-badge">
                                {renderNotificationIcon(n.type)}
                              </div>
                            </div>
                            <div className="notif-content">
                              <div className="notif-title-row">
                                <span className="notif-title">{n.title}</span>
                                <span className="notif-time">{formatNotificationTime(n.createdAt || n.time)}</span>
                              </div>
                              <div className="notif-desc">{n.message}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Authentication Status */}
          {currentUser ? (
            <div className="dropdown-wrapper" ref={profileRef}>
              <button
                type="button"
                className="user-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="User Account"
              >
                <img src={userAvatar} alt={currentUser.name} className="user-avatar" />
                <span className="user-name desktop-only">{currentUser.name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={14} className="chevron-icon desktop-only" />
              </button>

              {profileDropdownOpen && (
                <div className="nav-dropdown-menu profile-dropdown animate-fade-in">
                  <div className="dropdown-user-header">
                    <div className="font-bold text-main">{currentUser.name}</div>
                    <div className="text-xs text-muted">{currentUser.email}</div>
                    <div className="user-reputation-tag">
                      <CheckCircle2 size={12} className="text-success" />
                      <span>{currentUser.role === 'admin' ? 'ADMIN Account' : 'Member Account'}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Sliders size={16} />
                    <span>Seller Dashboard</span>
                  </Link>

                  <Link
                    to="/dashboard/products"
                    className="dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Layers size={16} />
                    <span>My Product Listings</span>
                  </Link>

                  <Link
                    to="/offers"
                    className="dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Handshake size={16} />
                    <span>Offers & Bargains</span>
                  </Link>

                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ShoppingBag size={16} />
                    <span>Orders & Deals</span>
                  </Link>

                  <div className="dropdown-divider"></div>

                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={onSignOut}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-actions desktop-only">
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in mobile-only">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <Search size={16} className="nav-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="mobile-search-input"
            />
          </form>

          {!currentUser && (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-block" onClick={() => setMobileMenuOpen(false)}>
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                <span>Register Account</span>
              </Link>
            </div>
          )}

          <div className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Explore All Products
            </Link>
            {currentUser && (
              <>
                <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Seller Dashboard
                </Link>
                <Link to="/offers" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Offers & Bargains
                </Link>
                <Link to="/orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Orders & Deals
                </Link>
                <button
                  type="button"
                  className="mobile-nav-link text-danger"
                  style={{ textAlign: 'left', background: 'none', border: 'none', width: '100%' }}
                  onClick={onSignOut}
                >
                  Sign Out ({currentUser.name})
                </button>
              </>
            )}
          </div>

          <div className="mobile-drawer-footer">
            <Link
              to="/dashboard/products/new"
              className="btn btn-primary btn-block"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PlusCircle size={18} />
              <span>List Product to Sell</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
