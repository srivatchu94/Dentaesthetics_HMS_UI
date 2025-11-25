import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ error, resetError }) => {
  const navigate = useNavigate();

  const funnyMessages = [
    { emoji: "🦷", title: "Oops! Tooth Fairy Went on Vacation!", message: "Looks like our dental magic took a coffee break. We're filling the cavity now!" },
    { emoji: "🤖", title: "404: Teeth Not Found!", message: "Even our best dentists couldn't locate this page. Maybe it needs braces to stay in place?" },
    { emoji: "😅", title: "Something Went Wrong!", message: "Don't worry, it's not as bad as forgetting to floss! We're already on it." },
    { emoji: "🚑", title: "Emergency Dental Alert!", message: "Our app needs a root canal! Stay calm while we fix this cavity." },
    { emoji: "🎪", title: "The App Circus Left Town!", message: "Our digital performers took an unexpected break. They'll be back after intermission!" },
    { emoji: "🌪️", title: "Hurricane Hit the Code!", message: "A storm passed through our servers. We're cleaning up the mess now!" }
  ];

  const randomError = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  const handleGoHome = () => {
    if (resetError) resetError();
    navigate('/');
  };

  const handleReload = () => {
    if (resetError) resetError();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-10 right-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, 50, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200 rounded-full blur-2xl"
      />

      {/* Main Error Card */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative z-10"
      >
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-8 text-center relative overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-9xl mb-4"
          >
            {randomError.emoji}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {randomError.title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/90"
          >
            {randomError.message}
          </motion.p>

          {/* Floating particles */}
          <motion.div
            animate={{ y: [-20, -40, -20], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="absolute top-20 left-20 text-4xl"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ y: [-20, -40, -20], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute top-32 right-32 text-4xl"
          >
            💫
          </motion.div>
          <motion.div
            animate={{ y: [-20, -40, -20], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-32 text-4xl"
          >
            ⭐
          </motion.div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Error Details (if provided) */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.4 }}
              className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
            >
              <p className="text-sm text-red-800 font-mono">
                <strong>Technical Details:</strong> {error.message || error.toString()}
              </p>
            </motion.div>
          )}

          {/* Helpful Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 What you can do:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Try refreshing the page - sometimes that's all it takes!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Check your internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Go back to the home page and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>If the problem persists, contact our support team</span>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReload}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
            >
              🔄 Refresh Page
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoHome}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
            >
              🏠 Go to Home
            </motion.button>
          </motion.div>

          {/* Fun Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-500">
              😊 Don't worry, our digital dentists are working on it!
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
