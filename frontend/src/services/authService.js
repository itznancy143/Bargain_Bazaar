import { apiFetch } from './api.js';

/**
 * Authentication Service for Bargain Bazaar
 * Manages JWT tokens, localStorage session persistence, and backend auth API communication
 */
export const authService = {
  /**
   * Register a new user account
   * @param {string} name 
   * @param {string} email 
   * @param {string} password 
   * @param {string} role 
   * @returns {Promise<{ success: boolean, message: string, user: object, token: string }>}
   */
  async register(name, email, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    return data;
  },

  /**
   * Login user with credentials and store JWT token
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ success: boolean, token: string, user: object }>}
   */
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  /**
   * Verify and get currently authenticated user from MongoDB Atlas
   * @returns {Promise<object|null>}
   */
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const data = await apiFetch('/api/auth/me', {
        method: 'GET'
      });

      if (data && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (err) {
      // If token is expired or unauthorized, clean up storage
      if (err.status === 401) {
        this.logout();
      }
      return null;
    }
  },

  /**
   * Log out user by clearing storage
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get JWT token from storage
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get cached user from storage
   * @returns {object|null}
   */
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;
