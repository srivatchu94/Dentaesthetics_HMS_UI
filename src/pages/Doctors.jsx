import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample data
const SAMPLE_CLINIC_DETAILS = {
  clinicName: "Downtown Dental Care",
  address: "123 Main Street, Suite 200, New York, NY",
  phone: "555-0101",
  email: "contact@downtowndental.com",
  operatingHours: "Mon-Fri 9:00 AM - 6:00 PM",
  totalStaff: 12,
  activeDoctors: 4,
  chairsAvailable: 8,
  todayAppointments: 12,
  pendingPayments: 3
};

const SAMPLE_PATIENTS = [
  { id: 1, name: "Sarah Johnson", status: "Active", lastVisit: "2025-11-10", nextAppt: "2025-11-20", balance: 0 },
  { id: 2, name: "Michael Chen", status: "Active", lastVisit: "2025-11-08", nextAppt: "2025-11-22", balance: 250 },
  { id: 3, name: "Emily Rodriguez", status: "Active", lastVisit: "2025-11-05", nextAppt: "2025-11-25", balance: 0 },
  { id: 4, name: "David Thompson", status: "Pending", lastVisit: "2025-10-28", nextAppt: "2025-12-01", balance: 500 },
  { id: 5, name: "Lisa Martinez", status: "Active", lastVisit: "2025-11-12", nextAppt: "2025-11-18", balance: 150 }
];

const SAMPLE_PAYMENTS = [
  { id: 1, patient: "Sarah Johnson", amount: 350, status: "Paid", date: "2025-11-10", method: "Insurance" },
  { id: 2, patient: "Michael Chen", amount: 250, status: "Pending", date: "2025-11-08", method: "Credit Card" },
  { id: 3, patient: "Emily Rodriguez", amount: 450, status: "Paid", date: "2025-11-05", method: "Cash" },
  { id: 4, patient: "David Thompson", amount: 500, status: "Overdue", date: "2025-10-28", method: "Insurance" },
  { id: 5, patient: "Lisa Martinez", amount: 150, status: "Pending", date: "2025-11-12", method: "Debit Card" }
];

const SAMPLE_APPOINTMENTS = [
  { id: 1, patient: "Sarah Johnson", date: "2025-11-20", time: "10:00 AM", type: "Cleaning", status: "Confirmed" },
  { id: 2, patient: "Michael Chen", date: "2025-11-22", time: "2:00 PM", type: "Root Canal", status: "Confirmed" },
  { id: 3, patient: "Emily Rodriguez", date: "2025-11-25", time: "11:00 AM", type: "Filling", status: "Confirmed" },
  { id: 4, patient: "John Smith", date: "2025-11-18", time: "9:00 AM", type: "Checkup", status: "Cancelled" },
  { id: 5, patient: "Lisa Martinez", date: "2025-11-18", time: "3:00 PM", type: "Crown", status: "Confirmed" }
];

const SAMPLE_INVENTORY = [
  { id: 1, item: "Dental Gloves (Box)", category: "Supplies", available: 120, ordered: 0, status: "In Stock", reorderLevel: 50 },
  { id: 2, item: "Anesthetic Cartridges", category: "Medication", available: 35, ordered: 100, status: "Low Stock", reorderLevel: 40 },
  { id: 3, item: "Composite Resin", category: "Materials", available: 8, ordered: 20, status: "Critical", reorderLevel: 10 },
  { id: 4, item: "Surgical Masks (Box)", category: "Supplies", available: 200, ordered: 0, status: "In Stock", reorderLevel: 80 },
  { id: 5, item: "X-Ray Film", category: "Equipment", available: 150, ordered: 0, status: "In Stock", reorderLevel: 60 },
  { id: 6, item: "Sterile Needles", category: "Supplies", available: 25, ordered: 50, status: "Low Stock", reorderLevel: 30 }
];

