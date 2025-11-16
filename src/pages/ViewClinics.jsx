import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClinics, useUpdateClinic } from "../services/hooks";

// Sample clinic data for demonstration
const SAMPLE_CLINICS = [
  {
    clinicId: 101,
    enterpriseId: 1,
    clinicName: "Downtown Dental Care",
    clinicAddress: "123 Main Street, Suite 200",
    clinicCity: "New York",
    clinicPhone: "555-0101",
    clinicEmail: "contact@downtowndental.com",
    operatingHours: "Mon-Fri 9:00 AM - 6:00 PM, Sat 9:00 AM - 2:00 PM"
  },
  {
    clinicId: 102,
    enterpriseId: 1,
    clinicName: "Smile Center Brooklyn",
    clinicAddress: "456 Brooklyn Avenue",
    clinicCity: "Brooklyn",
    clinicPhone: "555-0102",
    clinicEmail: "info@smilebrooklyn.com",
    operatingHours: "Mon-Fri 8:00 AM - 5:00 PM"
  },
  {
    clinicId: 103,
    enterpriseId: 2,
    clinicName: "Elite Dental Spa",
    clinicAddress: "789 Park Avenue, Floor 3",
    clinicCity: "Manhattan",
    clinicPhone: "555-0103",
    clinicEmail: "appointments@elitedentalspa.com",
    operatingHours: "Mon-Sat 10:00 AM - 7:00 PM"
  },
  {
    clinicId: 104,
    enterpriseId: 1,
    clinicName: "Family Dental Queens",
    clinicAddress: "321 Queens Boulevard",
    clinicCity: "Queens",
    clinicPhone: "555-0104",
    clinicEmail: "care@familydentalqueens.com",
    operatingHours: "Tue-Sat 9:00 AM - 6:00 PM"
  },
  {
    clinicId: 105,
    enterpriseId: 2,
    clinicName: "Bright Smiles Staten Island",
    clinicAddress: "654 Richmond Avenue",
    clinicCity: "Staten Island",
    clinicPhone: "555-0105",
    clinicEmail: "hello@brightsmiles-si.com",
    operatingHours: "Mon-Fri 8:30 AM - 5:30 PM, Sat 9:00 AM - 1:00 PM"
  },
  {
    clinicId: 106,
    enterpriseId: 3,
    clinicName: "Premier Dental Bronx",
    clinicAddress: "987 Grand Concourse",
    clinicCity: "Bronx",
    clinicPhone: "555-0106",
    clinicEmail: "reception@premierdentalbronx.com",
    operatingHours: "Mon-Thu 9:00 AM - 7:00 PM, Fri 9:00 AM - 4:00 PM"
  }
];

export default function ViewClinics() {
  const navigate = useNavigate();
  const { data: apiClinics, loading, error } = useClinics();

  // Use API data if available, otherwise fall back to sample data
  const isSampleData = !(apiClinics && apiClinics.length > 0);
  const clinics = isSampleData ? SAMPLE_CLINICS : apiClinics;

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
  }, []);

  // Dynamic filtering logic
  const filteredClinics = useMemo(() => {
    if (!clinics || clinics.length === 0) return [];

    return clinics.filter((clinic) => {
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
  }, [clinics, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-rose-50/30 pb-12">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-20 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-700 via-rose-700 to-orange-700 bg-clip-text text-transparent">
                View Clinics
              </h1>
              <p className="text-stone-600 text-sm mt-1">
                Search and filter clinics by any criteria
              </p>
            </div>
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

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mt-6"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-900">🔍 Filter Clinics</h2>
            <button
              onClick={clearFilters}
              className="text-sm px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition"
            >
              Clear All
            </button>
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
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-stone-600">Loading clinics...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-6">
            <p className="text-amber-700 font-semibold">⚠️ Using sample data</p>
            <p className="text-sm text-amber-600 mt-2">API connection failed: {error}</p>
            <p className="text-xs text-stone-600 mt-1">Showing demo clinics for testing</p>
          </div>
        ) : null}
        
        {(loading ? false : true) && (
          <>
            <div className="mb-4 text-sm text-stone-600">
              Showing <span className="font-bold text-amber-700">{filteredClinics.length}</span> of{" "}
              <span className="font-bold">{clinics.length}</span> clinics
            </div>

            <AnimatePresence mode="popLayout">
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
                  {filteredClinics.map((clinic, index) => (
                    <motion.div
                      key={clinic.clinicId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => selectClinic(clinic)}
                      className="bg-white rounded-xl shadow-lg border border-amber-100/60 p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-amber-900 mb-1">
                            {clinic.clinicName}
                          </h3>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                              ID: {clinic.clinicId}
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full font-medium">
                              Ent: {clinic.enterpriseId}
                            </span>
                          </div>
                        </div>
                        <span className="text-2xl group-hover:scale-110 transition">🏥</span>
                      </div>

                      <div className="space-y-2 text-sm text-stone-700">
                        {clinic.clinicAddress && (
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 mt-0.5">📍</span>
                            <span className="flex-1">
                              {clinic.clinicAddress}
                              {clinic.clinicCity && `, ${clinic.clinicCity}`}
                            </span>
                          </div>
                        )}
                        {clinic.clinicPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">📞</span>
                            <span>{clinic.clinicPhone}</span>
                          </div>
                        )}
                        {clinic.clinicEmail && (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">✉️</span>
                            <span className="truncate">{clinic.clinicEmail}</span>
                          </div>
                        )}
                        {clinic.operatingHours && (
                          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-stone-200">
                            <span className="text-amber-600 mt-0.5">🕒</span>
                            <span className="text-xs text-stone-600 flex-1">
                              {clinic.operatingHours}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
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
            <div className="p-5 border-b flex items-start justify-between bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50">
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${updateClinic.loading ? 'bg-stone-300 text-stone-500' : 'bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 text-white hover:from-amber-700 hover:via-rose-700 hover:to-orange-700'}`}
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
      </AnimatePresence>
    </div>
  );
}
