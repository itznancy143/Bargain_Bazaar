import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Initialize currentUser from localStorage
  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [wishlist, setWishlist] = useState(['prod-101', 'prod-106']);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Counter-offer received!',
      message: 'Aarav counter-offered ₹72,000 on iPhone 15 Pro.',
      time: '10 mins ago',
      read: false,
      type: 'offer',
      link: '/negotiation/prod-101'
    },
    {
      id: 2,
      title: 'New offer on your listing',
      message: 'Buyer offered ₹80,000 for MacBook Air M2.',
      time: '1 hour ago',
      read: false,
      type: 'offer',
      link: '/negotiation/prod-102'
    },
    {
      id: 3,
      title: 'Price Drop Alert',
      message: 'Sony WH-1000XM5 from your wishlist dropped by ₹1,000!',
      time: 'Yesterday',
      read: true,
      type: 'alert',
      link: '/products/prod-103'
    }
  ]);

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

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        unreadNotificationsCount: notifications.filter((n) => !n.read).length,
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
