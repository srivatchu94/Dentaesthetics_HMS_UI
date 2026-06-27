import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, loginUser, getUserByUsername, logoutUser, getUserData, getUserAccess, setSelectedAccess, getSelectedAccess, getAuthToken, checkTokenExpired, manualRefreshToken } from "../services/authService";
import { listDoctorProfiles } from "../services/doctorService";
import { getCalendarAppointments } from "../services/appointmentService";
import { getClinicInventoryByClinicId } from "../services/inventoryService";
import { getClinic } from "../api/hmsApi";

import LoginModal from "./LoginModal";
import dantaLogo from "../assets/danta-logo.jpg";

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

const NOTIFICATION_POLL_INTERVAL_MS = 60 * 1000;
const MAX_APPOINTMENT_NOTIFICATIONS = 5;
const MAX_INVENTORY_NOTIFICATIONS = 3;
const HEADER_NOTIFICATION_READ_STATE_KEY = "headerNotificationReadState";
const UPCOMING_NOTIFICATION_WINDOW_DAYS = 7;

const buildNotificationScopeKey = (access) => {
  if (!access?.enterpriseId || !access?.clinicId) {
    return "anonymous";
  }

  return `${access.enterpriseId}:${access.clinicId}`;
};

const readNotificationState = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawState = localStorage.getItem(HEADER_NOTIFICATION_READ_STATE_KEY);
    return rawState ? JSON.parse(rawState) : {};
  } catch (error) {
    console.warn("Could not read notification state:", error);
    return {};
  }
};

const getReadNotificationIds = (scopeKey) => {
  const state = readNotificationState();
  const ids = state?.[scopeKey];
  return new Set(Array.isArray(ids) ? ids : []);
};

const saveReadNotificationIds = (scopeKey, ids) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const state = readNotificationState();
    state[scopeKey] = Array.from(ids);
    localStorage.setItem(HEADER_NOTIFICATION_READ_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Could not persist notification state:", error);
  }
};

const formatRelativeTime = (value) => {
  if (!value) {
    return "Just now";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = date.getTime() - Date.now();
  const absSeconds = Math.round(Math.abs(diffMs) / 1000);

  if (absSeconds < 60) {
    return diffMs >= 0 ? "In a few seconds" : "Just now";
  }

  const units = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"]
  ];

  let duration = absSeconds;
  let unit = "second";

  for (const [step, currentUnit] of units) {
    unit = currentUnit;
    if (duration < step) {
      break;
    }
    duration /= step;
  }

  const valueRounded = Math.round(duration);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return formatter.format(diffMs >= 0 ? valueRounded : -valueRounded, unit);
};

