import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Handshake, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useApp } from '../../context/AppContext';
import './Auth.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useApp();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.registeredMessage || '');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const { email, password } = formData;

    // 1. Client validation
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // 2. Call backend login API
      const res = await authService.login(email.trim(), password);

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate(location.state?.from || '/');
        }, 600);
      } else {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMessage('Unable to connect to the server. Please ensure the backend is running at http://localhost:5001.');
      } else {
        setErrorMessage(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Handshake size={14} />
            <span>Bargain Bazaar</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to negotiate, buy, and track your active deals.</p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error animate-fade-in">
            <AlertCircle size={18} className="auth-alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="auth-alert auth-alert-success animate-fade-in">
            <CheckCircle2 size={18} className="auth-alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet?
          <Link to="/register" className="auth-link">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
