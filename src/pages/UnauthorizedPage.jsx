import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const funnyMessages = [
    { 
      emoji: "🚫", 
      title: "Whoa There, Partner!", 
      message: "Looks like you're trying to enter the VIP dental lounge without a backstage pass!",
      subtitle: "This area is off-limits for your current role. Need access? Talk to your admin!"
    },
    { 
      emoji: "🔒", 
      title: "Access Denied - Nice Try Though!", 
      message: "This digital door is locked tighter than a tooth with a crown!",
      subtitle: "You don't have permission to access this area. Contact your administrator if you need access."
    },
    { 
      emoji: "🛑", 
      title: "Stop Right There!", 
      message: "Our security guard (a very friendly but firm robot) says NO!",
      subtitle: "Your current role doesn't have clearance for this section. Ask your admin for the right permissions."
    },
    { 
      emoji: "👮", 
      title: "Unauthorized Access Detected!", 
      message: "The dental police are on patrol and noticed you wandered into restricted territory!",
      subtitle: "This feature requires special privileges. Please contact your system administrator."
    },
    { 
      emoji: "🎭", 
      title: "Wrong Role, Wrong Show!", 
      message: "You've got a ticket for the comedy show, but this is the opera house!",
      subtitle: "Your user role doesn't grant access here. Need different permissions? Talk to admin!"
    },
    { 
      emoji: "🚧", 
      title: "Under Construction... For You!", 
      message: "This area is still being built... or you just don't have the hard hat!",
      subtitle: "Access restricted based on your role. Contact your administrator to request access."
    }
  ];

  const randomError = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleContactSupport = () => {
    // You can implement your support contact logic here
    alert("📧 Please contact your system administrator for access permissions.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-20 w-48 h-48 bg-indigo-200 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/3 w-32 h-32 bg-purple-200 rounded-full blur-2xl"
      />

      {/* Main Unauthorized Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative z-10"
      >
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-8 text-center relative overflow-hidden">
          {/* Animated lock icon */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
            className="text-xl text-white/90 mb-2"
          >
            {randomError.message}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/80 italic"
          >
            {randomError.subtitle}
          </motion.p>

          {/* Subtle wave animation */}
          <motion.div
            animate={{ x: [0, 100] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-repeating-linear-gradient opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.3) 20px, transparent 20px, transparent 40px)'
            }}
          />
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Status Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔒</span>
              <p className="text-lg font-bold text-blue-800">
                HTTP 403 - Forbidden
              </p>
            </div>
            <p className="text-sm text-blue-700 ml-12">
              You don't have the necessary permissions to access this resource.
            </p>
          </motion.div>

          {/* What You Can Do */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 What you can do:</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span><strong>Contact your administrator</strong> - They can grant you the necessary permissions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span><strong>Go back</strong> - Return to the previous page and try a different action</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span><strong>Go home</strong> - Visit the homepage to access allowed features</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span><strong>Check your role</strong> - Make sure you're logged in with the right account</span>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoBack}
              className="py-4 px-6 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:shadow-xl"
            >
              ⬅️ Go Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoHome}
              className="py-4 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:shadow-xl"
            >
              🏠 Go Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContactSupport}
              className="py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:shadow-xl"
            >
              📧 Contact Admin
            </motion.button>
          </motion.div>

          {/* Fun Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-500">
              🔐 Remember: With great power comes great responsibility... and proper permissions!
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
