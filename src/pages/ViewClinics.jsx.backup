import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClinics, useUpdateClinic } from "../services/hooks";
import { getClinic } from "../services/hmsApi";

// Sample data for revenue analytics
const generateRevenueData = (period) => {
  switch(period) {
    case 'week':
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue: [174300, 199200, 182600, 232400, 257300, 149400, 74700],
        patients: [18, 22, 20, 25, 28, 16, 8]
      };
    case 'month':
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [705500, 763600, 730400, 788500],
        patients: [85, 92, 88, 95]
      };
    case 'quarter':
      return {
        labels: ['Month 1', 'Month 2', 'Month 3'],
        revenue: [2988000, 3195500, 3419600],
        patients: [360, 385, 412]
      };
    case 'year':
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue: [3486000, 3154000, 3735000, 3569000, 3984000, 3818000, 4150000, 4067000, 4316000, 4233000, 4482000, 4648000],
        patients: [420, 380, 450, 430, 480, 460, 500, 490, 520, 510, 540, 560]
      };
    default:
      return { labels: [], revenue: [], patients: [] };
  }
};

const REPORT_TYPES = [
  { id: 'revenue', name: 'Revenue Report', icon: '💰', color: 'from-emerald-500 to-teal-500', description: 'Detailed revenue breakdown by clinic and period' },
  { id: 'patient', name: 'Patient Statistics', icon: '👥', color: 'from-blue-500 to-indigo-500', description: 'Patient flow, demographics, and visit patterns' },
  { id: 'treatment', name: 'Treatment Analysis', icon: '🦷', color: 'from-purple-500 to-pink-500', description: 'Popular treatments and success rates' },
  { id: 'staff', name: 'Staff Performance', icon: '👨‍⚕️', color: 'from-amber-500 to-orange-500', description: 'Doctor productivity and efficiency metrics' },
  { id: 'inventory', name: 'Inventory Report', icon: '📦', color: 'from-cyan-500 to-blue-500', description: 'Stock levels and usage patterns' },
  { id: 'financial', name: 'Financial Summary', icon: '📊', color: 'from-violet-500 to-purple-500', description: 'Complete financial overview and P&L' }
];

// Sample clinic data for demonstration
const SAMPLE_CLINICS = [
  {
    clinicId: 101,
    enterpriseId: 1,
    clinicName: "Dentaesthetics Mumbai Central",
    clinicAddress: "Shop 12, Andheri West, Near Metro Station",
    clinicCity: "Mumbai",
    clinicPhone: "+91 98765 43210",
    clinicEmail: "contact@dentaestheticsmumbai.com",
    operatingHours: "Mon-Fri 9:00 AM - 6:00 PM, Sat 9:00 AM - 2:00 PM"
  },
  {
    clinicId: 102,
    enterpriseId: 1,
    clinicName: "Smile Care Bangalore",
    clinicAddress: "No. 45, MG Road, Near Chinnaswamy Stadium",
    clinicCity: "Bangalore",
    clinicPhone: "+91 98765 43211",
    clinicEmail: "info@smilecarebangalore.com",
    operatingHours: "Mon-Fri 8:00 AM - 5:00 PM"
  },
  {
    clinicId: 103,
    enterpriseId: 2,
    clinicName: "Pearl Dental Clinic Delhi",
    clinicAddress: "A-123, Connaught Place, Central Delhi",
    clinicCity: "Delhi",
    clinicPhone: "+91 98765 43212",
    clinicEmail: "appointments@pearldentaldelhi.com",
    operatingHours: "Mon-Sat 10:00 AM - 7:00 PM"
  },
  {
    clinicId: 104,
    enterpriseId: 1,
    clinicName: "Sunshine Dental Care Pune",
    clinicAddress: "Building 7, Koregaon Park, Pune",
    clinicCity: "Pune",
    clinicPhone: "+91 98765 43213",
    clinicEmail: "care@sunshinedentalcare.com",
    operatingHours: "Tue-Sat 9:00 AM - 6:00 PM"
  },
  {
    clinicId: 105,
    enterpriseId: 2,
    clinicName: "Bright Smiles Hyderabad",
    clinicAddress: "Road No 45, Jubilee Hills, Hyderabad",
    clinicCity: "Hyderabad",
    clinicPhone: "+91 98765 43214",
    clinicEmail: "hello@brightsmileshyd.com",
    operatingHours: "Mon-Fri 8:30 AM - 5:30 PM, Sat 9:00 AM - 1:00 PM"
  },
  {
    clinicId: 106,
    enterpriseId: 3,
    clinicName: "Elite Dental Care Chennai",
    clinicAddress: "No. 234, Anna Salai, T. Nagar",
    clinicCity: "Chennai",
    clinicPhone: "+91 98765 43215",
    clinicEmail: "reception@elitedentalchennai.com",
    operatingHours: "Mon-Thu 9:00 AM - 7:00 PM, Fri 9:00 AM - 4:00 PM"
  }
];

