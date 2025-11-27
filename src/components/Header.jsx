import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, loginUser, getUserByUsername } from "../services/authService";
import { listDoctorProfiles } from "../services/doctorService";

const TABS = [
  { key: "home", path: "/", label: "Home", bgColor: "from-coral-100 to-peach-100", textColor: "text-coral-800", borderColor: "border-coral-400", hoverBg: "hover:bg-coral-200", icon: "🏠" },
  { key: "clinics", path: "/clinics", label: "Clinics", bgColor: "from-teal-100 to-sage-100", textColor: "text-teal-800", borderColor: "border-teal-400", hoverBg: "hover:bg-teal-200", icon: "🏥" },
  { key: "patients", path: "/patients", label: "Patients", bgColor: "from-peach-100 to-gold-100", textColor: "text-peach-800", borderColor: "border-peach-400", hoverBg: "hover:bg-peach-200", icon: "👥" },
  { key: "visits", path: "/visits", label: "Visits", bgColor: "from-violet-100 to-purple-100", textColor: "text-purple-800", borderColor: "border-purple-400", hoverBg: "hover:bg-purple-200", icon: "📋" },
  { key: "services", path: "/services", label: "Services", bgColor: "from-gold-100 to-peach-100", textColor: "text-gold-800", borderColor: "border-gold-400", hoverBg: "hover:bg-gold-200", icon: "🦷" },
  { key: "team-hub", path: "/team-hub", label: "Team Hub", bgColor: "from-indigo-100 to-purple-100", textColor: "text-indigo-800", borderColor: "border-indigo-400", hoverBg: "hover:bg-indigo-200", icon: "🌟" },
];

const CRUD_OPERATIONS = {
  home: [],
  clinics: ["create", "view", "update", "delete"],
  patients: ["create", "view", "update", "delete"],
  visits: [],
  services: ["create", "view", "update", "delete"],
  "team-hub": [],
};

// Sample notifications data
const SAMPLE_NOTIFICATIONS = [
  { id: 1, type: "appointment", title: "Upcoming Appointment", message: "Sarah Johnson - 2:00 PM Today", time: "10m ago", icon: "📅", unread: true },
  { id: 2, type: "payment", title: "Payment Received", message: "$350 from Michael Chen", time: "1h ago", icon: "💰", unread: true },
  { id: 3, type: "inventory", title: "Low Stock Alert", message: "Composite Resin running low", time: "2h ago", icon: "📦", unread: false },
  { id: 4, type: "followup", title: "Follow-up Reminder", message: "3 patients need follow-up calls", time: "3h ago", icon: "🔔", unread: true },
  { id: 5, type: "new", title: "New Patient", message: "Lisa Martinez registered", time: "5h ago", icon: "👤", unread: false }
];

// Sample search data
const SEARCH_DATA = [
  { type: "patient", name: "Sarah Johnson", path: "/patients/view", icon: "👤", meta: "Active Patient" },
  { type: "patient", name: "Michael Chen", path: "/patients/view", icon: "👤", meta: "Balance: $250" },
  { type: "patient", name: "Emily Rodriguez", path: "/patients/view", icon: "👤", meta: "Last visit: Nov 5" },
  { type: "calendar", name: "Appointment Calendar", path: "/calendar", icon: "📅", meta: "View all appointments" },
  { type: "appointment", name: "Today's Appointments", path: "/doctors", icon: "📅", meta: "12 scheduled" },
  { type: "clinic", name: "Downtown Dental Care", path: "/clinics/view", icon: "🏥", meta: "Main Clinic" },
  { type: "service", name: "Root Canal", path: "/services", icon: "🛠️", meta: "$500" },
  { type: "team-hub", name: "Team Hub", path: "/team-hub", icon: "🌟", meta: "Doctors & Staff" },
  { type: "doctors", name: "Doctors Lounge", path: "/doctors", icon: "👨‍⚕️", meta: "24 physicians" },
  { type: "inventory", name: "Inventory Management", path: "/doctors", icon: "📦", meta: "6 items" },
];

