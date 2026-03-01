import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, loginUser, getUserByUsername, logoutUser, getUserData, getUserAccess, setSelectedAccess, getSelectedAccess, getAuthToken, checkTokenExpired } from "../services/authService";
import { listDoctorProfiles } from "../services/doctorService";
import LoginModal from "./LoginModal";
import dhanthaLogo from "../assets/dhantha-logo.svg";

const TABS = [
  { key: "home", path: "/", label: "Home", icon: "🏠" },
  { key: "clinics", path: "/clinics", label: "Clinics", icon: "🏥" },
  { key: "patients", path: "/patients", label: "Patients", icon: "👥" },
  { key: "services", path: "/services", label: "Services", icon: "⚕️" },
  { key: "inventory", path: "/inventory", label: "Inventory", icon: "📦" },
  { key: "analytics", path: "/analytics", label: "Analytics", icon: "📊" },
  { key: "team-hub", path: "/team-hub", label: "Team Hub", icon: "🌟" },
  { key: "superadmin", path: "/superadmin", label: "Super Admin", icon: "🛡️" },
];

const CRUD_OPERATIONS = {
  home: [],
  clinics: ["create", "view", "update", "delete"],
  patients: ["create", "view", "update", "delete"],
  services: ["create", "view", "update", "delete"],
  inventory: ["view", "clinic"],
  analytics: [],
  "team-hub": [],
  superadmin: [],
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
  { type: "inventory", name: "Inventory Master", path: "/inventory", icon: "📦", meta: "Manage items" },
  { type: "inventory", name: "Clinic Inventory", path: "/inventory/clinic", icon: "🏥📦", meta: "Per-clinic items" },
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
    firstName: "",
    lastName: "",
    roleId: "",
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
  const hasFetchedDoctorNameRef = useRef(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Compute role-based visibility for Super Admin tab
  const selectedAccess = getSelectedAccess();
  const isSuperAdmin = Array.isArray(selectedAccess?.roleIds) && selectedAccess.roleIds.includes(1);
  const visibleTabs = TABS.filter(t => t.key !== 'superadmin' || isSuperAdmin);

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

  // Check authentication status on mount and restore session
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = getAuthToken();
        const userData = getUserData();
        
        if (token && !checkTokenExpired()) {
          // Token exists and is valid - restore user session
          setIsLoggedIn(true);
          if (userData) {
            setUserInfo({
              name: userData.username || '',
              role: 'User'
            });
            // Try to fetch full doctor name if available (only once per session)
            if (!hasFetchedDoctorNameRef.current) {
              hasFetchedDoctorNameRef.current = true;
              listDoctorProfiles()
                .then(doctors => {
                  const doctor = doctors.find(d => 
                    d.email?.toLowerCase() === userData.username.toLowerCase() ||
                    (d.firstName + d.lastName).toLowerCase().replace(/\s/g, '') === userData.username.toLowerCase().replace(/\s/g, '')
                  );
                  if (doctor) {
                    setDoctorName(`Dr. ${doctor.firstName} ${doctor.lastName}`);
                  }
                })
                .catch(err => console.log("Could not fetch doctor profile:", err));
            }
          }
        } else if (token && checkTokenExpired()) {
          // Token expired - logout
          console.log('⏰ Token expired - logging out');
          handleLogout();
        } else {
          // No token - not logged in
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();
    
    // Check auth status every 10 seconds to handle token expiry
    const interval = setInterval(checkAuthStatus, 10000);
    
    return () => clearInterval(interval);
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
    navigate('/login');
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
        // Build registration model matching backend
        const registrationModel = {
          Username: formData.username,
          Password: formData.password,
          EmailId: formData.emailid,
          MobileNumber: formData.mobileNumber,
          ...(formData.firstName && { FirstName: formData.firstName }),
          ...(formData.lastName && { LastName: formData.lastName }),
          ...(formData.roleId && { RoleId: parseInt(formData.roleId) })
        };
        const response = await registerUser(registrationModel);
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
          setFormData({ username: "", emailid: "", mobileNumber: "", firstName: "", lastName: "", roleId: "", password: "" });
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
          hasFetchedDoctorNameRef.current = true;
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
    // Clear token and user data from storage
    logoutUser();
    
    // Clear local state
    setIsLoggedIn(false);
    setShowWelcome(false);
    setUserInfo({ name: "", role: "" });
    setDoctorName("");
    
    console.log('🔓 Logged out - token cleared from all tabs');
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
    } else if (tabKey === "inventory" && operation === "view") {
      navigate("/inventory/view-master");
    } else if (tabKey === "inventory" && operation === "clinic") {
      navigate("/inventory/clinic");
    } else {
      navigate(`/${tabKey}/${operation}`);
    }
  };

  return (
    <>
      <header className="w-full fixed top-0 left-0 right-0 z-40 shadow-xl">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-800 to-indigo-800 shadow-2xl">
            <div className="w-full px-6 md:px-12 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
            {/* Logo - Left */}
                <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <motion.img 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    src={dhanthaLogo}
                    alt="Dhantha Logo"
                    className="w-12 h-12 cursor-pointer drop-shadow-lg"
                  />
                </Link>

            {/* Title - Center */}
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="leading-none"
                  >
                    {/* Main Brand Name */}
                    <h1 
                      className="text-3xl md:text-4xl font-black tracking-tight mb-0.5"
                      style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #2dd4bf 40%, #14b8a6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 2px 8px rgba(0, 212, 255, 0.4)',
                        filter: 'drop-shadow(0 0 12px rgba(0, 212, 255, 0.2))'
                      }}
                    >
                      DHANTHA
                    </h1>
                    {/* Subtitle */}
                    <p 
                      className="text-xs md:text-sm font-bold tracking-widest"
                      style={{
                        background: 'linear-gradient(90deg, #22d3ee, #2dd4bf)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      THE DENTAL COMPANY
                    </p>
                  </motion.div>
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
                          className="relative p-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                              className="fixed right-4 top-20 w-96 bg-slate-800 rounded-xl shadow-2xl border-2 border-indigo-700 overflow-hidden z-[9999]"
                            >
                              {/* Header */}
                              <div className="bg-gradient-to-r from-slate-700 to-indigo-700 px-4 py-3 border-b border-indigo-600 flex items-center justify-between">
                                <h3 className="font-bold text-cyan-300">Notifications</h3>
                                {unreadCount > 0 && (
                                  <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
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
                                    whileHover={{ backgroundColor: "#1e293b" }}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`px-4 py-3 border-b border-slate-700 cursor-pointer ${notif.unread ? 'bg-indigo-900/30' : ''}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="text-2xl">{notif.icon}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="font-semibold text-sm text-cyan-300">{notif.title}</p>
                                          {notif.unread && (
                                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-0.5">{notif.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Footer */}
                              <div className="bg-slate-700 px-4 py-2 text-center border-t border-indigo-600">
                                <button className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold">
                                  View All Notifications
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Doctor's Space / Admin Corner Button */}
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(isSuperAdmin ? "/superadmin" : "/doctors")}
                        className={`px-4 py-2 rounded-lg hover:shadow-xl transition-all font-semibold shadow-lg text-sm flex items-center gap-2 cursor-pointer ${isSuperAdmin ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900'}`}
                      >
                        <span>{isSuperAdmin ? '🛡️' : '👨‍⚕️'}</span>
                        <span>{isSuperAdmin ? "Admin Corner" : (doctorName || "Doctor's Space")}</span>
                      </motion.button>
                    </>
                  )}
                  {!isLoggedIn ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLoginClick}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
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
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-slate-700 text-white rounded-lg hover:from-indigo-500 hover:to-slate-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
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

      {/* Login Modal Component */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowWelcome(true);
          setTimeout(() => setShowWelcome(false), 5000);
        }}
      />

      {/* Welcome Message */}
      <AnimatePresence>
        {showWelcome && isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="fixed top-32 right-6 z-[100] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white px-6 py-5 rounded-2xl shadow-2xl backdrop-blur-lg border-2 border-cyan-300/30 max-w-md"
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
          background: 'linear-gradient(90deg, #06b6d4, #0ea5e9, #06b6d4, #0ea5e9)',
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

      <nav className="w-full bg-gradient-to-r from-slate-800/90 via-indigo-800/80 to-slate-800/90 border-b border-indigo-700/50 shadow-md sticky top-20 z-30 backdrop-blur-md">
        <div className="w-full px-4 md:px-8 py-3">
          <div className="flex gap-3 justify-center relative items-center overflow-hidden">
            {visibleTabs.map((t) => (
              <div
                key={t.key}
                className="relative flex-shrink-0"
                onMouseEnter={() => setHoveredTab(t.key)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <NavLink
                  to={t.path}
                  className={({isActive}) =>
                    `px-4 py-2.5 font-bold transition-all inline-flex items-center gap-2 rounded-lg border-2 border-indigo-600 text-cyan-300 hover:bg-indigo-700 ${isActive ? `bg-indigo-700 ring-2 ring-cyan-400 ring-offset-2 scale-105` : `bg-slate-700/50`} whitespace-nowrap`
                  }
                >
                  <span className="text-xl w-6 h-6 flex items-center justify-center">{t.icon}</span>
                  <motion.span whileHover={{ y: -2 }} className="text-sm">{t.label}</motion.span>
                </NavLink>

                {/* Dropdown Menu */}
                {hoveredTab === t.key && CRUD_OPERATIONS[t.key].length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-max border-2 border-indigo-600 pointer-events-auto"
                  onMouseEnter={() => setHoveredTab(t.key)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  {CRUD_OPERATIONS[t.key].map((op, idx) => {
                    const colors = {
                      create: { bg: "bg-emerald-900/40 hover:bg-emerald-800/60", text: "text-emerald-300", icon: "➕" },
                      view: { bg: "bg-blue-900/40 hover:bg-blue-800/60", text: "text-blue-300", icon: "📋" },
                      update: { bg: "bg-cyan-900/40 hover:bg-cyan-800/60", text: "text-cyan-300", icon: "✏️" },
                      delete: { bg: "bg-red-900/40 hover:bg-red-800/60", text: "text-red-300", icon: "🗑️" },
                      clinic: { bg: "bg-indigo-900/40 hover:bg-indigo-800/60", text: "text-indigo-300", icon: "🏥" },
                    };
                    const opColor = colors[op] || { bg: "bg-slate-600/40 hover:bg-slate-600/60", text: "text-slate-300", icon: "⚙️" };

                    return (
                      <motion.button
                        key={op}
                        whileHover={{ x: 8 }}
                        onClick={() => {
                          handleCrudClick(t.key, op);
                          setHoveredTab(null);
                        }}
                        className={`w-full px-6 py-4 text-left font-semibold transition-all ${opColor.bg} ${opColor.text} ${idx !== CRUD_OPERATIONS[t.key].length - 1 ? 'border-b border-slate-600' : ''} flex items-center gap-3 cursor-pointer`}
                      >
                        <span className="text-xl w-6 h-6 flex items-center justify-center flex-shrink-0">{opColor.icon}</span>
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
