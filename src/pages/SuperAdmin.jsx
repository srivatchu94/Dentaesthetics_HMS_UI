import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUPERADMIN_ENDPOINTS = {
  insert: "https://localhost:7104/api/SuperAdmin/Insert",
  list: "https://localhost:7104/api/SuperAdmin/All",
  update: (id) => `https://localhost:7104/api/SuperAdmin/EditSuperAdmin?id=${encodeURIComponent(id)}`,
  delete: (id) => `https://localhost:7104/api/SuperAdmin/DeleteSuperAdmin?id=${encodeURIComponent(id)}`
};

const ENTERPRISE_ENDPOINTS = {
  list: "https://localhost:7104/api/Enterprise/All"
};

const CLINIC_ENDPOINTS = {
  list: "https://localhost:7104/api/Clinic/All"
};

const initialForm = {
  adminId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  phone: "",
  address: "",
  education: "",
  languages: "",
  yearsExperience: "",
  joiningDate: "",
  employmentStatus: "Active",
  availability: "",
  isActive: true
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

export default function SuperAdmin(){
  const [activeCard, setActiveCard] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ name: "", isEdit: false });

  const filteredList = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return superAdmins;
    return superAdmins.filter((item) => {
      const fields = [
        item.firstName,
        item.lastName,
        item.email,
        item.phone,
        item.education,
        item.languages
      ].map((f) => (f || "").toString().toLowerCase());
      return fields.some((f) => f.includes(query));
    });
  }, [filterQuery, superAdmins]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setError("");
    setSuccess("");
  };

  const fetchSuperAdmins = async () => {
    try {
      setListLoading(true);
      setError("");
      const response = await fetch(SUPERADMIN_ENDPOINTS.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!response.ok) {
        throw new Error(`Unable to load super admins (${response.status})`);
      }
      const data = await response.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      const normalized = payload.map((item) => ({
        adminId: item.adminId || item.adminID || item.id || "",
        firstName: item.firstName || item.first_name || "",
        lastName: item.lastName || item.last_name || "",
        dateOfBirth: item.dateOfBirth || item.dob || item.DateOfBirth || "",
        gender: item.gender || item.Gender || "",
        email: item.email || item.Email || "",
        phone: item.phone || item.Phone || "",
        address: item.address || item.Address || "",
        education: item.education || item.Education || "",
        languages: item.languages || item.Languages || "",
        yearsExperience: item.yearsExperience ?? item.YearsExperience ?? "",
        joiningDate: item.joiningDate || item.JoiningDate || "",
        employmentStatus: item.employmentStatus || item.EmploymentStatus || "",
        availability: item.availability || item.Availability || "",
        createdAt: item.createdAt || item.CreatedAt || "",
        updatedAt: item.updatedAt || item.UpdatedAt || "",
        isActive: item.isActive ?? item.IsActive ?? true
      }));
      setSuperAdmins(normalized);
    } catch (err) {
      setError(err.message || "Failed to fetch super admins");
    } finally {
      setListLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.email) {
      setError("First name, last name, and email are required");
      return;
    }

    const isEditing = Boolean(editingId);
    
    // Build payload - exclude AdminId from body when editing (sent as query param)
    const payload = {
      FirstName: form.firstName,
      LastName: form.lastName,
      DateOfBirth: toIsoOrNull(form.dateOfBirth),
      Gender: form.gender,
      Email: form.email,
      Phone: form.phone,
      Address: form.address,
      Education: form.education,
      Languages: form.languages,
      YearsExperience: form.yearsExperience ? Number(form.yearsExperience) : 0,
      JoiningDate: toIsoOrNull(form.joiningDate),
      EmploymentStatus: form.employmentStatus,
      Availability: form.availability,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      IsActive: !!form.isActive
    };

    const endpoint = isEditing ? SUPERADMIN_ENDPOINTS.update(editingId) : SUPERADMIN_ENDPOINTS.insert;
    const method = isEditing ? "PUT" : "POST";

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.status !== 204) {
        const message = await response.text();
        throw new Error(message || "Unable to save super admin");
      }

      // Show success modal
      setSuccessData({
        name: `${form.firstName} ${form.lastName}`,
        isEdit: isEditing
      });
      setShowSuccessModal(true);
      setForm(initialForm);
      setEditingId("");
      fetchSuperAdmins();
    } catch (err) {
      setError(err.message || "Something went wrong while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setActiveCard("onboard");
    setEditingId(admin.adminId);
    setForm({
      adminId: admin.adminId || "",
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      dateOfBirth: toInputDate(admin.dateOfBirth),
      gender: admin.gender || "",
      address: admin.address || "",
      education: admin.education || "",
      languages: admin.languages || "",
      yearsExperience: admin.yearsExperience ?? "",
      joiningDate: toInputDate(admin.joiningDate),
      employmentStatus: admin.employmentStatus || "Active",
      availability: admin.availability || "",
      isActive: admin.isActive !== undefined ? !!admin.isActive : true
    });
  };

  const handleView = (admin) => {
    setViewingAdmin(admin);
    setShowViewModal(true);
  };

  const handleDelete = (admin) => {
    setDeletingAdmin(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingAdmin) return;

    try {
      setListLoading(true);
      setError("");
      console.log("🗑️ Deleting super admin:", deletingAdmin.adminId);
      console.log("📡 DELETE URL:", SUPERADMIN_ENDPOINTS.delete(deletingAdmin.adminId));
      
      const response = await fetch(SUPERADMIN_ENDPOINTS.delete(deletingAdmin.adminId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);
      
      if (!response.ok && response.status !== 204) {
        const contentType = response.headers.get("content-type");
        console.log("📡 Content-Type:", contentType);
        
        let message = "";
        try {
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            message = data.message || data.error || JSON.stringify(data);
          } else {
            message = await response.text();
          }
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          message = `HTTP ${response.status} ${response.statusText}`;
        }
        
        console.error("❌ Delete failed:", message);
        throw new Error(message || `Unable to delete super admin (HTTP ${response.status})`);
      }
      
      console.log("✅ Delete successful");
      setSuccess("Super admin deleted successfully");
      setShowDeleteModal(false);
      setDeletingAdmin(null);
      fetchSuperAdmins();
    } catch (err) {
      console.error("❌ Delete error:", err);
      setError(err.message || "Failed to delete super admin");
      setShowDeleteModal(false);
    } finally {
      setListLoading(false);
    }
  };

  const fetchEnterprises = async () => {
    try {
      setEnterpriseLoading(true);
      setError("");
      const response = await fetch(ENTERPRISE_ENDPOINTS.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!response.ok) {
        throw new Error(`Unable to load enterprises (${response.status})`);
      }
      const data = await response.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      const normalized = payload.map((item) => ({
        enterpriseId: item.enterpriseId || item.enterpriseID || item.id || "",
        enterpriseName: item.enterpriseName || item.name || "",
        enterpriseEmail: item.enterpriseEmail || item.email || "",
        enterprisePhone: item.enterprisePhone || item.phone || "",
        isActive: item.isActive ?? item.IsActive ?? true
      }));
      setEnterprises(normalized);
    } catch (err) {
      setError(err.message || "Failed to fetch enterprises");
    } finally {
      setEnterpriseLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      setClinicLoading(true);
      setError("");
      const response = await fetch(CLINIC_ENDPOINTS.list, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`
        }
      });
      if (!response.ok) {
        throw new Error(`Unable to load clinics (${response.status})`);
      }
      const data = await response.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      const normalized = payload.map((item) => ({
        clinicId: item.clinicId || item.clinicID || item.id || "",
        enterpriseId: item.enterpriseId || item.enterpriseID || "",
        clinicName: item.clinicName || item.name || "",
        clinicCity: item.clinicCity || item.city || "",
        clinicPhone: item.clinicPhone || item.phone || "",
        clinicEmail: item.clinicEmail || item.email || "",
        operatingHours: item.operatingHours || ""
      }));
      setClinics(normalized);
    } catch (err) {
      setError(err.message || "Failed to fetch clinics");
    } finally {
      setClinicLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const activeAccent = activeCard === "onboard" ? "from-teal-500 to-emerald-500" : "from-indigo-500 to-purple-500";

  const sections = [
    {
      id: 'superadmin-management',
      title: "🛡️ Super Admin Management",
      description: "Manage super administrators and their access",
      gradient: "from-amber-500 via-orange-500 to-rose-600",
      bgGradient: "from-amber-50 to-rose-50",
      options: [
        {
          id: 'onboard-superadmin',
          title: "✨ Onboard Super Admin",
          description: "Add new super administrator",
          icon: "➕",
          color: "from-teal-500 to-emerald-500",
          action: () => setActiveCard("onboard")
        },
        {
          id: 'view-superadmins',
          title: "📋 View Super Admins",
          description: "Browse and manage super admins",
          icon: "👁️",
          color: "from-indigo-500 to-purple-500",
          action: () => {
            setActiveCard("view");
            fetchSuperAdmins();
          }
        }
      ]
    },
    {
      id: 'enterprise-management',
      title: "🏢 Enterprise Management",
      description: "Manage enterprises and clinics across the organization",
      gradient: "from-blue-500 via-cyan-500 to-teal-600",
      bgGradient: "from-blue-50 to-teal-50",
      options: [
        {
          id: 'view-enterprises',
          title: "🏢 View Enterprises",
          description: "Browse all enterprises",
          icon: "🏢",
          color: "from-blue-500 to-cyan-500",
          action: () => {
            setActiveCard("enterprises");
            fetchEnterprises();
          }
        },
        {
          id: 'view-clinics',
          title: "🏥 View Clinics",
          description: "Browse all clinics",
          icon: "🏥",
          color: "from-green-500 to-teal-500",
          action: () => {
            setActiveCard("clinics");
            fetchClinics();
          }
        }
      ]
    }
  ];

  const handleCardClick = (option) => {
    if (option.action) {
      option.action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-8 shadow-2xl mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
          />
          
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-white mb-3 flex items-center gap-4"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl"
              >
                🛡️
              </motion.span>
              Super Admin Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/90"
            >
              Centralized control room for super administrator management
            </motion.p>
          </div>
        </motion.div>

        {/* Sections */}
        {!activeCard && (
        <div className="space-y-8">
          {sections.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * sectionIdx }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${section.bgGradient} p-6 shadow-lg border border-white/50`}
            >
              {/* Section Header */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${section.gradient} p-6 mb-6 shadow-lg`}>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
                  <p className="text-white/90">{section.description}</p>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.options.map((option, idx) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCardClick(option)}
                    className="relative group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer text-left border border-slate-100"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      }}
                    />
                    
                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                        {option.icon}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-purple-600 transition-all">
                        {option.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {option.description}
                      </p>
                    </div>

                    {/* Hover Shine Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }}
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 0.6,
                        ease: 'easeInOut',
                        repeat: 0,
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {/* Content Area - Onboard/View Forms */}
        <AnimatePresence mode="wait">
          {activeCard === "onboard" && (
            <motion.div
              key="onboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${activeAccent} opacity-10`} />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-teal-700 flex items-center gap-2">{editingId ? "Editing existing record" : "New onboarding"}</p>
                  <h2 className="text-2xl font-bold text-slate-800">Onboard Super Admin</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-500">Fields with * are required</div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCard(null);
                      setForm(initialForm);
                      setEditingId("");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}
              {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="e.g., +1 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      max={toInputDate(new Date())}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status</label>
                    <select
                      name="employmentStatus"
                      value={form.employmentStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Education</label>
                    <input
                      type="text"
                      name="education"
                      value={form.education}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Highest qualification"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Languages</label>
                    <input
                      type="text"
                      name="languages"
                      value={form.languages}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="English, Hindi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Years Experience</label>
                    <input
                      type="number"
                      min="0"
                      name="yearsExperience"
                      value={form.yearsExperience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Availability</label>
                    <input
                      type="text"
                      name="availability"
                      value={form.availability}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Weekdays 9 AM - 6 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Street, City, Country"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? "Saving..." : editingId ? "Update Super Admin" : "Onboard Super Admin"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(""); setForm(initialForm); }}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
              </div>
            </motion.div>
          )}

          {activeCard === "view" && (
            <motion.div
              key="view-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${activeAccent} opacity-10`} />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-700">Live roster</p>
                  <h2 className="text-2xl font-bold text-slate-800">View Super Admins</h2>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search name, email, language"
                    className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  <button
                    onClick={fetchSuperAdmins}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}
              {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">{success}</div>}

              <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      {["Name", "Email", "Phone", "Experience", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                    ) : filteredList.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No super admins found</td></tr>
                    ) : (
                      filteredList.map((admin, idx) => (
                        <tr key={admin.adminId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 text-slate-800 font-semibold">{admin.firstName} {admin.lastName}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.email}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.phone}</td>
                          <td className="px-4 py-3 text-slate-700">{admin.yearsExperience || 0} yrs</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${admin.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                              {admin.employmentStatus || (admin.isActive ? "Active" : "Inactive")}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => handleView(admin)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(admin)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(admin)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

          {activeCard === "enterprises" && (
            <motion.div
              key="enterprises-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Directory</p>
                    <h2 className="text-2xl font-bold text-slate-800">View Enterprises</h2>
                  </div>
                  <button
                    onClick={fetchEnterprises}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>

                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}

                <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {["Enterprise ID", "Name", "Location", "Contact Phone", "Contact Email"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enterpriseLoading ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                      ) : enterprises.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No enterprises found</td></tr>
                      ) : (
                        enterprises.map((enterprise, idx) => (
                          <tr key={enterprise.enterpriseId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{enterprise.enterpriseId}</td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{enterprise.enterpriseName}</td>
                            <td className="px-4 py-3 text-slate-700">{enterprise.headquartersLocation}</td>
                            <td className="px-4 py-3 text-slate-700">{enterprise.contactPhone}</td>
                            <td className="px-4 py-3 text-slate-700">{enterprise.contactEmail}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeCard === "clinics" && (
            <motion.div
              key="clinics-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl border border-slate-100/80 bg-white/95 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10" />
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Directory</p>
                    <h2 className="text-2xl font-bold text-slate-800">View Clinics</h2>
                  </div>
                  <button
                    onClick={fetchClinics}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg"
                  >
                    Refresh
                  </button>
                </div>

                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>}

                <div className="overflow-x-auto border border-slate-100/80 rounded-2xl bg-white/95 shadow-sm backdrop-blur-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        {["Clinic ID", "Enterprise ID", "Name", "City", "Phone", "Email", "Hours"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clinicLoading ? (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
                      ) : clinics.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No clinics found</td></tr>
                      ) : (
                        clinics.map((clinic, idx) => (
                          <tr key={clinic.clinicId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{clinic.clinicId}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.enterpriseId}</td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">{clinic.clinicName}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.clinicCity}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.clinicPhone}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.clinicEmail}</td>
                            <td className="px-4 py-3 text-slate-700">{clinic.operatingHours}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Details Modal */}
        <AnimatePresence>
          {showViewModal && viewingAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-2xl shadow-lg">👤</div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{viewingAdmin.firstName} {viewingAdmin.lastName}</h2>
                        <p className="text-sm text-slate-600">Super Admin Details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                      <p className="text-slate-800">{viewingAdmin.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                      <p className="text-slate-800">{viewingAdmin.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Gender</p>
                      <p className="text-slate-800">{viewingAdmin.gender || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</p>
                      <p className="text-slate-800">{viewingAdmin.dateOfBirth ? toInputDate(viewingAdmin.dateOfBirth) : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Years of Experience</p>
                      <p className="text-slate-800">{viewingAdmin.yearsExperience || 0} years</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Joining Date</p>
                      <p className="text-slate-800">{viewingAdmin.joiningDate ? toInputDate(viewingAdmin.joiningDate) : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Employment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        viewingAdmin.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {viewingAdmin.employmentStatus || (viewingAdmin.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Education</p>
                      <p className="text-slate-800">{viewingAdmin.education || 'N/A'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Languages</p>
                      <p className="text-slate-800">{viewingAdmin.languages || 'N/A'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Availability</p>
                      <p className="text-slate-800">{viewingAdmin.availability || 'N/A'}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                      <p className="text-slate-800">{viewingAdmin.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEdit(viewingAdmin);
                      }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && deletingAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white flex items-center justify-center text-2xl shadow-lg">⚠️</div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Confirm Delete</h2>
                      <p className="text-sm text-slate-600">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                    <p className="text-slate-800">
                      Are you sure you want to delete super admin <span className="font-semibold">{deletingAdmin.firstName} {deletingAdmin.lastName}</span>?
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Email: {deletingAdmin.email}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={confirmDelete}
                      disabled={listLoading}
                      className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
                    >
                      {listLoading ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletingAdmin(null);
                      }}
                      disabled={listLoading}
                      className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:border-slate-300 font-semibold disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Flyer Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowSuccessModal(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 opacity-95">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl"
                  />
                  <motion.div
                    animate={{
                      scale: [1.2, 1, 1.2],
                      rotate: [360, 180, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 p-10 text-center">
                  {/* Success Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring",
                      damping: 15,
                      stiffness: 200
                    }}
                    className="mx-auto w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center mb-6"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl"
                    >
                      ✨
                    </motion.span>
                  </motion.div>

                  {/* Success Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-4xl font-bold text-white mb-3">
                      {successData.isEdit ? "Updated Successfully!" : "Welcome Aboard!"}
                    </h2>
                    <p className="text-xl text-white/90 mb-2">
                      <span className="font-semibold">{successData.name}</span>
                    </p>
                    <p className="text-white/80 mb-6">
                      {successData.isEdit 
                        ? "Super admin details have been updated" 
                        : "has been successfully onboarded as a Super Admin"}
                    </p>

                    {/* Decorative Stars */}
                    <div className="flex justify-center gap-3 mb-8">
                      {[...Array(5)].map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="text-2xl"
                        >
                          ⭐
                        </motion.span>
                      ))}
                    </div>

                    {/* Close Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      onClick={() => setShowSuccessModal(false)}
                      className="px-8 py-4 rounded-2xl bg-white text-teal-600 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                    >
                      Awesome! 🎉
                    </motion.button>
                  </motion.div>

                  {/* Confetti Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          y: "50%",
                          x: `${50}%`,
                          opacity: 0 
                        }}
                        animate={{ 
                          y: [`50%`, `${Math.random() * 100}%`],
                          x: [`50%`, `${Math.random() * 100}%`],
                          opacity: [0, 1, 0],
                          rotate: [0, Math.random() * 360]
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          delay: Math.random() * 0.5,
                          repeat: Infinity,
                          repeatDelay: Math.random() * 3
                        }}
                        className="absolute w-2 h-2 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Close Button Top Right */}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
