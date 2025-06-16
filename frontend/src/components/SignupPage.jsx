import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignupPage.css';
import { apiClient, API_ENDPOINTS } from '../config/api';
import GoogleLoginButton from './GoogleLoginButton';
import authImage from '../assets/auth_image.png';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🚀 Starting registration submission...");
    
    if (!validateForm()) {
      console.warn("❌ Form validation failed");
      return;
    }

    console.log("✅ Form validation passed");
    setLoading(true);
    
    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName
      };
      
      console.log("📤 Sending signup request to:", API_ENDPOINTS.AUTH.REGISTER);
      console.log("📦 Request data:", {
        ...requestData,
        password: '********' // Hide password in logs
      });
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, requestData);

      console.log("📥 Registration response received:", response.data);

      // Always show email activation message
      setErrors({ 
        success: `Registration successful! Please check your email (${formData.email}) to activate your account.` 
      });
      
      // Clear the form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      console.log("✅ Registration completed successfully");
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Handle validation errors (like duplicate email)
        if (responseData.email && Array.isArray(responseData.email)) {
          errorMessage = responseData.email[0]; // "user with this email already exists."
          // Make it more user-friendly
          if (errorMessage.toLowerCase().includes('already exists')) {
            errorMessage = 'A user with this email address already exists.';
          }
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else {
          // Handle other field validation errors
          const firstError = Object.values(responseData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
      console.log("🏁 Registration process completed");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-layout">
        {/* Left side - Image */}
        <div className="signup-image-section">
          <img 
            src={authImage}
            alt="Coursiva - Student studying with laptop and notebook" 
            className="signup-image"
          />
        </div>

        {/* Right side - Signup Form */}
        <div className="signup-form-section">
          <div className="signup-card">
            <div className="signup-header">
              <h1>Create Account</h1>
              <p>Join us to start your learning journey</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              {errors.general && (
                <div className="error-message general-error">
                  {errors.general}
                </div>
              )}
              
              {errors.success && (
                <div className="success-message">
                  {errors.success}
                </div>
              )}

              {/* Google Login Button */}
              <GoogleLoginButton text="Sign up with Google" />
              
              {/* Divider */}
              <div className="divider">
                <span className="divider-text">or</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="John"
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <span className="error-message">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Doe"
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <span className="error-message">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="me@example.com"
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  disabled={loading}
                />
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="signup-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 