export default function Header(){
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", role: "" });
  const [doctorName, setDoctorName] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    emailid: "",
    mobileNumber: "",
    password: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchWarning, setPasswordMatchWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSearch = SEARCH_DATA.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleSearchSelect = (path) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    setIsSignUp(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    
    if (isSignUp) {
      // Validate passwords match
      if (formData.password !== confirmPassword) {
        setAuthError("Passwords do not match!");
        return;
      }
      
      setLoading(true);
      try {
        const response = await registerUser(formData);
        console.log("Registration successful:", response);
        
        const funnyMessages = [
          "🎉 Boom! You're in the club now!",
          "🚀 Account launched successfully!",
          "🎊 Welcome aboard the dental express!",
          "✨ Magic happened! Account created!",
          "🦷 Your dental journey starts now!",
          "🌟 You're officially awesome!"
        ];
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        
        // Show success modal
        setShowLoginModal(false);
        setSuccessMessage(randomMessage);
        setShowSuccessModal(true);
        
        // Reset form and redirect to login after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setIsSignUp(false);
          setFormData({ username: "", emailid: "", mobileNumber: "", password: "" });
          setConfirmPassword("");
          setPasswordMatchWarning("");
          setShowLoginModal(true);
        }, 3000);
      } catch (err) {
        if (err.response?.status === 409) {
          setAuthError("Username already exists. Please choose a different username.");
        } else if (err.response?.status === 400) {
          setAuthError("Invalid input. Please check your information.");
        } else {
          setAuthError("Registration failed. Please try again.");
        }
        console.error("Registration error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Login logic
      setLoading(true);
      try {
        const response = await loginUser({ username: formData.username, password: formData.password });
        console.log("Login successful:", response);
        
        // Use username from response or fallback to form data
        const username = response?.username || formData.username;
        
        // Generate funny welcome message
        const funnyWelcomeMessages = [
          `🎉 Welcome back, ${username}! We missed your smile!`,
          `🚀 ${username} is in the house! Let's get to work!`,
          `🦷 Look who's back! ${username} ready to brighten some smiles?`,
          `✨ ${username} has entered the chat! Time to work some dental magic!`,
          `🌟 Hey ${username}! Your patients have been waiting for you!`,
          `🎊 ${username} is back in action! Let's do this!`
        ];
        const randomWelcome = funnyWelcomeMessages[Math.floor(Math.random() * funnyWelcomeMessages.length)];
        
        setUserInfo({ 
          name: username, 
          role: "User"
        });
        setWelcomeMessage(randomWelcome);
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 5000);
        setFormData({ username: "", emailid: "", mobileNumber: "", password: "" });
        
        // Fetch doctor's profile to get their actual name
        try {
          const doctors = await listDoctorProfiles();
          // Find doctor by matching username or email
          const doctor = doctors.find(d => 
            d.email?.toLowerCase() === username.toLowerCase() ||
            (d.firstName + d.lastName).toLowerCase().replace(/\s/g, '') === username.toLowerCase().replace(/\s/g, '')
          );
          if (doctor) {
            setDoctorName(`Dr. ${doctor.firstName} ${doctor.lastName}`);
          }
        } catch (err) {
          console.log("Could not fetch doctor profile:", err);
        }
      } catch (err) {
        setAuthError("Invalid credentials. Please try again.");
        console.error("Login error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowWelcome(false);
    setUserInfo({ name: "", role: "" });
    setDoctorName("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
      if (value && formData.password && value !== formData.password) {
        setPasswordMatchWarning("⚠️ Passwords do not match!");
      } else {
        setPasswordMatchWarning("");
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      if (name === "password" && confirmPassword && value !== confirmPassword) {
        setPasswordMatchWarning("⚠️ Passwords do not match!");
      } else if (name === "password" && confirmPassword && value === confirmPassword) {
        setPasswordMatchWarning("");
      }
    }
    setAuthError("");
  };

  const handleCrudClick = (tabKey, operation) => {
    // Direct link to patient registration form for "create" operation
    if (tabKey === "patients" && operation === "create") {
      navigate("/patients?view=register");
    } else if (tabKey === "patients" && operation === "view") {
      // Navigate to separate ViewPatients page
      navigate("/patients/view");
    } else if (tabKey === "patients" && operation === "update") {
      // Navigate to separate EditPatients page
      navigate("/patients/edit");
    } else if (tabKey === "clinics" && operation === "create") {
      // Navigate to bespoke CreateClinic page
      navigate("/clinics/create");
    } else if (tabKey === "clinics" && operation === "view") {
      navigate("/clinics/view");
    } else if (tabKey === "patients" && operation === "delete") {
      navigate("/patients/delete");
    } else {
      navigate(`/${tabKey}/${operation}`);
    }
  };

  return (
    <>
      <header className="w-full fixed top-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-r from-coral-100 via-peach-100 to-teal-100 shadow-coral">
          <div className="bg-gradient-to-br from-coral-50/90 via-peach-50/80 to-cream-50/90 backdrop-blur-sm">
            <div className="w-full px-6 md:px-12 py-4">
              <div className="grid grid-cols-3 items-center">
            {/* Logo - Left */}
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 bg-gradient-to-br from-coral-400 via-peach-400 to-gold-400 rounded-xl shadow-coral flex items-center justify-center"
                  >
                    <span className="text-2xl">🦷</span>
                  </motion.div>
                </Link>

            {/* Title - Center */}
                <div className="text-center">
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-coral-700 via-peach-700 to-teal-700 bg-clip-text text-transparent">
                    Dentaesthetics VitalsVille
                  </h1>
                </div>

            {/* Notifications, Login/Doctor's Space Buttons - Right */}
                <div className="flex justify-end items-center gap-3">
                  {isLoggedIn && (
                    <>
                      {/* Notification Bell */}
                      <div ref={notificationRef} className="relative">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="relative p-2 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <svg className="w-6 h-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                            >
                              {unreadCount}
                            </motion.span>
                          )}
                        </motion.button>

                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                          {showNotifications && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-[9999]"
                            >
                              {/* Header */}
                              <div className="bg-gradient-to-r from-coral-50 to-peach-50 px-4 py-3 border-b border-warmGray-200 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                  <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                                  >
                                    Mark all read
                                  </button>
                                )}
                              </div>

                              {/* Notifications List */}
                              <div className="max-h-96 overflow-y-auto">
                                {notifications.map((notif) => (
                                  <motion.div
                                    key={notif.id}
                                    whileHover={{ backgroundColor: "#f9fafb" }}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer ${notif.unread ? 'bg-blue-50/50' : ''}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="text-2xl">{notif.icon}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                                          {notif.unread && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Footer */}
                              <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-200">
                                <button className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                                  View All Notifications
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Doctor's Space Button */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/doctors")}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 via-purple-500 to-coral-500 text-white rounded-lg hover:shadow-xl transition-all font-semibold shadow-lg text-sm flex items-center gap-2"
                      >
                        <span>👨‍⚕️</span>
                        <span>{doctorName || "Doctor's Space"}</span>
                      </motion.button>
                    </>
                  )}
                  {!isLoggedIn ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLoginClick}
                      className="px-6 py-2 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-lg hover:from-coral-600 hover:to-peach-600 transition-all font-semibold shadow-coral hover:shadow-xl text-sm"
                    >
                      Login
                    </motion.button>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className="px-6 py-2 bg-gradient-to-r from-warmGray-500 to-warmGray-600 text-white rounded-lg hover:from-warmGray-600 hover:to-warmGray-700 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
                    >
                      Logout
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login/Signup Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              {/* Animated Background Gradient */}
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-10"
              />

              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              <div className="relative p-8">
                {/* Header with Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-coral-500 to-teal-500 rounded-full flex items-center justify-center shadow-coral">
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="text-4xl"
                    >
                      🦷
                    </motion.span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-center bg-gradient-to-r from-coral-600 to-teal-600 bg-clip-text text-transparent mb-2"
                >
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-gray-600 mb-6"
                >
                  {isSignUp ? "Join our dental community" : "Sign in to continue to your dashboard"}
                </motion.p>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Error Alert */}
                  {authError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                      <p className="text-red-800 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        {authError}
                      </p>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="Enter your username"
                    />
                  </motion.div>

                  {isSignUp && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email ID</label>
                        <input
                          type="email"
                          name="emailid"
                          required
                          value={formData.emailid}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                          placeholder="your.email@example.com"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                        <input
                          type="tel"
                          name="mobileNumber"
                          required
                          value={formData.mobileNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                          placeholder="1234567890"
                          maxLength={10}
                        />
                      </motion.div>
                    </>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isSignUp ? 0.8 : 0.6 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </motion.div>

                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                          passwordMatchWarning 
                            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'
                        }`}
                        placeholder="Confirm your password"
                      />
                      {passwordMatchWarning && (
                        <p className="text-yellow-600 font-semibold text-xs mt-1 animate-pulse">
                          {passwordMatchWarning}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isSignUp ? 1.0 : 0.7 }}
                    whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? "none" : "0 20px 40px rgba(139, 92, 246, 0.3)" }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-xl font-bold text-lg shadow-coral hover:shadow-2xl transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> {isSignUp ? "Creating Account..." : "Signing In..."}
                      </span>
                    ) : (
                      isSignUp ? "Create Account" : "Sign In"
                    )}
                  </motion.button>

                  {/* Preview Error Page Button (Testing) */}
                  {!isSignUp && (
                    <motion.button
                      type="button"
                      onClick={() => navigate('/error-preview')}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all mt-3"
                    >
                      🎭 Preview Error Page (Testing)
                    </motion.button>
                  )}
                </form>

                {/* Toggle Sign In/Sign Up */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: isSignUp ? 1.2 : 0.8 }}
                  className="mt-6 text-center"
                >
                  <p className="text-gray-600">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="ml-2 text-purple-600 font-bold hover:text-purple-700 transition-colors"
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-20 -z-10"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Message */}
      <AnimatePresence>
        {showWelcome && isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="fixed top-32 right-6 z-[100] bg-gradient-to-br from-purple-500 via-pink-500 to-coral-500 text-white px-6 py-5 rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-white/30 max-w-md"
          >
            <div className="flex items-start gap-4">
              <motion.span
                animate={{ 
                  rotate: [0, 15, -15, 15, 0],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-4xl"
              >
                👋
              </motion.span>
              <div className="flex-1">
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold mb-1"
                >
                  {welcomeMessage}
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-white/90"
                >
                  You're all set to go! 🚀
                </motion.p>
              </div>
            </div>
            {/* Animated Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1.5 bg-white/40 rounded-full"
            />
            {/* Sparkle effects */}
            <motion.div
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute -top-2 -right-2 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ 
                scale: [0, 1, 0],
                rotate: [360, 180, 0]
              }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8, delay: 0.3 }}
              className="absolute -bottom-2 -left-2 text-2xl"
            >
              💫
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Decorative Strip */}
      <div className="h-20"></div>
      <motion.div 
        className="fixed top-20 left-0 right-0 h-1 z-40"
        style={{
          background: 'linear-gradient(90deg, #f59e0b, #ec4899, #f97316, #f59e0b)',
          backgroundSize: '200% 100%'
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <nav className="w-full bg-gradient-to-r from-coral-50/90 via-peach-50/80 to-cream-50/90 border-b border-coral-200/50 shadow-md sticky top-20 z-30 backdrop-blur-md">
        <div className="w-full px-6 md:px-12 py-4">
          <div className="flex gap-6 justify-center relative flex-wrap items-center">
            {TABS.map((t) => (
              <div
                key={t.key}
                className="relative"
                onMouseEnter={() => setHoveredTab(t.key)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <NavLink
                  to={t.path}
                  className={({isActive}) =>
                    `px-6 py-3 font-bold transition-all inline-flex items-center gap-2 rounded-lg border-2 ${t.bgColor} ${t.textColor} ${t.borderColor} ${isActive ? `${t.hoverBg} ring-2 ring-offset-2 scale-105` : `${t.hoverBg}`}`
                  }
                >
                  <span className="text-2xl">{t.icon}</span>
                  <motion.span whileHover={{ y: -2 }}>{t.label}</motion.span>
                </NavLink>

                {/* Dropdown Menu */}
                {hoveredTab === t.key && CRUD_OPERATIONS[t.key].length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 min-w-max border-2 border-slate-200 pointer-events-auto"
                  onMouseEnter={() => setHoveredTab(t.key)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  {CRUD_OPERATIONS[t.key].map((op, idx) => {
                    const colors = {
                      create: { bg: "bg-green-50 hover:bg-green-100", text: "text-green-700", icon: "➕" },
                      view: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", icon: "📋" },
                      update: { bg: "bg-yellow-50 hover:bg-yellow-100", text: "text-yellow-700", icon: "✏️" },
                      delete: { bg: "bg-red-50 hover:bg-red-100", text: "text-red-700", icon: "🗑️" },
                    };
                    const opColor = colors[op];

                    return (
                      <motion.button
                        key={op}
                        whileHover={{ x: 8 }}
                        onClick={() => {
                          handleCrudClick(t.key, op);
                          setHoveredTab(null);
                        }}
                        className={`w-full px-6 py-4 text-left font-semibold transition-all ${opColor.bg} ${opColor.text} ${idx !== CRUD_OPERATIONS[t.key].length - 1 ? 'border-b border-slate-200' : ''} flex items-center gap-3 cursor-pointer`}
                      >
                        <span className="text-xl">{opColor.icon}</span>
                        <span className="capitalize">{op}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          ))}
          </div>
        </div>
      </nav>

      {/* Search Bar Panel - Below Navigation */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-teal-50/95 via-sage-50/90 to-cream-50/95 border-b border-teal-200/50 shadow-md sticky top-[148px] z-20 backdrop-blur-md"
        >
          <div className="w-full px-6 md:px-12 py-3">
            <div ref={searchRef} className="relative max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search patients, appointments, clinics, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="w-full px-6 py-3 pl-12 pr-6 rounded-2xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-100 focus:bg-white outline-none transition-all text-base shadow-lg placeholder:text-gray-400"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearch && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-2xl border-2 border-purple-100 max-h-[500px] overflow-y-auto z-[100]"
                  >
                    {filteredSearch.length > 0 ? (
                      <>
                        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-sage-50 px-4 py-2 border-b border-teal-100">
                          <p className="text-sm font-semibold text-purple-700">
                            {filteredSearch.length} result{filteredSearch.length > 1 ? 's' : ''} found
                          </p>
                        </div>
                        {filteredSearch.map((item, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ backgroundColor: "#faf5ff", x: 4 }}
                            onClick={() => handleSearchSelect(item.path)}
                            className="w-full px-5 py-4 flex items-center gap-4 border-b border-purple-50 last:border-0 text-left transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-100 to-peach-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.meta}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium capitalize">
                                {item.type}
                              </span>
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.button>
                        ))}
                      </>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 font-semibold mb-1">No results found</p>
                        <p className="text-sm text-gray-400">Try searching with different keywords</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Animated Background */}
              <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-8 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [360, 0]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute bottom-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"
                />
                
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative z-10"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="text-8xl mb-4"
                  >
                    🎉
                  </motion.div>
                </motion.div>
                
                {/* Message */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2 relative z-10"
                >
                  Success!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-white/90 relative z-10"
                >
                  {successMessage}
                </motion.p>
              </div>
              
              {/* Bottom Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-emerald-700"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-2xl"
                  >
                    ⏳
                  </motion.span>
                  <span className="font-semibold">Redirecting to login...</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