export default function Doctors() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [isManageExpanded, setIsManageExpanded] = useState(false);
  
  // Inventory management states
  const [inventoryItems, setInventoryItems] = useState(SAMPLE_INVENTORY);
  const [newItems, setNewItems] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  const vendors = [
    "MedSupply Co.",
    "Dental Solutions Ltd.",
    "Healthcare Partners Inc.",
    "Premier Medical Supplies",
    "Global Dental Equipment"
  ];
  
  const handleAddNewItem = () => {
    setNewItems([...newItems, { tempId: Date.now(), item: "", category: "", available: "", reorderLevel: "" }]);
  };
  
  const handleNewItemChange = (tempId, field, value) => {
    setNewItems(newItems.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };
  
  const handleSaveNewItems = () => {
    const validItems = newItems.filter(item => item.item && item.category && item.available);
    if (validItems.length > 0) {
      const itemsToAdd = validItems.map((item, index) => ({
        id: inventoryItems.length + index + 1,
        item: item.item,
        category: item.category,
        available: parseInt(item.available) || 0,
        ordered: 0,
        reorderLevel: parseInt(item.reorderLevel) || 10,
        status: "In Stock"
      }));
      setInventoryItems([...inventoryItems, ...itemsToAdd]);
      setNewItems([]);
    }
  };
  
  const handlePlaceOrder = (item) => {
    setOrderItem(item);
    setOrderQuantity("");
    setSelectedVendor("");
    setOrderModalOpen(true);
  };
  
  const handleConfirmOrder = () => {
    if (orderItem && orderQuantity && selectedVendor) {
      // Update the inventory item with ordered quantity
      setInventoryItems(inventoryItems.map(item => 
        item.id === orderItem.id 
          ? { ...item, ordered: (item.ordered || 0) + parseInt(orderQuantity), status: "In Stock" }
          : item
      ));
      setOrderModalOpen(false);
      setSuccessModalOpen(true);
    }
  };

  const dashboardTabs = [
    { key: "overview", label: "Overview", icon: "📊", gradient: "from-indigo-500 to-purple-600" },
    { key: "clinic", label: "Clinic Details", icon: "🏥", gradient: "from-teal-500 to-cyan-600" },
    { key: "patients", label: "My Patients", icon: "👥", gradient: "from-blue-500 to-indigo-600" },
    { key: "payments", label: "Payments", icon: "💳", gradient: "from-emerald-500 to-teal-600" },
    { key: "appointments", label: "Appointments", icon: "📅", gradient: "from-violet-500 to-purple-600" },
    { key: "inventory", label: "Inventory", icon: "📦", gradient: "from-amber-500 to-orange-600" }
  ];

  const manageClinicTabs = [
    { key: "settings", label: "Clinic Settings", icon: "⚙️", gradient: "from-slate-500 to-stone-600" },
    { key: "staff", label: "Staff Management", icon: "👔", gradient: "from-blue-500 to-indigo-600" },
    { key: "schedule", label: "Schedule & Hours", icon: "🗓️", gradient: "from-violet-500 to-purple-600" },
    { key: "billing", label: "Billing & Insurance", icon: "💰", gradient: "from-emerald-500 to-teal-600" },
    { key: "reports", label: "Reports & Analytics", icon: "📈", gradient: "from-orange-500 to-red-600" },
    { key: "equipment", label: "Equipment & Assets", icon: "🔧", gradient: "from-amber-500 to-orange-600" }
  ];

  const tabs = activeSection === "dashboard" ? dashboardTabs : manageClinicTabs;

  const getStatusColor = (status) => {
    const colors = {
      "Active": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Pending": "bg-amber-100 text-amber-700 border-amber-200",
      "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Overdue": "bg-rose-100 text-rose-700 border-rose-200",
      "Confirmed": "bg-blue-100 text-blue-700 border-blue-200",
      "Cancelled": "bg-stone-200 text-stone-600 border-stone-300",
      "In Stock": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Low Stock": "bg-amber-100 text-amber-700 border-amber-200",
      "Critical": "bg-rose-100 text-rose-700 border-rose-200"
    };
    return colors[status] || "bg-stone-100 text-stone-600 border-stone-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/40 to-pink-50/30">
      {/* Spacer for header and nav */}
      <div className="h-[148px]"></div>
      
      {/* Sidebar Toggle Button - Outside the sidebar */}
      <motion.button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        animate={{ 
          left: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        whileHover={{ 
          scale: 1.1, 
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.25)",
          backgroundColor: "rgba(255, 255, 255, 1)"
        }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-[180px] w-5 h-12 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg flex items-center justify-center text-indigo-600 hover:text-indigo-700 transition-all border border-l-0 border-indigo-100 hover:border-indigo-200 z-[60]"
        style={{
          clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)"
        }}
      >
        <motion.svg
          animate={{ 
            rotate: isSidebarCollapsed ? 180 : 0,
            x: isSidebarCollapsed ? -1 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Left Sidebar Navigation */}
      <motion.aside
        animate={{ 
          width: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 shadow-2xl fixed left-0 top-[148px] h-[calc(100vh-148px)] z-50 rounded-tr-3xl border-t-4 border-white/20"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
        }}
      >
        <style>{`
          aside::-webkit-scrollbar {
            width: 6px;
          }
          aside::-webkit-scrollbar-track {
            background: transparent;
          }
          aside::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          aside::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>

        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'p-3' : 'p-5'}`}>
          {/* Header - Clickable to expand sidebar */}
          <motion.div 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`flex items-center mb-5 pb-5 border-b border-white/20 cursor-pointer hover:bg-white/10 rounded-lg transition-all ${isSidebarCollapsed ? 'justify-center flex-col gap-2 p-2' : 'gap-3 p-2'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'}`}
            >
              👨‍⚕️
              {/* Expand indicator when collapsed */}
              {isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"
                >
                  »
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div
                  key="header-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <h2 className="text-white font-bold text-lg whitespace-nowrap">Doctor's Space</h2>
                  <p className="text-indigo-100 text-xs whitespace-nowrap">Dr. Smith</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dashboard Section */}
          <div className="mb-4">
            {/* Dashboard Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    📊 Dashboard
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isDashboardExpanded ? 180 : 0,
                      y: isDashboardExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">📊</span>
                  <motion.div
                    animate={{ 
                      scale: isDashboardExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Dashboard Items */}
            <AnimatePresence>
              {isDashboardExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {dashboardTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        setActiveSection("dashboard");
                        setActiveTab(tab.key);
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "dashboard" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-4"></div>

          {/* Manage Clinic Section */}
          <div className="mb-4">
            {/* Manage Clinic Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsManageExpanded(!isManageExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    🏛️ Manage Clinic
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isManageExpanded ? 180 : 0,
                      y: isManageExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">🏛️</span>
                  <motion.div
                    animate={{ 
                      scale: isManageExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Manage Clinic Items */}
            <AnimatePresence>
              {isManageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {manageClinicTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        setActiveSection("manage");
                        setActiveTab(tab.key);
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "manage" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className={`w-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/30 transition shadow-md border border-white/30 ${
                isSidebarCollapsed ? 'px-2 py-2.5 gap-0' : 'px-3 py-2.5 gap-2'
              }`}
              title={isSidebarCollapsed ? "Back to Home" : ""}
            >
              <span className={`transition-all ${
                isSidebarCollapsed ? 'text-lg' : 'text-sm'
              }`}>←</span>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.span
                    key="back-text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap text-xs"
                  >
                    Back to Home
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div 
        animate={{ 
          marginLeft: isSidebarCollapsed ? "64px" : "280px",
          paddingLeft: isSidebarCollapsed ? "2rem" : "2.5rem"
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="flex-1 pb-12 pr-8 pt-6 min-h-[calc(100vh-148px)]" style={{ marginTop: 0 }}
      >
        <AnimatePresence mode="wait">
          {/* Dashboard Section Tabs */}
          {activeSection === "dashboard" && activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    👨‍⚕️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      Welcome, Dr. Smith
                    </h2>
                    <p className="text-stone-600 text-sm mt-1">Here's your practice overview for today</p>
                  </div>
                </div>

                {/* Quick Stats Grid - Navigatable Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("appointments")}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-xl p-5 border border-blue-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{SAMPLE_CLINIC_DETAILS.todayAppointments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Appointments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("patients")}
                    className="bg-gradient-to-br from-emerald-50 to-teal-100/50 rounded-xl p-5 border border-emerald-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">👥</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700">{SAMPLE_PATIENTS.length}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Patients</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("payments")}
                    className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl p-5 border border-amber-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">💰</span>
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-700">{SAMPLE_CLINIC_DETAILS.pendingPayments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Payments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("inventory")}
                    className="bg-gradient-to-br from-violet-50 to-purple-100/50 rounded-xl p-5 border border-violet-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">🪑</span>
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Available</span>
                    </div>
                    <p className="text-3xl font-bold text-violet-700">{SAMPLE_CLINIC_DETAILS.chairsAvailable}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Chairs</p>
                  </motion.div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments Preview */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <span>📅</span> Next Appointments
                  </h3>
                  <div className="space-y-3">
                    {SAMPLE_APPOINTMENTS.filter(a => a.status === "Confirmed").slice(0, 3).map((appt) => (
                      <motion.div
                        key={appt.id}
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                      >
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{appt.patient}</p>
                          <p className="text-xs text-stone-600">{appt.type} • {appt.time}</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                          {appt.date}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Critical Inventory Alerts */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 p-6">
                  <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <span>⚠️</span> Inventory Alerts
                  </h3>
                  <div className="space-y-3">
                    {SAMPLE_INVENTORY.filter(i => i.status !== "In Stock").slice(0, 3).map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 5 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          item.status === "Critical" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{item.item}</p>
                          <p className="text-xs text-stone-600">Available: {item.available} • Reorder: {item.reorderLevel}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.status === "Critical" ? "bg-rose-200 text-rose-700" : "bg-amber-200 text-amber-700"
                        }`}>
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Clinic Details Tab */}
          {activeSection === "dashboard" && activeTab === "clinic" && (
            <motion.div
              key="clinic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    🏥
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 bg-clip-text text-transparent">
                      {SAMPLE_CLINIC_DETAILS.clinicName}
                    </h2>
                    <p className="text-stone-600 text-sm">Clinic Information & Statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                        Contact Information
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">📍</span>
                          <span className="text-stone-700 flex-1">{SAMPLE_CLINIC_DETAILS.address}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">📞</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">✉️</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.email}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">🕒</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.operatingHours}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                      Clinic Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-teal-700">{SAMPLE_CLINIC_DETAILS.totalStaff}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Total Staff</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-blue-700">{SAMPLE_CLINIC_DETAILS.activeDoctors}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Active Doctors</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-indigo-700">{SAMPLE_CLINIC_DETAILS.chairsAvailable}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Chairs Available</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-purple-700">{SAMPLE_PATIENTS.length}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Active Patients</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Patient Details Tab */}
          {activeSection === "dashboard" && activeTab === "patients" && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        👥
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                          My Patients
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Complete patient registry and records</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/patients?view=list")}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span>👁️</span>
                      <span>View All Patients</span>
                    </motion.button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Patient Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Last Visit</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Next Appointment</th>
                        <th className="px-6 py-3 text-right font-semibold text-stone-700">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_PATIENTS.map((patient, idx) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{patient.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-600">{patient.lastVisit}</td>
                          <td className="px-6 py-4 text-stone-600">{patient.nextAppt}</td>
                          <td className="px-6 py-4 text-right font-semibold text-stone-800">
                            ${patient.balance}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Status Tab */}
          {activeSection === "dashboard" && activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💳
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                        Payment Status
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Track all patient payments and outstanding balances</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Date</th>
                        <th className="px-6 py-3 text-right font-semibold text-stone-700">Amount</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Method</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_PAYMENTS.map((payment, idx) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{payment.patient}</td>
                          <td className="px-6 py-4 text-stone-600">{payment.date}</td>
                          <td className="px-6 py-4 text-right font-semibold text-stone-800">${payment.amount}</td>
                          <td className="px-6 py-4 text-stone-600">{payment.method}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Appointments Tab */}
          {activeSection === "dashboard" && activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-violet-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📅
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                        Appointments & Cancellations
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Upcoming appointments and recent cancellations</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Time</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Type</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_APPOINTMENTS.map((appt, idx) => (
                        <motion.tr
                          key={appt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{appt.patient}</td>
                          <td className="px-6 py-4 text-stone-600">{appt.date}</td>
                          <td className="px-6 py-4 text-stone-600">{appt.time}</td>
                          <td className="px-6 py-4 text-stone-600">{appt.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Inventory Tab */}
          {activeSection === "dashboard" && activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📦
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          Clinic Inventory
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage inventory items and place orders</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddNewItem}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                      >
                        + Add Item
                      </button>
                      {newItems.length > 0 && (
                        <button
                          onClick={handleSaveNewItems}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                        >
                          Save New Items
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Existing Inventory Items */}
                    {inventoryItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-stone-800 text-sm mb-1">{item.item}</h3>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              {item.category}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Available:</span>
                            <span className="font-bold text-stone-800 text-base">{item.available}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">On Order:</span>
                            <span className="font-semibold text-stone-700">{item.ordered || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Reorder Level:</span>
                            <span className="font-semibold text-stone-700">{item.reorderLevel}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handlePlaceOrder(item)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition text-sm shadow-md"
                        >
                          Place Order
                        </button>
                      </motion.div>
                    ))}
                    
                    {/* New Item Entry Cards */}
                    {newItems.map((newItem) => (
                      <motion.div
                        key={newItem.tempId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-xl p-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Item Name *</label>
                            <input
                              type="text"
                              value={newItem.item}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'item', e.target.value)}
                              placeholder="Enter item name"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                            <input
                              type="text"
                              value={newItem.category}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'category', e.target.value)}
                              placeholder="e.g., Supplies, Medication"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity *</label>
                              <input
                                type="number"
                                value={newItem.available}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'available', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Reorder At</label>
                              <input
                                type="number"
                                value={newItem.reorderLevel}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'reorderLevel', e.target.value)}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setNewItems(newItems.filter(item => item.tempId !== newItem.tempId))}
                            className="w-full px-3 py-2 bg-rose-100 text-rose-700 rounded-lg font-semibold hover:bg-rose-200 transition text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Order Modal */}
              <AnimatePresence>
                {orderModalOpen && orderItem && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setOrderModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200"
                    >
                      <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <h3 className="text-xl font-bold text-amber-900">Place Order</h3>
                        <p className="text-sm text-stone-600 mt-1">Submit a purchase order for inventory replenishment</p>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Item</label>
                          <p className="text-lg font-bold text-stone-800">{orderItem.item}</p>
                          <p className="text-xs text-stone-600 mt-1">Category: {orderItem.category}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Quantity Required *</label>
                          <input
                            type="number"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(e.target.value)}
                            placeholder="Enter quantity to order"
                            min="1"
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Vendor *</label>
                          <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          >
                            <option value="">Select a vendor</option>
                            {vendors.map((vendor, idx) => (
                              <option key={idx} value={vendor}>{vendor}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">Current Stock:</span> {orderItem.available} units<br/>
                            <span className="font-semibold">Reorder Level:</span> {orderItem.reorderLevel} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 border-t border-stone-200 flex gap-3">
                        <button
                          onClick={() => setOrderModalOpen(false)}
                          className="flex-1 px-4 py-3 border border-stone-300 rounded-lg text-stone-700 font-semibold hover:bg-stone-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmOrder}
                          disabled={!orderQuantity || !selectedVendor}
                          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                            orderQuantity && selectedVendor
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Place Order
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Success Modal */}
              <AnimatePresence>
                {successModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSuccessModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 text-center"
                    >
                      <div className="p-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg"
                        >
                          ✓
                        </motion.div>
                        <h3 className="text-2xl font-bold text-emerald-700 mb-2">Order Placed Successfully!</h3>
                        <p className="text-stone-600 mb-6">
                          Your order has been submitted and will be processed shortly.
                        </p>
                        <button
                          onClick={() => setSuccessModalOpen(false)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-md"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Manage Clinic - Clinic Settings Tab */}
          {activeSection === "manage" && activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      ⚙️
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                        Clinic Settings
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage clinic information and preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Clinic Name</label>
                      <input type="text" defaultValue="Dentaesthetics Central Clinic" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Registration Number</label>
                      <input type="text" defaultValue="DC-2024-001" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                      <input type="text" defaultValue="123 Dental Street, Medical District, Paris" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Contact Email</label>
                      <input type="email" defaultValue="contact@dentaesthetics.com" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
                      <input type="tel" defaultValue="+33 1 23 45 67 89" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Specialties</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["General Dentistry", "Orthodontics", "Cosmetic Dentistry", "Implantology", "Pediatric Dentistry"].map(specialty => (
                          <span key={specialty} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {specialty} ×
                          </span>
                        ))}
                        <button className="px-3 py-1.5 border-2 border-dashed border-purple-300 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-50 transition">
                          + Add Specialty
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Insurance Providers Accepted</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["AXA Health", "Allianz Care", "April International", "MSH International", "Cigna Global"].map(insurance => (
                          <span key={insurance} className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                            {insurance} ×
                          </span>
                        ))}
                        <button className="px-3 py-1.5 border-2 border-dashed border-pink-300 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-50 transition">
                          + Add Provider
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Staff Management Tab */}
          {activeSection === "manage" && activeTab === "staff" && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        👥
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                          Staff Management
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic staff and their schedules</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      + Add Staff
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Specialty</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Schedule</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Contact</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Dr. Sophie Martin", role: "Senior Dentist", specialty: "Cosmetic Dentistry", schedule: "Mon-Fri 9AM-5PM", contact: "+33 6 12 34 56 78" },
                        { name: "Dr. Jean Dubois", role: "Orthodontist", specialty: "Orthodontics", schedule: "Tue-Sat 10AM-6PM", contact: "+33 6 23 45 67 89" },
                        { name: "Marie Lefevre", role: "Dental Hygienist", specialty: "Preventive Care", schedule: "Mon-Fri 8AM-4PM", contact: "+33 6 34 56 78 90" },
                        { name: "Pierre Bernard", role: "Dental Assistant", specialty: "General Support", schedule: "Mon-Fri 9AM-5PM", contact: "+33 6 45 67 89 01" },
                        { name: "Claire Moreau", role: "Receptionist", specialty: "Front Desk", schedule: "Mon-Fri 8AM-6PM", contact: "+33 6 56 78 90 12" }
                      ].map((staff, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{staff.name}</td>
                          <td className="px-6 py-4 text-stone-600">{staff.role}</td>
                          <td className="px-6 py-4 text-stone-600">{staff.specialty}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{staff.schedule}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{staff.contact}</td>
                          <td className="px-6 py-4 text-center">
                            <button className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 transition mr-2">
                              Edit
                            </button>
                            <button className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 transition">
                              Remove
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Schedule & Hours Tab */}
          {activeSection === "manage" && activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📅
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                        Schedule & Operating Hours
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Configure clinic operating hours and holidays</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <input type="checkbox" defaultChecked={day !== "Sunday"} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">{day}</p>
                          <div className="flex gap-2 mt-2">
                            <input type="time" defaultValue="09:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <span className="text-stone-500">to</span>
                            <input type="time" defaultValue="18:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Holidays & Closures</h3>
                    <div className="space-y-2">
                      {[
                        { date: "2024-12-25", name: "Christmas Day" },
                        { date: "2024-01-01", name: "New Year's Day" },
                        { date: "2024-07-14", name: "Bastille Day" }
                      ].map((holiday, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div>
                            <p className="font-medium text-stone-800">{holiday.name}</p>
                            <p className="text-sm text-stone-600">{holiday.date}</p>
                          </div>
                          <button className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 transition">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="w-full px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
                        + Add Holiday
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Schedule
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Billing & Insurance Tab */}
          {activeSection === "manage" && activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💳
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                        Billing & Insurance
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage payment methods and insurance settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-800 mb-4">Payment Methods Accepted</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Payment", "Cheque"].map(method => (
                        <label key={method} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-rose-50 transition">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500" />
                          <span className="text-sm font-medium text-stone-700">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Service Fee Schedule</h3>
                    <div className="space-y-2">
                      {[
                        { service: "General Consultation", fee: "€50" },
                        { service: "Teeth Cleaning", fee: "€80" },
                        { service: "Tooth Extraction", fee: "€120" },
                        { service: "Dental Filling", fee: "€90" },
                        { service: "Root Canal", fee: "€350" },
                        { service: "Teeth Whitening", fee: "€200" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                          <span className="font-medium text-stone-800">{item.service}</span>
                          <span className="text-rose-700 font-bold">{item.fee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Tax & Regulatory Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">VAT Number</label>
                        <input type="text" defaultValue="FR12345678901" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Tax Rate (%)</label>
                        <input type="number" defaultValue="20" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Reports & Analytics Tab */}
          {activeSection === "manage" && activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📊
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
                        Reports & Analytics
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">View clinic performance and statistics</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-stone-600 mb-1">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-amber-700">€45,280</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 12.5% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <p className="text-sm text-stone-600 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-teal-700">1,247</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 8.3% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <p className="text-sm text-stone-600 mb-1">Appointments</p>
                      <p className="text-3xl font-bold text-indigo-700">342</p>
                      <p className="text-xs text-rose-600 mt-2">↓ 3.2% from last month</p>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Quick Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "Daily Appointments Summary", icon: "📋" },
                        { name: "Revenue by Service Type", icon: "💰" },
                        { name: "Patient Demographics", icon: "👥" },
                        { name: "Treatment Success Rates", icon: "✅" },
                        { name: "Insurance Claims Report", icon: "📄" },
                        { name: "Inventory Usage Analysis", icon: "📦" }
                      ].map((report, idx) => (
                        <button key={idx} className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200 hover:bg-amber-50 hover:border-amber-300 transition text-left">
                          <span className="text-2xl">{report.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-stone-800">{report.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">Click to generate</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Custom Report Builder</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Report Type</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Revenue Analysis</option>
                          <option>Patient Statistics</option>
                          <option>Appointment Trends</option>
                          <option>Treatment Analysis</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Date Range</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                          <option>Last 3 Months</option>
                          <option>Custom Range</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Equipment & Assets Tab */}
          {activeSection === "manage" && activeTab === "equipment" && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-orange-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        🦷
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                          Equipment & Assets
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic equipment and maintenance</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      + Add Equipment
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Equipment</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Serial Number</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Purchase Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Last Maintenance</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Next Maintenance</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { equipment: "Dental Chair Unit #1", serial: "DC-2023-001", purchase: "2023-01-15", lastMaint: "2024-10-20", nextMaint: "2025-01-20", status: "Operational" },
                        { equipment: "X-Ray Machine", serial: "XR-2022-045", purchase: "2022-06-10", lastMaint: "2024-11-05", nextMaint: "2025-02-05", status: "Operational" },
                        { equipment: "Autoclave Sterilizer", serial: "AS-2023-012", purchase: "2023-03-20", lastMaint: "2024-11-28", nextMaint: "2024-12-28", status: "Due Soon" },
                        { equipment: "Ultrasonic Scaler", serial: "US-2021-089", purchase: "2021-09-12", lastMaint: "2024-09-15", nextMaint: "2024-12-15", status: "Due Soon" },
                        { equipment: "LED Curing Light", serial: "LC-2024-003", purchase: "2024-02-01", lastMaint: "2024-11-01", nextMaint: "2025-02-01", status: "Operational" },
                        { equipment: "Intraoral Camera", serial: "IC-2022-078", purchase: "2022-11-30", lastMaint: "2024-08-10", nextMaint: "2024-11-10", status: "Overdue" }
                      ].map((item, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-orange-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{item.equipment}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.serial}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.purchase}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.lastMaint}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.nextMaint}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === "Operational" ? "bg-emerald-100 text-emerald-700" :
                              item.status === "Due Soon" ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-stone-50 border-t border-stone-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Total Equipment Value</p>
                      <p className="text-2xl font-bold text-orange-700">€124,500</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Maintenance This Month</p>
                      <p className="text-2xl font-bold text-teal-700">3 Items</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Overdue Maintenance</p>
                      <p className="text-2xl font-bold text-rose-700">1 Item</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
