import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Initialize currentUser from localStorage
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [wishlist, setWishlist] = useState(['prod-101', 'prod-106']);
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent database-backed notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  // Fetch full user notification feed
  const fetchNotifications = useCallback(async () => {
    if (!authService.getToken()) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setNotificationsError('');
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const data = await notificationService.getMyNotifications({ limit: 40 });
      if (data && data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(
          typeof data.unreadCount === 'number'
            ? data.unreadCount
            : (data.notifications || []).filter((n) => !n.read).length
        );
      }
    } catch (err) {
      setNotificationsError('Unable to load notifications. Please try again.');
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch just the unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!authService.getToken()) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadNotificationsCount(count);
    } catch (err) {
      console.warn('Failed to fetch unread notification count:', err.message);
    }
  }, []);

  // Verify stored token with backend /api/auth/me on initial app load
  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        if (authService.getToken()) {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session verification notice:', err.message);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  // Sync notifications whenever authenticated user session changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setNotificationsError('');
    }
  }, [currentUser, fetchNotifications]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setNotifications([]);
    setUnreadNotificationsCount(0);
    setNotificationsError('');
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  // Mark single notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;

    // Optimistic UI state update
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId || n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await notificationService.markAsRead(notificationId);
      if (res && typeof res.unreadCount === 'number') {
        setUnreadNotificationsCount(res.unreadCount);
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    // Optimistic UI state update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotificationsCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        handleLogout,
        authLoading,
        isAuthenticated: !!currentUser,
        wishlist,
        toggleWishlist,
        isWishlisted,
        wishlistCount: wishlist.length,
        searchQuery,
        setSearchQuery,
        notifications,
        unreadNotificationsCount,
        notificationsLoading,
        notificationsError,
        fetchNotifications,
        fetchUnreadCount,
        markNotificationAsRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
