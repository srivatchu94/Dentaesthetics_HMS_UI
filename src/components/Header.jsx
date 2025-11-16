import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { key: "home", path: "/", label: "Home", bgColor: "from-rose-100 to-pink-100", textColor: "text-rose-800", borderColor: "border-rose-400", hoverBg: "hover:bg-rose-200", icon: "🏠" },
  { key: "clinics", path: "/clinics", label: "Clinics", bgColor: "from-emerald-100 to-teal-100", textColor: "text-emerald-800", borderColor: "border-emerald-400", hoverBg: "hover:bg-emerald-200", icon: "🏥" },
  { key: "patients", path: "/patients", label: "Patients", bgColor: "from-sky-100 to-cyan-100", textColor: "text-sky-800", borderColor: "border-sky-400", hoverBg: "hover:bg-sky-200", icon: "👥" },
  { key: "services", path: "/services", label: "Services", bgColor: "from-amber-100 to-orange-100", textColor: "text-amber-800", borderColor: "border-amber-400", hoverBg: "hover:bg-amber-200", icon: "🛠️" },
  { key: "staff", path: "/staff", label: "Staff", bgColor: "from-violet-100 to-purple-100", textColor: "text-violet-800", borderColor: "border-violet-400", hoverBg: "hover:bg-violet-200", icon: "👔" },
];

const CRUD_OPERATIONS = {
  home: [],
  clinics: ["create", "view", "update", "delete"],
  patients: ["create", "view", "update", "delete"],
  services: ["create", "view", "update", "delete"],
  staff: ["create", "view", "update", "delete"],
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
  { type: "staff", name: "Staff Management", path: "/staff", icon: "👔", meta: "12 members" },
  { type: "inventory", name: "Inventory Management", path: "/doctors", icon: "📦", meta: "6 items" },
];

export default function Header(){
  const [hoveredTab, setHoveredTab] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", role: "" });
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "doctor",
    specialty: "",
    licenseNumber: ""
  });
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Simulate login/signup - in real app, this would call an API
    const userName = isSignUp ? formData.name : formData.email.split('@')[0];
    setUserInfo({ 
      name: userName.charAt(0).toUpperCase() + userName.slice(1), 
      role: formData.role.charAt(0).toUpperCase() + formData.role.slice(1) 
    });
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setShowWelcome(true);
    // Hide welcome message after 5 seconds
    setTimeout(() => setShowWelcome(false), 5000);
    // Reset form
    setFormData({
      email: "",
      password: "",
      name: "",
      role: "doctor",
      specialty: "",
      licenseNumber: ""
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowWelcome(false);
    setUserInfo({ name: "", role: "" });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        <div className="bg-gradient-to-r from-amber-100 via-rose-100 to-orange-100 shadow-lg">
          <div className="bg-gradient-to-br from-amber-50/90 via-rose-50/80 to-orange-50/90 backdrop-blur-sm">
            <div className="w-full px-6 md:px-12 py-4">
              <div className="grid grid-cols-3 items-center">
            {/* Logo - Left */}
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 bg-gradient-to-br from-amber-400 via-rose-400 to-orange-400 rounded-xl shadow-lg flex items-center justify-center"
                  >
                    <span className="text-2xl">🦷</span>
                  </motion.div>
                </Link>

            {/* Title - Center */}
                <div className="text-center">
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-700 via-rose-700 to-orange-700 bg-clip-text text-transparent">
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
                              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50"
                            >
                              {/* Header */}
                              <div className="bg-gradient-to-r from-amber-50 to-rose-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
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
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm flex items-center gap-2"
                      >
                        <span>👨‍⚕️</span>
                        <span>Doctor's Space</span>
                      </motion.button>
                    </>
                  )}
                  {!isLoggedIn ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLoginClick}
                      className="px-6 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:via-rose-600 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
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
                      className="px-6 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
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
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
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
                  className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
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
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required={isSignUp}
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                        placeholder="Dr. John Smith"
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isSignUp ? 0.6 : 0.5 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="doctor@example.com"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isSignUp ? 0.7 : 0.6 }}
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
                    />
                  </motion.div>

                  {isSignUp && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                        >
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
                        <input
                          type="text"
                          name="specialty"
                          value={formData.specialty}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                          placeholder="Orthodontics, Endodontics, etc."
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                          placeholder="DL-123456"
                        />
                      </motion.div>
                    </>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isSignUp ? 1.1 : 0.7 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all mt-6"
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </motion.button>
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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed top-32 right-6 z-[100] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-white/20 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-3xl"
              >
                👋
              </motion.span>
              <div>
                <p className="text-lg font-bold">Hello, {userInfo.name}!</p>
                <p className="text-sm text-white/90">Thanks for logging in. Welcome back!</p>
              </div>
            </div>
            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
            />
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

      <nav className="w-full bg-gradient-to-r from-amber-50/90 via-rose-50/80 to-orange-50/90 border-b border-amber-200/50 shadow-md sticky top-20 z-30 backdrop-blur-md">
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
          className="w-full bg-gradient-to-r from-purple-50/95 via-pink-50/90 to-indigo-50/95 border-b border-purple-200/50 shadow-md sticky top-[148px] z-20 backdrop-blur-md"
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
                        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 border-b border-purple-100">
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
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
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
    </>
  );
}