const formatAppointmentDateTime = (appointment) => {
  if (!appointment?.appointmentDate) {
    return null;
  }

  const datePart = String(appointment.appointmentDate).split("T")[0];
  const timeParts = String(appointment.startTime || "09:00:00").split(":");
  const hours = String(timeParts[0] || "09").padStart(2, "0");
  const minutes = String(timeParts[1] || "00").padStart(2, "0");
  const seconds = String(timeParts[2] || "00").padStart(2, "0");
  const date = new Date(`${datePart}T${hours}:${minutes}:${seconds}`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatClockTime = (date) => {
  if (!date) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

const formatDayLabel = (date) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "tomorrow";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
};

const getPatientDisplayName = (appointment) => {
  const fullName = [appointment?.firstName, appointment?.lastName].filter(Boolean).join(" ").trim();
  return fullName || `Patient #${appointment?.patientId || "Unknown"}`;
};

const isActiveAppointmentStatus = (status) => {
  const normalizedStatus = String(status || "scheduled").trim().toLowerCase();
  return !["cancelled", "completed", "noshow", "no show"].includes(normalizedStatus);
};

const buildNotificationItems = ({ appointments, inventoryItems, readIds }) => {
  const now = new Date();
  const upcomingCutoff = new Date(now.getTime() + UPCOMING_NOTIFICATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const appointmentNotifications = (appointments || [])
    .map((appointment) => {
      const appointmentDateTime = formatAppointmentDateTime(appointment);
      return appointmentDateTime ? { appointment, appointmentDateTime } : null;
    })
    .filter(Boolean)
    .filter(({ appointment, appointmentDateTime }) => (
      isActiveAppointmentStatus(appointment.status) &&
      appointmentDateTime >= now &&
      appointmentDateTime <= upcomingCutoff
    ))
    .sort((left, right) => left.appointmentDateTime.getTime() - right.appointmentDateTime.getTime())
    .slice(0, MAX_APPOINTMENT_NOTIFICATIONS)
    .map(({ appointment, appointmentDateTime }) => {
      const id = `appointment-${appointment.appointmentId || `${appointment.patientId}-${appointment.appointmentDate}-${appointment.startTime}`}`;
      return {
        id,
        type: "appointment",
        title: appointmentDateTime.toDateString() === now.toDateString() ? "Today's Appointment" : "Upcoming Appointment",
        message: `${getPatientDisplayName(appointment)} at ${formatClockTime(appointmentDateTime)} ${formatDayLabel(appointmentDateTime)}`,
        time: formatRelativeTime(appointmentDateTime),
        icon: "📅",
        unread: !readIds.has(id),
        path: "/calendar"
      };
    });

  const inventoryNotifications = (inventoryItems || [])
    .filter((item) => {
      const normalizedStatus = String(item?.status || "").toLowerCase();
      const threshold = Math.max(Number(item?.reorderLevel || 0), Number(item?.minimumStock || 0));
      return normalizedStatus === "outofstock" || normalizedStatus === "lowstock" || Number(item?.quantityAvailable || 0) <= threshold;
    })
    .sort((left, right) => {
      const leftWeight = String(left?.status || "").toLowerCase() === "outofstock" ? 0 : 1;
      const rightWeight = String(right?.status || "").toLowerCase() === "outofstock" ? 0 : 1;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }
      return Number(left?.quantityAvailable || 0) - Number(right?.quantityAvailable || 0);
    })
    .slice(0, MAX_INVENTORY_NOTIFICATIONS)
    .map((item) => {
      const isOutOfStock = String(item?.status || "").toLowerCase() === "outofstock" || Number(item?.quantityAvailable || 0) <= 0;
      const id = `inventory-${item.inventoryId || item.itemId}`;
      return {
        id,
        type: "inventory",
        title: isOutOfStock ? "Out of Stock" : "Low Stock Alert",
        message: `${item?.itemName || `Item #${item?.itemId || "Unknown"}`} has ${Number(item?.quantityAvailable || 0)} left`,
        time: formatRelativeTime(item?.updatedAt || item?.createdAt),
        icon: isOutOfStock ? "🚫" : "📦",
        unread: !readIds.has(id),
        path: "/inventory/clinic"
      };
    });

  const items = [...appointmentNotifications, ...inventoryNotifications].sort((left, right) => {
    const leftUnreadWeight = left.unread ? 0 : 1;
    const rightUnreadWeight = right.unread ? 0 : 1;
    if (leftUnreadWeight !== rightUnreadWeight) {
      return leftUnreadWeight - rightUnreadWeight;
    }

    return left.type.localeCompare(right.type);
  });

  if (items.length > 0) {
    return items;
  }

  return [{
    id: "all-clear",
    type: "system",
    title: "All caught up",
    message: "No new appointment or inventory alerts for this clinic.",
    time: "Updated just now",
    icon: "✅",
    unread: false,
    path: null
  }];
};

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { const t = getAuthToken(); return !!(t && !checkTokenExpired()); } catch { return false; }
  });
  const prevIsLoggedInRef = useRef(isLoggedIn);
  const [userInfo, setUserInfo] = useState({ name: "", role: "" });
  const [doctorName, setDoctorName] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [tokenRefreshStatus, setTokenRefreshStatus] = useState(null);
  const [showTokenRefreshToast, setShowTokenRefreshToast] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const hasFetchedDoctorNameRef = useRef(false);
  const notificationFetchInFlightRef = useRef(false);

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
          const wasLoggedOut = !prevIsLoggedInRef.current;
          prevIsLoggedInRef.current = true;
          setIsLoggedIn(true);
          if (userData) {
            setUserInfo({
              name: userData.username || '',
              role: 'User'
            });
            if (wasLoggedOut) {
              setWelcomeMessage(userData.username || 'Doctor');
              setShowWelcome(true);
              setTimeout(() => setShowWelcome(false), 4000);
            }
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
          prevIsLoggedInRef.current = false;
          handleLogout();
        } else {
          // No token - not logged in
          prevIsLoggedInRef.current = false;
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();

    // Immediately recheck when login completes (fired by LoginModal)
    window.addEventListener('auth-login-success', checkAuthStatus);

    // Check auth status every 10 seconds to handle token expiry
    const interval = setInterval(checkAuthStatus, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-login-success', checkAuthStatus);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !selectedAccess?.clinicId) { setClinicName(""); return; }
    getClinic(selectedAccess.clinicId)
      .then(clinic => setClinicName(clinic?.clinicName || ""))
      .catch(() => setClinicName(""));
  }, [isLoggedIn, selectedAccess?.clinicId]);

  useEffect(() => {
    const selectedNotificationScope = buildNotificationScopeKey(selectedAccess);

    if (!isLoggedIn || !selectedAccess?.clinicId) {
      setNotifications([]);
      return undefined;
    }

    let isMounted = true;

    const loadNotifications = async ({ silent = false } = {}) => {
      if (notificationFetchInFlightRef.current) {
        return;
      }

      notificationFetchInFlightRef.current = true;
      if (!silent && isMounted) {
        setNotificationsLoading(true);
      }

      try {
        const [appointmentsResult, inventoryResult] = await Promise.allSettled([
          getCalendarAppointments(),
          getClinicInventoryByClinicId(selectedAccess.clinicId)
        ]);

        const appointments = appointmentsResult.status === "fulfilled" ? appointmentsResult.value : [];
        const inventoryItems = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
        const readIds = getReadNotificationIds(selectedNotificationScope);
        const liveNotifications = buildNotificationItems({
          appointments,
          inventoryItems,
          readIds
        });

        if (isMounted) {
          setNotifications(liveNotifications);
        }
      } catch (error) {
        console.error("Failed to refresh notifications:", error);
      } finally {
        notificationFetchInFlightRef.current = false;
        if (isMounted) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadNotifications({ silent: true });
      }
    }, NOTIFICATION_POLL_INTERVAL_MS);

    const handleFocusRefresh = () => loadNotifications({ silent: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, selectedAccess?.enterpriseId, selectedAccess?.clinicId]);

  const filteredSearch = SEARCH_DATA.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const markAsRead = (id) => {
    const scopeKey = buildNotificationScopeKey(selectedAccess);
    const nextReadIds = getReadNotificationIds(scopeKey);
    nextReadIds.add(id);
    saveReadNotificationIds(scopeKey, nextReadIds);
    setNotifications(currentNotifications => currentNotifications.map(notification => 
      notification.id === id ? { ...notification, unread: false } : notification
    ));
  };

  const markAllAsRead = () => {
    const scopeKey = buildNotificationScopeKey(selectedAccess);
    const nextReadIds = getReadNotificationIds(scopeKey);
    notifications.forEach((notification) => nextReadIds.add(notification.id));
    saveReadNotificationIds(scopeKey, nextReadIds);
    setNotifications(currentNotifications => currentNotifications.map(notification => ({ ...notification, unread: false })));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.path) {
      setShowNotifications(false);
      navigate(notification.path);
    }
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
        
        // Reset form and redirect to login after 1.5 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setIsSignUp(false);
          setFormData({ username: "", emailid: "", mobileNumber: "", firstName: "", lastName: "", roleId: "", password: "" });
          setConfirmPassword("");
          setPasswordMatchWarning("");
          setShowLoginModal(true);
        }, 1500);
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
        setIsLoggedIn(true);
        setShowLoginModal(false);
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

  const handleTokenRefresh = async () => {
    setIsRefreshingToken(true);
    setTokenRefreshStatus(null);
    
    try {
      console.log('🔄 User clicked token refresh button');
      const result = await manualRefreshToken();
      
      setTokenRefreshStatus(result);
      setShowTokenRefreshToast(true);
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowTokenRefreshToast(false);
      }, 5000);
      
      console.log('✅ Token refresh completed:', result);
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      setTokenRefreshStatus({
        success: false,
        message: 'Failed to refresh token. Please try again.'
      });
      setShowTokenRefreshToast(true);
      
      setTimeout(() => {
        setShowTokenRefreshToast(false);
      }, 5000);
    } finally {
      setIsRefreshingToken(false);
    }
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
      {/* ─── Top Header Bar ─── */}
      <header className="w-full fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'linear-gradient(180deg, #0e0e12 0%, #16161e 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="w-full px-4 md:px-8 py-4 flex items-center gap-4">

          {/* Left: Logo + Brand (takes natural width) */}
          <div className="flex-1">
          <Link to="/" className="flex items-center gap-4 flex-shrink-0 group" style={{ textDecoration: 'none' }}>

            {/* ── Embossed logo medallion ── */}
            <motion.div
              whileHover={{ scale: 1.07, y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                position: 'relative',
                flexShrink: 0,
                overflow: 'hidden',
                backgroundImage: `url(${dantaLogo})`,
                backgroundSize: '132%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                /* Layer 1: tight cyan ring
                   Layer 2: dark gap (separates logo from bg)
                   Layer 3: faint outer halo
                   Layer 4: deep directional shadow (light from upper-left)
                   Layer 5: ambient cyan bloom
                   Layer 6: inset top-left highlight (raised-surface feel)
                   Layer 7: inset bottom-right shadow (depth) */
                boxShadow: [
                  '0 0 0 1.5px rgba(34,211,238,0.75)',
                  '0 0 0 3.5px rgba(6,10,24,1)',
                  '0 0 0 5px rgba(34,211,238,0.12)',
                  '-3px -3px 14px rgba(255,255,255,0.06)',
                  '5px 8px 24px rgba(0,0,0,0.92)',
                  '0 0 28px rgba(34,211,238,0.1)',
                  'inset 0 2px 4px rgba(255,255,255,0.2)',
                  'inset 0 -4px 8px rgba(0,0,0,0.55)',
                ].join(', '),
              }}
            >
              {/* Directional gleam — simulates light hitting a raised surface */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 35%, transparent 65%)',
                pointerEvents: 'none',
              }} />
            </motion.div>

            {/* ── Brand wordmark ── */}
            <div style={{ lineHeight: 1, userSelect: 'none' }}>
              {/* Name: heavy white "DENTA" + italic cyan "ESTHETICS" */}
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '900',
                  letterSpacing: '-0.01em',
                  color: '#f1f5f9',
                }}>
                  DENTA
                </span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '300',
                  letterSpacing: '0.06em',
                  fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 50%, #0ea5e9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  ESTHETICS
                </span>
              </div>

              {/* Thin cyan accent rule */}
              <div style={{
                height: '1px',
                width: '100%',
                background: 'linear-gradient(90deg, rgba(34,211,238,0.7) 0%, rgba(34,211,238,0) 100%)',
                margin: '4px 0 3px',
              }} />

              {/* Tagline */}
              <p style={{
                fontSize: '7px',
                fontWeight: '600',
                letterSpacing: '0.26em',
                color: 'rgba(148,163,184,0.7)',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                THE DENTAL COMPANY
              </p>
            </div>
          </Link>
          </div>

          {/* Center: Clinic Name */}
          <div className="flex-1 flex justify-center">
            {isLoggedIn && clinicName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 18px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(203,213,225,0.7)' }}>🏥</span>
                <span style={{
                  fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em',
                  color: '#e2e8f0',
                }}>{clinicName}</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLoggedIn && (
              <>
                {!isSuperAdmin && (
                  <div ref={notificationRef} className="relative">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-lg transition-colors cursor-pointer"
                      style={{ background: 'rgba(99,102,241,0.18)' }}
                    >
                      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {unreadCount}
                        </motion.span>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="fixed right-4 top-16 w-88 rounded-xl shadow-2xl overflow-hidden z-[9999]"
                          style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.4)', width: '22rem' }}
                        >
                          <div className="px-4 py-3 border-b border-indigo-800/60 flex items-center justify-between"
                            style={{ background: 'linear-gradient(90deg, #1e1b4b, #1e293b)' }}>
                            <div>
                              <h3 className="font-bold text-cyan-300 text-sm">Notifications</h3>
                              <p className="text-[10px] text-cyan-200/50 mt-0.5">Live updates every minute</p>
                            </div>
                            {unreadCount > 0 && (
                              <button onClick={markAllAsRead} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notificationsLoading && notifications.length === 0 && (
                              <div className="px-4 py-4 text-xs text-slate-400">Refreshing…</div>
                            )}
                            {notifications.map((notif) => (
                              <motion.div key={notif.id} whileHover={{ backgroundColor: '#0f172a' }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`px-4 py-3 border-b border-slate-700/60 cursor-pointer ${notif.unread ? 'bg-indigo-900/20' : ''}`}>
                                <div className="flex items-start gap-3">
                                  <span className="text-lg mt-0.5">{notif.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-semibold text-xs text-cyan-300 truncate">{notif.title}</p>
                                      {notif.unread && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{notif.time}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="px-4 py-2 text-center border-t border-indigo-800/40"
                            style={{ background: '#1e1b4b' }}>
                            <button onClick={() => { setShowNotifications(false); navigate("/calendar"); }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
                              Open Calendar →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(isSuperAdmin ? "/superadmin" : "/doctors")}
                  className="px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  style={isSuperAdmin
                    ? { background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: '#fff' }
                    : { background: 'linear-gradient(135deg, #06b6d4, #0284c7)', color: '#0f172a' }
                  }
                >
                  <span className="text-base">{isSuperAdmin ? '🛡️' : '👨‍⚕️'}</span>
                  <span>{isSuperAdmin ? "Admin Corner" : (doctorName || "Doctor's Space")}</span>
                </motion.button>
              </>
            )}

            {!isLoggedIn ? (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={handleLoginClick}
                className="px-4 py-1.5 rounded-lg font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)', color: '#0f172a' }}>
                Login
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg font-semibold text-sm transition-all"
                style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>
                Logout
              </motion.button>
            )}
          </div>
          </div>
        </div>

        {/* Thin animated accent line at bottom of header */}
        <motion.div className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #06b6d4, #6366f1, #06b6d4)', backgroundSize: '200% 100%' }}
          animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </header>

      {/* ─── Navigation Bar ─── */}
      <nav className="w-full fixed top-[80px] left-0 right-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(14,14,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-full px-4 md:px-8 py-2 flex justify-center">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {visibleTabs.map((t) => (
              <div key={t.key} className="flex-shrink-0">
                <NavLink to={t.path}
                  className={({ isActive }) =>
                    `px-3 py-2 font-semibold transition-all inline-flex items-center gap-1.5 rounded-lg text-sm whitespace-nowrap ${
                      isActive
                        ? 'text-cyan-300 bg-indigo-800/70 ring-1 ring-cyan-400/60'
                        : 'text-slate-300 hover:text-cyan-300 hover:bg-indigo-900/50'
                    }`
                  }>
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </NavLink>
              </div>
            ))}
          </div>
        </div>
      </nav>
      {/* spacer so content starts below both fixed bars (header 80px + nav ~52px) */}
      <div className="h-[136px]" />

      {/* Login success popup — outer div centers, inner motion.div animates (no transform conflict) */}
      <AnimatePresence>
        {showWelcome && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999999 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                minWidth: '320px',
                maxWidth: '440px',
                padding: '1.5rem 2rem',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>🎉</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>Welcome Back!</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Successfully logged in as {welcomeMessage}</div>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                style={{ marginTop: '0.5rem', padding: '0.3rem 1.25rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.15)', color: 'white', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="relative p-8 text-center" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-lg transition"
                  title="Close"
                >×</button>
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
