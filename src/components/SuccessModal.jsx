import React from 'react';
import { motion } from 'framer-motion';

const SuccessModal = ({ isOpen, onClose, title = "Success!", message = "", itemCount = 0 }) => {
  if (!isOpen) return null;

  const funnyMessages = [
    `🎉 ${itemCount} awesome item${itemCount > 1 ? 's' : ''} just joined the inventory party!`,
    `✨ Holy guacamole! ${itemCount} item${itemCount > 1 ? 's' : ''} added faster than a dental drill! `,
    `🚀 Boom! ${itemCount} item${itemCount > 1 ? 's' : ''} zoomed into the inventory!`,
    `🎯 Nailed it! ${itemCount} item${itemCount > 1 ? 's' : ''} perfectly stored!`,
    `💫 Magic happened! ${itemCount} item${itemCount > 1 ? 's' : ''} materialized in inventory!`,
    `🏆 Champion! ${itemCount} item${itemCount > 1 ? 's' : ''} crushed the inventory system!`,
    `🌟 Shiny! ${itemCount} item${itemCount > 1 ? 's' : ''} now gleaming in the master list!`,
    `⚡ Lightning fast! ${itemCount} item${itemCount > 1 ? 's' : ''} added at warp speed!`,
  ];

  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        {/* Header with success gradient */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-6 text-center border-b border-green-200">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="inline-block mb-3"
          >
            <svg
              className="w-16 h-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>
          <h2 id="success-title" className="text-2xl font-bold text-green-700">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-lg font-semibold text-gray-800 mb-3"
          >
            {randomMessage}
          </motion.p>

          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-gray-600 text-sm"
            >
              {message}
            </motion.p>
          )}

          {/* Animated confetti-like elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 flex justify-center gap-4"
          >
            {['🎊', '✅', '🎉'].map((emoji, idx) => (
              <motion.span
                key={idx}
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  delay: idx * 0.1,
                  repeat: Infinity,
                }}
                className="text-3xl"
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Footer with button */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-medium"
          >
            Awesome!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessModal;
