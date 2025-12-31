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
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    userId: '',
    selectedQuestions: [null, null, null],
    answers: ['', '', ''],
    newPassword: '',
    confirmPassword: '',
    username: ''
  });
  const [allUsers, setAllUsers] = useState([]);
  const [availableSecurityQuestions] = useState([
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "In which city were you born?",
    "What was the make and model of your first car?",
    "What is your favorite book?",
    "What was your first job?",
    "What is the name of the street you grew up on?"
  ]);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

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
      userId: '',
      selectedQuestions: [null, null, null],
      answers: ['', '', ''],
      newPassword: '',
      confirmPassword: '',
      username: ''
    });
    setError('');
    setSuccessMessage('');
  };

  // Load all users when forgot password modal opens
  useEffect(() => {
    if (showForgotPassword && forgotPasswordStep === 'verification') {
      loadAllUsers();
    }
  }, [showForgotPassword]);

  const loadAllUsers = async () => {
    try {
      const response = await fetch('https://localhost:7104/api/User/GetAllUsers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // OTP countdown effect
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

        // Close modal and redirect immediately on successful authentication
        resetForm();
        onClose();
        if (onLoginSuccess) onLoginSuccess();
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
      await request(`${OTP_BASE_URL}/SendOtp`, {
        method: 'POST',
        body: JSON.stringify({
          email: otpState.email,
          userType: userType === 'doctor' ? 'Doctor' : 'Admin'
        })
      });

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
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
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
      const response = await request(`${OTP_BASE_URL}/VerifyOtp`, {
        method: 'POST',
        body: JSON.stringify({
          email: otpState.email,
          otp: otpState.otp,
          userType: userType === 'doctor' ? 'Doctor' : 'Administrator'
        })
      });

      saveAuthToken(response);
      localStorage.setItem('userType', userType);
      localStorage.setItem('email', otpState.email);

      // Close modal and redirect immediately on successful authentication
      resetForm();
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Return list of questions excluding ones already chosen in other slots
  const getAvailableQuestions = (currentIndex) => {
    const selected = forgotPasswordData.selectedQuestions;
    return availableSecurityQuestions
      .map((question, idx) => ({ id: idx, question }))
      .filter((q) => {
        const usedElsewhere = selected.some(
          (sel, selIdx) => sel !== null && selIdx !== currentIndex && sel === q.id
        );
        return !usedElsewhere;
      });
  };

  const handleSelectQuestion = (questionIndex, selectedQuestion) => {
    const newSelected = [...forgotPasswordData.selectedQuestions];
    newSelected[questionIndex] = selectedQuestion;
    setForgotPasswordData(prev => ({
      ...prev,
      selectedQuestions: newSelected
    }));
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...forgotPasswordData.answers];
    newAnswers[questionIndex] = answer;
    setForgotPasswordData(prev => ({
      ...prev,
      answers: newAnswers
    }));
  };

  const handleVerifyForgotPassword = async (e) => {
    e.preventDefault();

    // Step 1: Validate security answers
    if (forgotPasswordStep === 'verification') {
      if (!forgotPasswordData.userId) {
        setError('Please select a user ID');
        return;
      }

      // Check if all 3 questions are selected and answered
      if (forgotPasswordData.selectedQuestions.some(q => q === null)) {
        setError('Please select all 3 security questions');
        return;
      }

      if (forgotPasswordData.answers.some(a => !a.trim())) {
        setError('Please answer all security questions');
        return;
      }

      setForgotPasswordLoading(true);
      try {
        // Get username from selected user
        const selectedUser = allUsers.find(u => u.userId === parseInt(forgotPasswordData.userId));
        if (!selectedUser) {
          setError('User not found');
          return;
        }

        // Validate answers with backend
        const response = await fetch('https://localhost:7104/api/Authentication/VerifySecurityAnswers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            userId: parseInt(forgotPasswordData.userId),
            securityAnswers: forgotPasswordData.selectedQuestions.map((question, index) => ({
              question: question,
              answer: forgotPasswordData.answers[index]
            }))
          })
        });

        if (response.ok) {
          setForgotPasswordData(prev => ({
            ...prev,
            username: selectedUser.email || selectedUser.username
          }));
          setForgotPasswordStep('reset');
          setError('');
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Security answers verification failed');
        }
      } catch (error) {
        console.error('Error verifying security answers:', error);
        setError('Error verifying security answers. Please try again.');
      } finally {
        setForgotPasswordLoading(false);
      }
    }
    // Step 2: Reset password
    else if (forgotPasswordStep === 'reset') {
      if (!forgotPasswordData.newPassword.trim()) {
        setError('Please enter a new password');
        return;
      }

      if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (forgotPasswordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setForgotPasswordLoading(true);
      try {
        const response = await fetch('https://localhost:7104/api/Authentication/ResetPassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            userId: parseInt(forgotPasswordData.userId),
            newPassword: forgotPasswordData.newPassword
          })
        });

        if (response.ok) {
          setForgotPasswordStep('success');
          setError('');
          setSuccessMessage('✅ Password reset successfully!');
          setTimeout(() => {
            resetForgotPassword();
            setShowForgotPassword(false);
          }, 2000);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to reset password');
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        setError('Error resetting password. Please try again.');
      } finally {
        setForgotPasswordLoading(false);
      }
    }
  };

  const resetForgotPassword = () => {
    setForgotPasswordStep('verification');
    setForgotPasswordData({
      userId: '',
      selectedQuestions: [null, null, null],
      answers: ['', '', ''],
      newPassword: '',
      confirmPassword: '',
      username: ''
    });
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

  // Forgot Password Modal (always prioritize when triggered)
  if (isOpen && showForgotPassword) {
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

              {/* Verification Step - Security Questions */}
              {forgotPasswordStep === 'verification' && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-6">
                  {/* User ID Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">👤 Select User ID</label>
                    <p className="text-xs text-gray-500 mb-2">Select your username to verify security questions</p>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={forgotPasswordData.userId}
                      onChange={(e) => {
                        const selected = allUsers.find(u => u.userId === e.target.value);
                        setForgotPasswordData({
                          ...forgotPasswordData,
                          userId: e.target.value,
                          username: selected?.username || ''
                        });
                        setError('');
                      }}
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
                    >
                      <option value="">-- Select User ID --</option>
                      {allUsers.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  {/* Security Questions */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-300 mb-4">🔐 Answer 3 Security Questions</p>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Question {index + 1}</label>
                        <motion.select
                          whileFocus={{ scale: 1.02 }}
                          value={forgotPasswordData.selectedQuestions[index] || ''}
                          onChange={(e) => handleSelectQuestion(index, parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none transition mb-2"
                        >
                          <option value="">-- Select Question {index + 1} --</option>
                          {getAvailableQuestions(index).map(q => (
                            <option key={q.id} value={q.id}>
                              {q.question}
                            </option>
                          ))}
                        </motion.select>

                        {forgotPasswordData.selectedQuestions[index] !== null && (
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="text"
                            value={forgotPasswordData.answers[index]}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            placeholder={`Answer to question ${index + 1}`}
                            className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      forgotPasswordLoading ||
                      !forgotPasswordData.userId ||
                      forgotPasswordData.selectedQuestions.some(q => q === null) ||
                      forgotPasswordData.answers.some(a => !a.trim())
                    }
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? '⏳ Verifying Answers...' : '✅ Verify Answers'}
                  </motion.button>
                </form>
              )}

              {/* Password Reset Step */}
              {forgotPasswordStep === 'reset' && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-6">
                  <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-blue-300">
                      ✓ Resetting password for: <span className="font-bold text-blue-200">{forgotPasswordData.username}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">🔑 New Password</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="password"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value });
                        setError('');
                      }}
                      placeholder="Enter new password (minimum 6 characters)"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">🔐 Confirm Password</label>
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
                    disabled={
                      forgotPasswordLoading ||
                      !forgotPasswordData.newPassword ||
                      !forgotPasswordData.confirmPassword
                    }
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? '⏳ Resetting...' : '🚀 Reset Password'}
                  </motion.button>
                </form>
              )}

              {/* Success Step */}
              {forgotPasswordStep === 'success' && (
                <div className="text-center space-y-4 py-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-6xl"
                  >
                    ✅
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-400">Password Reset Successfully!</h3>
                  <p className="text-gray-400">Your password has been securely updated.</p>
                  <p className="text-sm text-gray-500">The login dialog will close in a moment...</p>
                </div>
              )}
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
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleCredentialsChange}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/><path d="M15.171 13.576l1.414 1.414A10.015 10.015 0 0019.542 10c-1.274-4.057-5.064-7-9.542-7a9.958 9.958 0 00-2.037.222l1.914 1.914A4.002 4.002 0 0115.171 13.576z"/></svg>
                      )}
                    </button>
                  </div>
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

              {/* Verification Step - Security Questions */}
              {forgotPasswordStep === 'verification' && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-6">
                  {/* User ID Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">👤 Select User ID</label>
                    <p className="text-xs text-gray-500 mb-2">Select your username to verify security questions</p>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={forgotPasswordData.userId}
                      onChange={(e) => {
                        const selected = allUsers.find(u => u.userId === e.target.value);
                        setForgotPasswordData({
                          ...forgotPasswordData,
                          userId: e.target.value,
                          username: selected?.username || ''
                        });
                        setError('');
                      }}
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition"
                    >
                      <option value="">-- Select User ID --</option>
                      {allUsers.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </motion.select>
                  </div>

                  {/* Security Questions */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-300 mb-4">🔐 Answer 3 Security Questions</p>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Question {index + 1}</label>
                        <motion.select
                          whileFocus={{ scale: 1.02 }}
                          value={forgotPasswordData.selectedQuestions[index] || ''}
                          onChange={(e) => handleSelectQuestion(index, parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none transition mb-2"
                        >
                          <option value="">-- Select Question {index + 1} --</option>
                          {getAvailableQuestions(index).map(q => (
                            <option key={q.id} value={q.id}>
                              {q.question}
                            </option>
                          ))}
                        </motion.select>

                        {forgotPasswordData.selectedQuestions[index] !== null && (
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="text"
                            value={forgotPasswordData.answers[index]}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            placeholder={`Answer to question ${index + 1}`}
                            className="w-full px-4 py-2 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      forgotPasswordLoading ||
                      !forgotPasswordData.userId ||
                      forgotPasswordData.selectedQuestions.some(q => q === null) ||
                      forgotPasswordData.answers.some(a => !a.trim())
                    }
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? '⏳ Verifying Answers...' : '✅ Verify Answers'}
                  </motion.button>
                </form>
              )}

              {/* Password Reset Step */}
              {forgotPasswordStep === 'reset' && (
                <form onSubmit={handleVerifyForgotPassword} className="space-y-6">
                  <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-blue-300">
                      ✓ Resetting password for: <span className="font-bold text-blue-200">{forgotPasswordData.username}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">🔑 New Password</label>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="password"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => {
                        setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value });
                        setError('');
                      }}
                      placeholder="Enter new password (minimum 6 characters)"
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">🔐 Confirm Password</label>
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
                    disabled={
                      forgotPasswordLoading ||
                      !forgotPasswordData.newPassword ||
                      !forgotPasswordData.confirmPassword
                    }
                    type="submit"
                    className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? '⏳ Resetting...' : '🚀 Reset Password'}
                  </motion.button>
                </form>
              )}

              {/* Success Step */}
              {forgotPasswordStep === 'success' && (
                <div className="text-center space-y-4 py-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-6xl"
                  >
                    ✅
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-400">Password Reset Successfully!</h3>
                  <p className="text-gray-400">Your password has been securely updated.</p>
                  <p className="text-sm text-gray-500">The login dialog will close in a moment...</p>
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
