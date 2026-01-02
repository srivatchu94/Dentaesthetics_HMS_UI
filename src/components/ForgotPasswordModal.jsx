import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    dob: ''
  });
  const [showDOBPicker, setShowDOBPicker] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDateChange = (e) => {
    setFormData(prev => ({ ...prev, dob: e.target.value }));
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

    if (!formData.dob) {
      setError('Date of birth is required');
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
      const response = await fetch('https://localhost:7104/api/Authentication/forgotPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          EmailId: formData.email.trim(),
          Dob: formData.dob
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('✅ Password reset link has been sent to your email address. Please check your inbox.');
        
        // Reset form after 3 seconds and close modal
        setTimeout(() => {
          resetForm();
          onClose();
        }, 3000);
      } else {
        try {
          const errorData = await response.json();
          setError(errorData.message || `Error: ${response.status} - Failed to process request. Please check your email and date of birth.`);
        } catch {
          setError(`Server error (${response.status}). Please ensure your email and DOB are correct.`);
        }
      }
    } catch (error) {
      console.error('Error sending forgot password request:', error);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      dob: ''
    });
    setError('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-teal-200 relative"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-6 right-6 z-50 flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg font-semibold transition-all hover:scale-110 active:scale-95"
          >
            ✕
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔐</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Reset Password
              </h2>
              <p className="text-slate-600 text-sm">
                Enter your email and date of birth to receive a password reset link
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-sm font-semibold"
              >
                {successMessage}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-semibold animate-shake"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📧 Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-teal-50 transition text-slate-900 placeholder-slate-400"
                  disabled={loading}
                />
              </div>

              {/* DOB Field */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📅 Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-teal-50 transition text-slate-900"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">This should match your registered date of birth</p>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <span>→</span>
                  </>
                )}
              </motion.button>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
            </form>

            {/* Footer Info */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                🔒 Your information is secure. We'll only send a reset link to your registered email.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
