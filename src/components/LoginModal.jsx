import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, saveAuthToken } from '../services/authService';
import { request } from '../services/apiClient';

const AUTH_BASE_URL = '/Authentication';
const OTP_BASE_URL = '/OtpAuthentication';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [userType, setUserType] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState('verification'); // verification, reset, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [otpState, setOtpState] = useState({
    email: '',
    otp: '',
    step: 'email',
    otpSent: false,
    otpSentTime: null,
    timeRemaining: 0,
    canResend: false
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    mobileNumber: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  // OTP Timer Effect
  useEffect(() => {
    if (!otpState.otpSent || !otpState.otpSentTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - otpState.otpSentTime) / 1000);
      const remaining = Math.max(0, 30 - elapsedSeconds);

      setOtpState(prev => ({
        ...prev,
        timeRemaining: remaining,
        canResend: remaining === 0
      }));

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpState.otpSent, otpState.otpSentTime]);

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    if (otpState.step === 'email') {
      setOtpState(prev => ({ ...prev, email: value }));
    } else {
      setOtpState(prev => ({ ...prev, otp: value.replace(/\D/g, '').slice(0, 6) }));
    }
    setError('');
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({
        username: credentials.username,
        password: credentials.password
      });

      if (response && response.accessToken) {
        saveAuthToken({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || '',
          username: response.user?.username || credentials.username,
          userId: response.user?.userId || '',
          access: response.access || [],
          accessTokenExpiresAt: response.accessTokenExpiresAt || new Date(Date.now() + 3600000).toISOString(),
          refreshTokenExpiresAt: response.refreshTokenExpiresAt || new Date(Date.now() + 86400000).toISOString(),
          inactivityTimeoutMinutes: response.inactivityTimeoutMinutes || 30,
          maxSessionDurationHours: response.maxSessionDurationHours || 8
        });
        
        localStorage.setItem('userType', userType);

        setSuccessMessage(`Welcome ${userType === 'doctor' ? 'Dr.' : 'Admin'} ${credentials.username}! 🎉`);
        
        setTimeout(() => {
          resetForm();
          onClose();
          if (onLoginSuccess) onLoginSuccess();
        }, 1500);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    if (!otpState.email || !otpState.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Call SendOtp API with email and userType
      const response = await request(`${OTP_BASE_URL}/SendOtp`, {
        method: 'POST',
        body: JSON.stringify({ 
          email: otpState.email,
          userType: userType === 'doctor' ? 'Doctor' : 'Admin'
        })
      });
      
      // Set OTP sent state with timestamp
      const now = Date.now();
      setOtpState(prev => ({ 
        ...prev, 
        step: 'otp',
        otpSent: true,
        otpSentTime: now,
        timeRemaining: 30,
        canResend: false
      }));
      
      setSuccessMessage(`✅ OTP sent to ${otpState.email}`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otpState.otp || otpState.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Call VerifyOtp API
      const response = await request(`${OTP_BASE_URL}/VerifyOtp`, {
        method: 'POST',
        body: JSON.stringify({ 
          email: otpState.email, 
          otp: otpState.otp 
        })
      });
      
      // Save auth token from response
      saveAuthToken(response);
      localStorage.setItem('userType', userType);
      localStorage.setItem('email', otpState.email);
      
      setSuccessMessage(`Welcome ${userType === 'doctor' ? 'Doctor' : 'Administrator'}! 🎉`);
      
      setTimeout(() => {
        resetForm();
        onClose();
        if (onLoginSuccess) onLoginSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserType(null);
    setLoginMethod(null);
    setCredentials({ username: '', password: '' });
    setOtpState({ 
      email: '', 
      otp: '', 
      step: 'email',
      otpSent: false,
      otpSentTime: null,
      timeRemaining: 0,
      canResend: false
    });
    setShowForgotPassword(false);
    setForgotPasswordStep('verification');
    setForgotPasswordData({
      mobileNumber: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccessMessage('');
  };

  const handleVerifyForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.mobileNumber.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    try {
      // Call verification API with mobile number
      const response = await request('/Authentication/VerifyMobileForPasswordReset', {
        method: 'POST',
        body: JSON.stringify({ 
          mobileNumber: forgotPasswordData.mobileNumber
        })
      });

      // Show verification code sent message
      setSuccessMessage('✅ Verification code sent to your registered phone number');
      setForgotPasswordStep('reset');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to verify mobile number. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (!forgotPasswordData.newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (forgotPasswordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Call password reset API
      const response = await request('/Authentication/ResetPasswordByMobile', {
        method: 'POST',
        body: JSON.stringify({ 
          mobileNumber: forgotPasswordData.mobileNumber,
          verificationCode: forgotPasswordData.verificationCode,
          newPassword: forgotPasswordData.newPassword
        })
      });

      setForgotPasswordStep('success');
      setSuccessMessage('✅ Password reset successfully!');
      
      setTimeout(() => {
        setShowForgotPassword(false);
        resetForm();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    if (onClose) {
      onClose();
    }
  };

  // User Type Selection
  if (isOpen && !userType) {
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
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700 relative"
          >
            {/* Back/Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              style={{ cursor: 'pointer' }}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← Close
            </button>

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.h1
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2"
                >
                  🏥 DentAesthetics HMS
                </motion.h1>
                <p className="text-gray-300">Select your login type</p>
              </div>

              {/* User Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Doctor Login */}
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => setUserType('doctor')}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-1 overflow-hidden">
                    <div className="relative bg-slate-800 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center group-hover:bg-slate-700 transition">
                      <div className="text-5xl mb-4">👨‍⚕️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Doctor Login</h3>
                      <p className="text-gray-400 text-sm mb-4">Access your patient records</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg group-hover:shadow-lg transition"
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Admin Login */}
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => setUserType('admin')}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-1 overflow-hidden">
                    <div className="relative bg-slate-800 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center group-hover:bg-slate-700 transition">
                      <div className="text-5xl mb-4">👔</div>
                      <h3 className="text-xl font-bold text-white mb-2">Admin Login</h3>
                      <p className="text-gray-400 text-sm mb-4">Manage clinics & staff</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg group-hover:shadow-lg transition"
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Login Method Selection
  if (isOpen && !loginMethod) {
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
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700 relative"
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUserType(null);
              }}
              style={{ cursor: 'pointer' }}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← Back
            </button>

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="text-center mb-8 mt-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Choose Login Method
                </h2>
                <p className="text-gray-400">
                  {userType === 'doctor' ? '👨‍⚕️ Doctor' : '👔 Admin'} Login
                </p>
              </div>

              {/* Method Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Credentials */}
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => setLoginMethod('credentials')}
                  className="group cursor-pointer"
                >
                  <div className={`relative rounded-2xl p-1 overflow-hidden ${
                    userType === 'doctor'
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
                      : 'bg-gradient-to-br from-orange-400 to-red-500'
                  }`}>
                    <div className="relative bg-slate-800 rounded-2xl p-6 text-center h-full group-hover:bg-slate-700 transition">
                      <div className="text-4xl mb-3">📝</div>
                      <h3 className="text-lg font-bold text-white mb-1">Username & Password</h3>
                      <p className="text-gray-400 text-sm mb-3">Quick and secure</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-5 py-2 rounded-lg text-white font-semibold transition text-sm ${
                          userType === 'doctor'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* OTP */}
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => setLoginMethod('otp')}
                  className="group cursor-pointer"
                >
                  <div className={`relative rounded-2xl p-1 overflow-hidden ${
                    userType === 'doctor'
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-500'
                      : 'bg-gradient-to-br from-orange-400 to-red-500'
                  }`}>
                    <div className="relative bg-slate-800 rounded-2xl p-6 text-center h-full group-hover:bg-slate-700 transition">
                      <div className="text-4xl mb-3">📧</div>
                      <h3 className="text-lg font-bold text-white mb-1">Email OTP</h3>
                      <p className="text-gray-400 text-sm mb-3">Email verification</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-5 py-2 rounded-lg text-white font-semibold transition text-sm ${
                          userType === 'doctor'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                        }`}
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Credentials Form
  if (isOpen && loginMethod === 'credentials') {
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
            className={`rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700 relative bg-gradient-to-br ${
              userType === 'doctor'
                ? 'from-blue-950/50 via-slate-900 to-cyan-950/50'
                : 'from-orange-950/50 via-slate-900 to-red-950/50'
            }`}
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoginMethod(null);
              }}
              style={{ cursor: 'pointer' }}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← Back
            </button>

            <div className="relative z-10 p-8 pt-16">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Login</h2>
                <p className="text-gray-400 text-sm">Enter your credentials</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleCredentialsChange}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleCredentialsChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  type="submit"
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    userType === 'doctor'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                  ) : (
                    'Login'
                  )}
                </motion.button>

                {/* Forgot Password Link */}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-center text-sm text-blue-400 hover:text-blue-300 font-medium py-2 transition"
                >
                  🔐 Forgot Password?
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // OTP Form
  if (isOpen && loginMethod === 'otp') {
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
            className={`rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700 relative bg-gradient-to-br ${
              userType === 'doctor'
                ? 'from-blue-950/50 via-slate-900 to-cyan-950/50'
                : 'from-orange-950/50 via-slate-900 to-red-950/50'
            }`}
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (otpState.step === 'otp') {
                  setOtpState(prev => ({ ...prev, step: 'email', otp: '' }));
                } else {
                  setLoginMethod(null);
                }
              }}
              style={{ cursor: 'pointer' }}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← Back
            </button>

            <div className="relative z-10 p-8 pt-16">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {otpState.step === 'email' ? 'Enter Email Address' : 'Enter OTP'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {otpState.step === 'email' ? 'We\'ll send you a verification code' : 'Check your email'}
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm font-semibold"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-200 rounded-lg text-sm font-semibold"
                  >
                    ✅ {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Step */}
              {otpState.step === 'email' && (
                <form onSubmit={handleRequestOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">📧 Email Address</label>
                    <p className="text-xs text-gray-500">We'll send a 6-digit verification code to this email</p>
                  </div>

                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    name="email"
                    value={otpState.email}
                    onChange={handleOtpChange}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !otpState.email.includes('@')}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      userType === 'doctor'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    } ${(!otpState.email.includes('@') || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⏳
                      </motion.span>
                    ) : (
                      '📤 Send Verification Code'
                    )}
                  </motion.button>

                  {/* Info Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-500/20 border border-blue-500 rounded-lg"
                  >
                    <p className="text-xs text-blue-200 text-center">
                      💡 Check your email (including spam folder) for the verification code
                    </p>
                  </motion.div>
                </form>
              )}

              {/* OTP Step */}
              {otpState.step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Sent Confirmation */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-500/20 border-2 border-blue-500 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-300 mb-1">
                      📧 <span className="font-semibold">OTP sent to</span>
                    </p>
                    <p className="text-base font-bold text-blue-400">{otpState.email}</p>
                    <p className="text-xs text-gray-400 mt-2">Check your email for the verification code</p>
                  </motion.div>

                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Enter Verification Code</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      name="otp"
                      value={otpState.otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      maxLength="6"
                      className="w-full px-4 py-4 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition text-center text-3xl tracking-widest font-bold"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">{otpState.otp.length}/6 digits</p>
                      {otpState.otp.length === 6 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-green-400 font-semibold"
                        >
                          ✅ Ready to verify
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* Timer and Resend Button */}
                  <div className="space-y-3">
                    {otpState.timeRemaining > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-amber-500/20 border border-amber-500 rounded-lg text-center"
                      >
                        <p className="text-xs text-amber-300 mb-1">Can request new OTP in</p>
                        <motion.p
                          key={otpState.timeRemaining}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-2xl font-bold text-amber-400"
                        >
                          {otpState.timeRemaining}s
                        </motion.p>
                      </motion.div>
                    )}

                    {otpState.canResend && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setOtpState(prev => ({ 
                            ...prev, 
                            step: 'email',
                            otp: '',
                            otpSent: false,
                            otpSentTime: null,
                            timeRemaining: 0,
                            canResend: false
                          }));
                          setError('');
                        }}
                        className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        🔄 Resend OTP
                      </motion.button>
                    )}
                  </div>

                  {/* Verify Button */}
                  <motion.button
                    whileHover={{ scale: otpState.otp.length === 6 ? 1.05 : 1 }}
                    whileTap={{ scale: otpState.otp.length === 6 ? 0.95 : 1 }}
                    disabled={loading || otpState.otp.length !== 6}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      userType === 'doctor'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    } ${otpState.otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''} ${loading ? 'opacity-70' : ''}`}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⏳
                      </motion.span>
                    ) : (
                      '✓ Verify & Login'
                    )}
                  </motion.button>

                  {/* Edit Email Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpState(prev => ({ 
                        ...prev, 
                        step: 'email',
                        otp: '',
                        otpSent: false,
                        otpSentTime: null,
                        timeRemaining: 0,
                        canResend: false
                      }));
                      setError('');
                    }}
                    className="w-full text-sm text-gray-400 hover:text-gray-200 transition font-medium py-2"
                  >
                    ← Change email address
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Forgot Password Modal
  if (showForgotPassword) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowForgotPassword(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700 relative"
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{ cursor: 'pointer' }}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← Back
            </button>

            <div className="relative z-10 p-8 pt-16">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">🔐 Reset Password</h2>
                <p className="text-gray-400 text-sm">Recover your account access</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm font-semibold"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-200 rounded-lg text-sm font-semibold"
                  >
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verification Step */}
              {forgotPasswordStep === 'verification' && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">📱 Mobile Number</label>
                    <p className="text-xs text-gray-500 mb-2">Enter the mobile number registered with your account</p>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="tel"
                      value={forgotPasswordData.mobileNumber}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, mobileNumber: e.target.value });
                        setError('');
                      }}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading || !forgotPasswordData.mobileNumber.trim()}
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Verifying...' : '📤 Send Verification Code'}
                  </motion.button>
                </form>
              )}

              {/* Password Reset Step */}
              {forgotPasswordStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Verification Code</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="text"
                      value={forgotPasswordData.verificationCode}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, verificationCode: e.target.value });
                        setError('');
                      }}
                      placeholder="Enter code from SMS"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="password"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value });
                        setError('');
                      }}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm Password</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="password"
                      value={forgotPasswordData.confirmPassword}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, confirmPassword: e.target.value });
                        setError('');
                      }}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Resetting...' : '✅ Reset Password'}
                  </motion.button>
                </form>
              )}

              {/* Success Step */}
              {forgotPasswordStep === 'success' && (
                <div className="text-center space-y-4 py-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-6xl"
                  >
                    ✅
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-400">Password Reset Successfully!</h3>
                  <p className="text-gray-400">You can now login with your new password</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default LoginModal;
