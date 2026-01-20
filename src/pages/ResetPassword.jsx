import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE_URL = (import.meta)?.env?.VITE_API_BASE_URL || 'https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  const resetToken = searchParams.get('token');
  const userEmail = searchParams.get('email');
  const demoMode = searchParams.get('demo') === 'true'; // Enable demo mode with ?demo=true

  useEffect(() => {
    // No token validation needed - endpoint is [AllowAnonymous]
    // Just set the form as valid and ready
    setTokenValid(true);
    
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  // Countdown timer effect
  useEffect(() => {
    if (!resetSuccess) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resetSuccess, navigate]);

  const validateToken = async () => {
    if (!resetToken || !userEmail) {
      setError('Invalid reset link. Please request a new password reset.');
      setTokenValid(false);
      return;
    }

    try {
      // Verify token validity with backend
      const response = await fetch(`${API_BASE_URL}/Authentication/ValidateResetToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          email: userEmail
        })
      });

      if (response.ok) {
        setTokenValid(true);
        setFormData(prev => ({ ...prev, email: userEmail }));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Reset link is invalid or has expired. Please request a new one.');
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Backend is not available for token validation. Please ensure the API is running on ' + API_BASE_URL + '/Authentication/ValidateResetToken. For testing, use ?demo=true in the URL.');
      setTokenValid(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.newPassword.trim()) {
      setError('New password is required');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(formData.newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.newPassword)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword)) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/Authentication/saveresetpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId: formData.email,
          password: formData.newPassword
        })
      });

      if (response.ok) {
        setResetSuccess(true);
        setSuccessMessage('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Success Page
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-white via-green-50 to-teal-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-green-300 p-8"
        >
          {/* Success Animation */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-6"
            >
              <motion.span
                animate={{ scale: [0, 1] }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl"
              >
                ✓
              </motion.span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3"
            >
              Success!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-700 font-semibold text-lg mb-2"
            >
              Your password has been reset successfully
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-sm mb-8"
            >
              You can now log in with your new password
            </motion.p>
          </div>

          {/* Email Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8 text-center"
          >
            <p className="text-xs text-blue-600 font-semibold mb-1">Email</p>
            <p className="text-slate-800 font-semibold">{formData.email}</p>
          </motion.div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6 p-4 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl text-center border border-teal-300"
          >
            <p className="text-slate-700 font-semibold mb-2">Redirecting to Login</p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="inline-block"
            >
              <span className="text-4xl font-bold text-teal-600">{countdown}</span>
            </motion.div>
            <p className="text-xs text-slate-600 mt-2">Automatically redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
          </motion.div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Go to Login Now
              <span>→</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold py-3 rounded-xl transition-all"
            >
              Return to Home
            </motion.button>
          </div>

          {/* Success Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 pt-6 border-t border-slate-200"
          >
            <p className="text-xs text-slate-600 font-semibold mb-3">💡 Next Steps:</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold mt-0.5">1</span>
                <span>Go to login page and sign in with your email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold mt-0.5">2</span>
                <span>Use your new password to authenticate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold mt-0.5">3</span>
                <span>Your account is now secure and ready to use</span>
              </li>
            </ul>
          </motion.div>

          {/* Security Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-6 border-t border-slate-200"
          >
            <p className="text-xs text-slate-500 text-center">
              🔒 This success page will automatically close. Please keep your new password secure and do not share it with anyone.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-teal-200"
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🔐
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-slate-600 text-sm mb-1">Create a new secure password</p>
            <p className="text-slate-500 text-xs">{formData.email}</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-sm font-semibold text-center"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-semibold animate-shake"
            >
              {error}
            </motion.div>
          )}

          {/* Password Requirements */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-3">Password Requirements:</p>
            <ul className="space-y-2 text-xs">
              <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                <span className="text-lg">{formData.newPassword.length >= 8 ? '✓' : '○'}</span>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                <span className="text-lg">{/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                One uppercase letter (A-Z)
              </li>
              <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                <span className="text-lg">{/[a-z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                One lowercase letter (a-z)
              </li>
              <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.newPassword) ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                <span className="text-lg">{/[0-9]/.test(formData.newPassword) ? '✓' : '○'}</span>
                One number (0-9)
              </li>
              <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                <span className="text-lg">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? '✓' : '○'}</span>
                One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📧 Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-teal-50 transition text-slate-900 placeholder-slate-400"
                disabled={loading}
                required
              />
              <p className="text-xs text-slate-500 mt-1">This must be the email associated with your account</p>
            </div>

            {/* New Password Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                🔑 New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-teal-50 transition text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-500 hover:text-slate-700 text-xl"
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ✓ Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-teal-50 transition text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3 text-slate-500 hover:text-slate-700 text-xl"
                  disabled={loading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !formData.email.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim()}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                  <span>→</span>
                </>
              )}
            </motion.button>

            {/* Back to Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate('/login')}
              disabled={loading}
              className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              Back to Login
            </motion.button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              🔒 Your password is encrypted and secure. Never share this link with anyone.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

