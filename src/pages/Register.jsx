import React, { useState } from 'react';
import { registerUser } from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    emailid: '',
    mobileNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordMatchWarning, setPasswordMatchWarning] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length > 256) {
      errors.username = 'Username must not exceed 256 characters';
    }

    if (!formData.emailid.trim()) {
      errors.emailid = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailid)) {
      errors.emailid = 'Please enter a valid email address';
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/[-\s]/g, ''))) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
      // Real-time password match check
      if (value && formData.password && value !== formData.password) {
        setPasswordMatchWarning('⚠️ Passwords do not match!');
      } else {
        setPasswordMatchWarning('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
      // Check password match when password changes
      if (name === 'password' && confirmPassword && value !== confirmPassword) {
        setPasswordMatchWarning('⚠️ Passwords do not match!');
      } else if (name === 'password' && confirmPassword && value === confirmPassword) {
        setPasswordMatchWarning('');
      }
    }
    // Clear validation error for this field
    setValidationErrors({ ...validationErrors, [name]: undefined });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser(formData);
      setSuccess(true);
      console.log('Registration successful:', response);
      
      // Reset form
      setFormData({ username: '', password: '', emailid: '', mobileNumber: '' });
      setConfirmPassword('');
      setPasswordMatchWarning('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Username already exists. Please choose a different username.');
      } else if (err.response?.status === 400) {
        setError('Invalid input. Please check your username and password.');
      } else {
        setError('Registration failed. Please try again.');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🦷 Dentaesthetics HMS</h1>
          <p className="text-blue-100">Create Your Account</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {success ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="text-green-800 font-bold text-lg">Account Created Successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Please wait, redirecting to login page...</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                  <p className="text-red-800 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              {/* Username Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                    validationErrors.username
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                  }`}
                  placeholder="Enter your username"
                />
                {validationErrors.username && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="emailid"
                  value={formData.emailid}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                    validationErrors.emailid
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                  }`}
                  placeholder="your.email@example.com"
                />
                {validationErrors.emailid && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {validationErrors.emailid}
                  </p>
                )}
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                    validationErrors.mobileNumber
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                  }`}
                  placeholder="1234567890"
                  maxLength={10}
                />
                {validationErrors.mobileNumber && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {validationErrors.mobileNumber}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                    validationErrors.password
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                  }`}
                  placeholder="Enter your password"
                />
                {validationErrors.password && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                    validationErrors.confirmPassword || passwordMatchWarning
                      ? 'border-red-500 focus:ring-red-300'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {passwordMatchWarning && (
                  <p className="text-yellow-600 font-semibold text-sm mt-1 flex items-center gap-1 animate-pulse">
                    {passwordMatchWarning}
                  </p>
                )}
                {validationErrors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span> {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🚀 Sign Up
                  </span>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-blue-600 font-semibold hover:text-blue-800 hover:underline">
                    Login here
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