export default function ViewClinics() {
  const navigate = useNavigate();
  const { data: apiClinics, loading, error, refresh } = useClinics();

  // Search state
  const [searchedClinic, setSearchedClinic] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Reports & Analytics Dashboard state
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [activeView, setActiveView] = useState('analytics'); // 'analytics' or 'reports'
  const [timePeriod, setTimePeriod] = useState('month');
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const chartData = useMemo(() => generateRevenueData(timePeriod), [timePeriod]);

  // Use API data if available, otherwise fall back to sample data
  const isSampleData = !apiClinics || apiClinics.length === 0;
  const clinics = !isSampleData ? apiClinics : SAMPLE_CLINICS;

  // Selection & editing state
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicPhone: "",
    clinicEmail: "",
    operatingHours: ""
  });
  const [overrides, setOverrides] = useState({}); // local updated values keyed by clinicId
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const updateClinic = useUpdateClinic(selectedClinicId || 0); // safe; will not be called if 0

  const selectClinic = (c) => {
    setSelectedClinicId(c.clinicId);
    setEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
    setForm({
      clinicName: c.clinicName || "",
      clinicAddress: c.clinicAddress || "",
      clinicCity: c.clinicCity || "",
      clinicPhone: c.clinicPhone || "",
      clinicEmail: c.clinicEmail || "",
      operatingHours: c.operatingHours || ""
    });
  };
  const closePanel = () => {
    setSelectedClinicId(null);
    setEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
  };
  const updateField = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  
  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${selectedReportType.name} generated successfully!\nFormat: ${reportConfig.format.toUpperCase()}\nPeriod: ${reportConfig.startDate} to ${reportConfig.endDate}`);
      setSelectedReportType(null);
    }, 2000);
  };
  const selectedClinic = useMemo(() => {
    if (selectedClinicId == null) return null;
    const base = clinics.find(c => c.clinicId === selectedClinicId);
    if (!base) return null;
    const override = overrides[selectedClinicId];
    return override ? { ...base, ...override } : base;
  }, [selectedClinicId, clinics, overrides]);
  const handleSave = async () => {
    if (isSampleData || !selectedClinic) {
      // Sample data mode: simulate success
      setOverrides((o) => ({ ...o, [selectedClinicId]: { ...selectedClinic, ...form } }));
      setEditing(false);
      setSaveSuccess(true);
      return;
    }
    setSaveError(null);
    setSaveSuccess(false);
    const payload = {
      clinicName: form.clinicName.trim(),
      clinicAddress: form.clinicAddress.trim(),
      clinicCity: form.clinicCity.trim(),
      clinicPhone: form.clinicPhone.trim(),
      clinicEmail: form.clinicEmail.trim(),
      operatingHours: form.operatingHours.trim()
    };
    const result = await updateClinic.mutate(payload);
    if (result) {
      setOverrides((o) => ({ ...o, [selectedClinicId]: result }));
      setEditing(false);
      setSaveSuccess(true);
    } else if (updateClinic.error) {
      setSaveError(updateClinic.error);
    }
  };

  const [filters, setFilters] = useState({
    enterpriseId: "",
    clinicId: "",
    clinicName: "",
    address: "",
    email: "",
    phone: ""
  });

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      enterpriseId: "",
      clinicId: "",
      clinicName: "",
      address: "",
      email: "",
      phone: ""
    });
    setSearchedClinic(null);
    setSearchError(null);
  }, []);

  const handleSearch = async () => {
    if (!filters.clinicId || filters.clinicId.trim() === "") {
      setSearchError("Please enter a Clinic ID to search");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchedClinic(null);

    try {
      const clinicId = parseInt(filters.clinicId);
      if (isNaN(clinicId)) {
        setSearchError("Clinic ID must be a number");
        setSearching(false);
        return;
      }
      console.log("Searching for clinic ID:", clinicId);
      const response = await getClinic(clinicId);
      console.log("Raw API Response:", response);
      console.log("Response type:", typeof response);
      console.log("Is array?:", Array.isArray(response));
      
      // API returns an array, extract the first element
      const clinic = Array.isArray(response) ? response[0] : response;
      console.log("Extracted clinic:", clinic);
      console.log("Clinic properties:", {
        clinicId: clinic?.clinicId,
        clinicName: clinic?.clinicName,
        enterpriseId: clinic?.enterpriseId,
        clinicAddress: clinic?.clinicAddress,
        clinicCity: clinic?.clinicCity,
        clinicPhone: clinic?.clinicPhone,
        clinicEmail: clinic?.clinicEmail,
        operatingHours: clinic?.operatingHours
      });
      
      if (!clinic || !clinic.clinicId) {
        throw new Error("Invalid clinic data received from API");
      }
      
      setSearchedClinic(clinic);
      setSearchError(null);
    } catch (err) {
      setSearchError(err.message || "Failed to fetch clinic from API");
      setSearchedClinic(null);
    } finally {
      setSearching(false);
    }
  };

  // Dynamic filtering logic
  const filteredClinics = useMemo(() => {
    if (!clinics || clinics.length === 0) {
      // If no clinics loaded but we have a searched clinic, show it
      return searchedClinic ? [searchedClinic] : [];
    }

    // Apply filters to existing clinics
    const filtered = clinics.filter((clinic) => {
      const matchesEnterpriseId = filters.enterpriseId
        ? String(clinic.enterpriseId).includes(filters.enterpriseId)
        : true;
      const matchesClinicId = filters.clinicId
        ? String(clinic.clinicId).includes(filters.clinicId)
        : true;
      const matchesClinicName = filters.clinicName
        ? clinic.clinicName.toLowerCase().includes(filters.clinicName.toLowerCase())
        : true;
      const matchesAddress = filters.address
        ? (clinic.clinicAddress?.toLowerCase() || "").includes(filters.address.toLowerCase()) ||
          (clinic.clinicCity?.toLowerCase() || "").includes(filters.address.toLowerCase())
        : true;
      const matchesEmail = filters.email
        ? (clinic.clinicEmail?.toLowerCase() || "").includes(filters.email.toLowerCase())
        : true;
      const matchesPhone = filters.phone
        ? (clinic.clinicPhone || "").includes(filters.phone)
        : true;

      return (
        matchesEnterpriseId &&
        matchesClinicId &&
        matchesClinicName &&
        matchesAddress &&
        matchesEmail &&
        matchesPhone
      );
    });

    // Add searched clinic from API if it exists and isn't already in the list
    if (searchedClinic) {
      console.log("Adding searched clinic to results:", searchedClinic);
      const isAlreadyInList = filtered.some(c => c.clinicId === searchedClinic.clinicId);
      if (!isAlreadyInList) {
        return [searchedClinic, ...filtered]; // Add searched clinic at the beginning
      }
    }

    return filtered;
  }, [clinics, filters, searchedClinic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-peach-50/30 to-coral-50/30 pb-12">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-20 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-coral-700 via-peach-700 to-gold-700 bg-clip-text text-transparent">
                View Clinics
              </h1>
              <p className="text-stone-600 text-sm mt-1">
                Search and filter clinics by any criteria
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowReportsPanel(true)}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 via-purple-500 to-coral-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                📊 Reports & Analytics
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/clinics")}
                className="px-5 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition shadow"
              >
                ← Back
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mt-6"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-900">🔍 Filter Clinics</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={searching}
                className="text-sm px-5 py-1.5 bg-gradient-to-r from-coral-500 to-peach-500 hover:from-coral-600 hover:to-peach-600 text-white rounded-lg font-semibold transition shadow-coral disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? "Searching..." : "🔍 Search API"}
              </motion.button>
              <button
                onClick={clearFilters}
                className="text-sm px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">🏢</span>
                Enterprise ID
              </label>
              <input
                type="text"
                name="enterpriseId"
                value={filters.enterpriseId}
                onChange={(e) => updateFilter("enterpriseId", e.target.value)}
                placeholder="e.g., 1"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">🆔</span>
                Clinic ID
              </label>
              <input
                type="text"
                name="clinicId"
                value={filters.clinicId}
                onChange={(e) => updateFilter("clinicId", e.target.value)}
                placeholder="e.g., 101"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">🏥</span>
                Clinic Name
              </label>
              <input
                type="text"
                name="clinicName"
                value={filters.clinicName}
                onChange={(e) => updateFilter("clinicName", e.target.value)}
                placeholder="e.g., Downtown Dental"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">📍</span>
                Address/City
              </label>
              <input
                type="text"
                name="address"
                value={filters.address}
                onChange={(e) => updateFilter("address", e.target.value)}
                placeholder="e.g., Main Street, NYC"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">✉️</span>
                Email
              </label>
              <input
                type="text"
                name="email"
                value={filters.email}
                onChange={(e) => updateFilter("email", e.target.value)}
                placeholder="e.g., contact@clinic.com"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                <span className="mr-1">📞</span>
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={filters.phone}
                onChange={(e) => updateFilter("phone", e.target.value)}
                placeholder="e.g., 555-1234"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          {/* Search Status Messages */}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg"
            >
              <p className="text-sm text-rose-700 font-medium">❌ {searchError}</p>
            </motion.div>
          )}
          {searchedClinic && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              <p className="text-sm text-emerald-700 font-semibold">✅ Found clinic from API - Displaying below</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {(loading || searching) ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-stone-600">{searching ? "Searching for clinic..." : "Loading clinics..."}</p>
          </div>
        ) : !isSampleData && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-6">
            <p className="text-emerald-700 font-semibold">✅ Connected to API</p>
            <p className="text-xs text-stone-600 mt-1">Showing real-time clinic data</p>
          </div>
        )}
        
        {!loading && !searching && (
          <>
            {console.log("Rendering results section. filteredClinics:", filteredClinics, "length:", filteredClinics.length)}
            <div className="mb-4 text-sm text-stone-600">
              {searchedClinic ? (
                <span>Showing <span className="font-bold text-emerald-700">1 clinic</span> from API search</span>
              ) : (
                <>
                  Showing <span className="font-bold text-amber-700">{filteredClinics.length}</span> of{" "}
                  <span className="font-bold">{clinics.length}</span> clinics
                </>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {console.log("filteredClinics.length === 0?", filteredClinics.length === 0)}
              {filteredClinics.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-stone-100 rounded-xl p-8 text-center"
                >
                  <p className="text-stone-600 text-lg">No clinics match your filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {console.log("Rendering tiles, filteredClinics:", filteredClinics)}
                  {filteredClinics.map((clinic, index) => {
                    console.log(`Rendering clinic ${index}:`, clinic);
                    return (
                    <motion.div
                      key={clinic.clinicId}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      onClick={() => selectClinic(clinic)}
                      className={`relative overflow-hidden rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 cursor-pointer group ${
                        searchedClinic && clinic.clinicId === searchedClinic.clinicId
                          ? 'bg-gradient-to-br from-teal-50 via-sage-50 to-cream-50 border-2 border-teal-400 shadow-teal'
                          : 'bg-gradient-to-br from-coral-50 via-peach-50 to-gold-50 border-2 border-coral-200 shadow-coral'
                      }`}
                    >
                      {/* Decorative corner accent */}
                      <div className={`absolute top-0 right-0 w-24 h-24 opacity-30 ${
                        searchedClinic && clinic.clinicId === searchedClinic.clinicId
                          ? 'bg-gradient-to-br from-teal-400 to-sage-400'
                          : 'bg-gradient-to-br from-coral-400 to-peach-400'
                      } rounded-bl-full`}></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md ${
                                searchedClinic && clinic.clinicId === searchedClinic.clinicId
                                  ? 'bg-gradient-to-br from-teal-500 to-sage-500'
                                  : 'bg-gradient-to-br from-coral-500 to-peach-500'
                              }`}>
                                🏥
                              </div>
                              <h3 className={`text-lg font-bold leading-tight ${
                                searchedClinic && clinic.clinicId === searchedClinic.clinicId
                                  ? 'bg-gradient-to-r from-teal-700 to-sage-700 bg-clip-text text-transparent'
                                  : 'bg-gradient-to-r from-coral-700 to-peach-700 bg-clip-text text-transparent'
                              }`}>
                                {clinic.clinicName}
                              </h3>
                            </div>
                            <div className="flex gap-2 text-xs flex-wrap mb-3">
                              <span className="px-2.5 py-1 bg-gradient-to-r from-gold-100 to-peach-100 text-gold-700 rounded-full font-semibold shadow-sm">
                                🆔 {clinic.clinicId}
                              </span>
                              <span className="px-2.5 py-1 bg-gradient-to-r from-peach-100 to-coral-100 text-peach-700 rounded-full font-semibold shadow-sm">
                                🏢 Ent: {clinic.enterpriseId}
                              </span>
                              {searchedClinic && clinic.clinicId === searchedClinic.clinicId && (
                                <span className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-sage-500 text-white rounded-full font-bold shadow-teal animate-pulse">
                                  🔗 Live API
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {clinic.clinicAddress && (
                            <div className="flex items-start gap-3 p-2.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                              <span className="text-xl mt-0.5">📍</span>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-0.5">Location</p>
                                <p className="text-sm font-medium text-stone-700">
                                  {clinic.clinicAddress}
                                  {clinic.clinicCity && `, ${clinic.clinicCity}`}
                                </p>
                              </div>
                            </div>
                          )}
                          {clinic.clinicPhone && (
                            <div className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                              <span className="text-xl">📞</span>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-0.5">Phone</p>
                                <p className="text-sm font-medium text-stone-700">{clinic.clinicPhone}</p>
                              </div>
                            </div>
                          )}
                          {clinic.clinicEmail && (
                            <div className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                              <span className="text-xl">✉️</span>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-0.5">Email</p>
                                <p className="text-sm font-medium text-stone-700 truncate">{clinic.clinicEmail}</p>
                              </div>
                            </div>
                          )}
                          {clinic.operatingHours && (
                            <div className="flex items-start gap-3 p-2.5 bg-gradient-to-r from-coral-100/80 to-peach-100/60 rounded-lg border border-coral-200/50">
                              <span className="text-xl mt-0.5">🕒</span>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-0.5">Hours</p>
                                <p className="text-sm font-medium text-indigo-900">{clinic.operatingHours}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                  })}
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      {/* Details Side Panel */}
      <AnimatePresence>
        {selectedClinic && (
          <motion.div
            key="clinic-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-full max-w-xl bg-white shadow-2xl border-l border-amber-200 z-50 flex flex-col"
          >
            <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-coral-50 via-peach-50 to-gold-50">
              <div>
                <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                  🏥 {selectedClinic.clinicName}
                </h2>
                <p className="text-xs text-stone-600 mt-1">Clinic ID {selectedClinic.clinicId} · Enterprise {selectedClinic.enterpriseId}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closePanel}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 transition"
                >
                  ✕ Close
                </button>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                  >
                    ✏️ Edit
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => { setEditing(false); setForm({
                      clinicName: selectedClinic.clinicName,
                      clinicAddress: selectedClinic.clinicAddress,
                      clinicCity: selectedClinic.clinicCity,
                      clinicPhone: selectedClinic.clinicPhone,
                      clinicEmail: selectedClinic.clinicEmail,
                      operatingHours: selectedClinic.operatingHours
                    }); setSaveError(null); setSaveSuccess(false); }}
                    className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 transition"
                  >
                    Cancel
                  </button>
                )}
                {editing && (
                  <button
                    onClick={handleSave}
                    disabled={updateClinic.loading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${updateClinic.loading ? 'bg-warmGray-300 text-warmGray-500' : 'bg-gradient-to-r from-coral-500 to-peach-500 text-white hover:from-coral-600 hover:to-peach-600 shadow-coral'}`}
                  >
                    {updateClinic.loading ? 'Saving...' : '💾 Save'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {!editing && (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wider">Address</h3>
                    <p className="mt-1 text-stone-800">{selectedClinic.clinicAddress || '—'}{selectedClinic.clinicCity && `, ${selectedClinic.clinicCity}`}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wider">Phone</h3>
                      <p className="mt-1 text-stone-800">{selectedClinic.clinicPhone || '—'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wider">Email</h3>
                      <p className="mt-1 text-stone-800 truncate">{selectedClinic.clinicEmail || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-700 text-xs uppercase tracking-wider">Operating Hours</h3>
                    <p className="mt-1 text-stone-800 whitespace-pre-line text-xs leading-relaxed">{selectedClinic.operatingHours || '—'}</p>
                  </div>
                  {isSampleData && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">Sample data mode: edits will not persist to a server.</p>
                  )}
                  {saveSuccess && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md p-2">Changes saved.</p>
                  )}
                  {saveError && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2">{saveError}</p>
                  )}
                </div>
              )}
              {editing && (
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Clinic Name</label>
                    <input value={form.clinicName} onChange={(e)=>updateField('clinicName', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Address</label>
                    <input value={form.clinicAddress} onChange={(e)=>updateField('clinicAddress', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">City</label>
                    <input value={form.clinicCity} onChange={(e)=>updateField('clinicCity', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Phone</label>
                      <input value={form.clinicPhone} onChange={(e)=>updateField('clinicPhone', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Email</label>
                      <input value={form.clinicEmail} onChange={(e)=>updateField('clinicEmail', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Operating Hours</label>
                    <textarea value={form.operatingHours} onChange={(e)=>updateField('operatingHours', e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 resize-none text-xs leading-relaxed" />
                  </div>
                  {isSampleData && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">Sample data mode: save simulates success.</p>
                  )}
                  {saveError && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2">{saveError}</p>
                  )}
                  {saveSuccess && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md p-2">Changes saved.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Reports & Analytics Dashboard Panel */}
        {showReportsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReportsPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-purple-700 to-coral-700 bg-clip-text text-transparent mb-2">
                    Reports & Analytics Dashboard
                  </h2>
                  <p className="text-slate-600">Comprehensive insights, revenue tracking, and report generation</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowReportsPanel(false)}
                  className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-full font-bold shadow-md hover:shadow-lg transition-all text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView('analytics')}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${
                    activeView === 'analytics'
                      ? 'bg-gradient-to-r from-teal-500 to-sage-500 text-white'
                      : 'bg-white text-slate-700 hover:shadow-xl'
                  }`}
                >
                  <div className="text-2xl mb-1">📊</div>
                  Analytics & Insights
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView('reports')}
                  className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${
                    activeView === 'reports'
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                      : 'bg-white text-slate-700 hover:shadow-xl'
                  }`}
                >
                  <div className="text-2xl mb-1">📄</div>
                  Generate Reports
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {activeView === 'analytics' ? (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Time Period Selector */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 mb-8">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Time Period
                      </label>
                      <div className="flex gap-2">
                        {[
                          { value: 'week', label: 'Week' },
                          { value: 'month', label: 'Month' },
                          { value: 'quarter', label: 'Quarter' },
                          { value: 'year', label: 'Year' }
                        ].map(period => (
                          <motion.button
                            key={period.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTimePeriod(period.value)}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                              timePeriod === period.value
                                ? 'bg-gradient-to-r from-teal-500 to-sage-500 text-white shadow-lg'
                                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
                            }`}
                          >
                            {period.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-emerald-50 via-teal-50 to-sage-50 rounded-xl shadow-lg p-6 border border-teal-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                            💰
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ((chartData.revenue[chartData.revenue.length - 1] - chartData.revenue[0]) / chartData.revenue[0] * 100) >= 0 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {((chartData.revenue[chartData.revenue.length - 1] - chartData.revenue[0]) / chartData.revenue[0] * 100) >= 0 ? '↑' : '↓'} {Math.abs(((chartData.revenue[chartData.revenue.length - 1] - chartData.revenue[0]) / chartData.revenue[0] * 100)).toFixed(1)}%
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-teal-600 mb-1">Total Revenue</h3>
                        <p className="text-3xl font-bold text-slate-800">₹{chartData.revenue.reduce((a, b) => a + b, 0).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-slate-500 mt-2">Avg: ₹{(chartData.revenue.reduce((a, b) => a + b, 0) / chartData.revenue.length).toFixed(0)}/period</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                            👥
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ((chartData.patients[chartData.patients.length - 1] - chartData.patients[0]) / chartData.patients[0] * 100) >= 0 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {((chartData.patients[chartData.patients.length - 1] - chartData.patients[0]) / chartData.patients[0] * 100) >= 0 ? '↑' : '↓'} {Math.abs(((chartData.patients[chartData.patients.length - 1] - chartData.patients[0]) / chartData.patients[0] * 100)).toFixed(1)}%
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-indigo-600 mb-1">Total Patients</h3>
                        <p className="text-3xl font-bold text-slate-800">{chartData.patients.reduce((a, b) => a + b, 0)}</p>
                        <p className="text-xs text-slate-500 mt-2">Avg: {(chartData.patients.reduce((a, b) => a + b, 0) / chartData.patients.length).toFixed(0)}/period</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-coral-50 via-peach-50 to-gold-50 rounded-xl shadow-lg p-6 border border-coral-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-br from-coral-500 to-peach-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                            📊
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-coral-600 mb-1">Avg Revenue/Patient</h3>
                        <p className="text-3xl font-bold text-slate-800">₹{(chartData.revenue.reduce((a, b) => a + b, 0) / chartData.patients.reduce((a, b) => a + b, 0)).toFixed(0)}</p>
                        <p className="text-xs text-slate-500 mt-2">Per visit average</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-amber-50 via-gold-50 to-peach-50 rounded-xl shadow-lg p-6 border border-amber-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-br from-amber-500 to-gold-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                            📈
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-amber-600 mb-1">Peak Period</h3>
                        <p className="text-3xl font-bold text-slate-800">
                          {chartData.labels[chartData.revenue.indexOf(Math.max(...chartData.revenue))]}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">₹{Math.max(...chartData.revenue).toLocaleString('en-IN')} revenue</p>
                      </motion.div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Chart */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                            Revenue Trend
                          </h3>
                          <div className="text-sm text-slate-500">Period: {timePeriod}</div>
                        </div>
                        
                        <div className="relative h-80">
                          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
                            <span>₹{(Math.max(...chartData.revenue) * 1.1).toFixed(0)}</span>
                            <span>₹{(Math.max(...chartData.revenue) * 0.75).toFixed(0)}</span>
                            <span>₹{(Math.max(...chartData.revenue) * 0.5).toFixed(0)}</span>
                            <span>₹{(Math.max(...chartData.revenue) * 0.25).toFixed(0)}</span>
                            <span>₹0</span>
                          </div>

                          <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
                            {[0, 25, 50, 75, 100].map(percent => (
                              <div
                                key={percent}
                                className="absolute left-0 right-0 border-t border-slate-100"
                                style={{ bottom: `${percent}%` }}
                              />
                            ))}

                            <div className="absolute inset-0 flex items-end justify-around px-2">
                              {chartData.revenue.map((value, index) => {
                                const height = (value / (Math.max(...chartData.revenue) * 1.1)) * 100;
                                return (
                                  <motion.div
                                    key={index}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                                    className="relative flex-1 mx-1 group"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 via-teal-500 to-sage-400 rounded-t-lg shadow-lg hover:shadow-xl transition-shadow">
                                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        ₹{value.toLocaleString('en-IN')}
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="absolute left-16 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-slate-600 font-medium">
                            {chartData.labels.map((label, index) => (
                              <span key={index} className="flex-1 text-center">{label}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      {/* Patient Flow Chart */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-indigo-100"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            Patient Flow
                          </h3>
                          <div className="text-sm text-slate-500">Period: {timePeriod}</div>
                        </div>
                        
                        <div className="relative h-80">
                          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
                            <span>{Math.ceil(Math.max(...chartData.patients) * 1.1)}</span>
                            <span>{Math.ceil(Math.max(...chartData.patients) * 0.75)}</span>
                            <span>{Math.ceil(Math.max(...chartData.patients) * 0.5)}</span>
                            <span>{Math.ceil(Math.max(...chartData.patients) * 0.25)}</span>
                            <span>0</span>
                          </div>

                          <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
                            {[0, 25, 50, 75, 100].map(percent => (
                              <div
                                key={percent}
                                className="absolute left-0 right-0 border-t border-slate-100"
                                style={{ bottom: `${percent}%` }}
                              />
                            ))}

                            <svg className="absolute inset-0 overflow-visible">
                              <defs>
                                <linearGradient id="patientGradientModal" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                                </linearGradient>
                                <linearGradient id="lineGradientModal" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                                  <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                                </linearGradient>
                              </defs>
                              
                              <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 1 }}
                                d={`M 0 ${100 - (chartData.patients[0] / (Math.max(...chartData.patients) * 1.1) * 100)}% ${chartData.patients.map((value, index) => {
                                  const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                                  const y = 100 - (value / (Math.max(...chartData.patients) * 1.1) * 100);
                                  return `L ${x}% ${y}%`;
                                }).join(' ')} L 100% 100% L 0 100% Z`}
                                fill="url(#patientGradientModal)"
                              />
                              
                              <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.6, duration: 1 }}
                                d={`M 0 ${100 - (chartData.patients[0] / (Math.max(...chartData.patients) * 1.1) * 100)}% ${chartData.patients.map((value, index) => {
                                  const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                                  const y = 100 - (value / (Math.max(...chartData.patients) * 1.1) * 100);
                                  return `L ${x}% ${y}%`;
                                }).join(' ')}`}
                                fill="none"
                                stroke="url(#lineGradientModal)"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />

                              {chartData.patients.map((value, index) => {
                                const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                                const y = 100 - (value / (Math.max(...chartData.patients) * 1.1) * 100);
                                return (
                                  <g key={index}>
                                    <motion.circle
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.7 + index * 0.05 }}
                                      cx={`${x}%`}
                                      cy={`${y}%`}
                                      r="6"
                                      fill="white"
                                      stroke="rgb(99, 102, 241)"
                                      strokeWidth="3"
                                      className="hover:r-8 transition-all cursor-pointer"
                                    />
                                    <title>{value} patients</title>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>

                          <div className="absolute left-16 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-slate-600 font-medium">
                            {chartData.labels.map((label, index) => (
                              <span key={index} className="flex-1 text-center">{label}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reports"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Report Types Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {REPORT_TYPES.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          onClick={() => setSelectedReportType(report)}
                          className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 cursor-pointer hover:shadow-2xl transition-all"
                        >
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                            {report.icon}
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">{report.name}</h3>
                          <p className="text-sm text-slate-600">{report.description}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Report Configuration Modal */}
                    <AnimatePresence>
                      {selectedReportType && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                          onClick={() => setSelectedReportType(null)}
                        >
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedReportType.color} flex items-center justify-center text-2xl`}>
                                  {selectedReportType.icon}
                                </div>
                                <div>
                                  <h2 className="text-2xl font-bold text-slate-800">{selectedReportType.name}</h2>
                                  <p className="text-sm text-slate-600">{selectedReportType.description}</p>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedReportType(null)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                              >
                                ✕
                              </motion.button>
                            </div>

                            <div className="space-y-4 mb-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={reportConfig.startDate}
                                    onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    value={reportConfig.endDate}
                                    onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                  Report Format
                                </label>
                                <select
                                  value={reportConfig.format}
                                  onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
                                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                                >
                                  <option value="pdf">PDF Document</option>
                                  <option value="excel">Excel Spreadsheet</option>
                                  <option value="csv">CSV File</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={reportConfig.includeCharts}
                                    onChange={(e) => setReportConfig({...reportConfig, includeCharts: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-400"
                                  />
                                  <span className="text-sm font-medium text-slate-700">Include Charts & Graphs</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={reportConfig.includeDetails}
                                    onChange={(e) => setReportConfig({...reportConfig, includeDetails: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-400"
                                  />
                                  <span className="text-sm font-medium text-slate-700">Include Detailed Breakdown</span>
                                </label>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedReportType(null)}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateReport}
                                disabled={!reportConfig.startDate || !reportConfig.endDate || isGenerating}
                                className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
                                  !reportConfig.startDate || !reportConfig.endDate || isGenerating
                                    ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-xl'
                                }`}
                              >
                                {isGenerating ? '⏳ Generating...' : '📥 Generate Report'}
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
