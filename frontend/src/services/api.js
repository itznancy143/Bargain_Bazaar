/**
 * API Helper Service for Bargain Bazaar
 * Centralized fetch client communicating with Node/Express backend at http://localhost:5001
 */

const API_BASE_URL = 'http://localhost:5001';

/**
 * Perform an authenticated API request using native fetch()
 * @param {string} endpoint - API route (e.g. '/api/auth/me')
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>} - JSON response
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || (response.status === 401 ? 'Not authorized' : 'Request failed');
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Distinguish network failures from backend error responses
    if (!err.status) {
      const networkError = new Error('Unable to connect to the server. Please ensure the backend is running.');
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw err;
  }
};

export default apiFetch;
