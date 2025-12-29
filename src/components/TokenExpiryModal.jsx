import React from 'react';
import { motion } from 'framer-motion';

const TokenExpiryModal = ({ isOpen, onLogin, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-expiry-title"
        aria-describedby="token-expiry-description"
      >
        {/* Header with close button */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Alert Circle Icon */}
              <svg
                className="text-red-600 w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 id="token-expiry-title" className="text-lg font-semibold text-gray-800">
                Session Expired
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p
            id="token-expiry-description"
            className="text-gray-700 mb-4 leading-relaxed"
          >
            Your login session has expired due to inactivity or your session timed out. 
            For security purposes, you need to log in again to continue working.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Good news:</strong> Your data is safe and you'll be returned to where you left off after logging in.
            </p>
          </div>
        </div>

        {/* Footer with action button */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onLogin}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 transition font-medium flex items-center justify-center gap-2"
          >
            {/* Login Icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Log In Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TokenExpiryModal;
