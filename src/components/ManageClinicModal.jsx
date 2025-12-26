import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getClinicByClinicId, updateClinic } from "../services/clinicService";

const ManageClinicModal = ({ isOpen, onClose, clinicIds }) => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({});

  // Load clinics when modal opens
  useEffect(() => {
    if (isOpen && clinicIds && clinicIds.length > 0) {
      loadClinics();
    }
  }, [isOpen, clinicIds]);

  const loadClinics = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClinicByClinicId(clinicIds);
      
      if (Array.isArray(data) && data.length > 0) {
        setClinics(data);
        // If only one clinic, auto-select it
        if (data.length === 1) {
          setSelectedClinicId(data[0].clinicId);
          setSelectedClinic(data[0]);
          setFormData(data[0]);
        }
      } else {
        setError("No clinics found");
      }
    } catch (err) {
      setError(`Failed to load clinics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClinicSelect = (clinicId) => {
    const clinic = clinics.find(c => c.clinicId === clinicId);
    if (clinic) {
      setSelectedClinicId(clinicId);
      setSelectedClinic(clinic);
      setFormData({ ...clinic });
      setSuccessMessage("");
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedClinic) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      console.group('💾 SAVING CLINIC CHANGES');
      console.log('Clinic ID:', selectedClinic.clinicId);
      console.log('Updated data:', formData);
      
      await updateClinic(selectedClinic.clinicId, formData);
      
      console.log('✅ Clinic updated successfully');
      console.groupEnd();
      
      setSuccessMessage("✅ Clinic information updated successfully!");
      
      // Update the clinic in the local state
      setClinics(prev => prev.map(c => 
        c.clinicId === selectedClinic.clinicId ? formData : c
      ));
      setSelectedClinic(formData);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error('❌ Error saving clinic:', err);
      setError(`Failed to save clinic information: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl">
                  ⚙️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-900">Manage Clinic Settings</h2>
                  <p className="text-sm text-stone-600">Edit clinic information and preferences</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-stone-500 hover:text-stone-700 text-2xl transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              {/* Success Message */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
                >
                  {successMessage}
                </motion.div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-stone-600">Loading clinic information...</p>
                </div>
              ) : clinics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-stone-700 font-semibold text-lg">No Clinics Found</p>
                  <p className="text-stone-500 mt-2">Unable to load clinic data. Please try again or contact support.</p>
                  <button
                    onClick={() => loadClinics()}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : (
                <>
                  {/* Clinic Selector Dropdown */}
                  {clinics.length > 1 && (
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">
                        Select Clinic
                      </label>
                      <select
                        value={selectedClinicId || ""}
                        onChange={(e) => handleClinicSelect(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select a Clinic --</option>
                        {clinics.map(clinic => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName} - {clinic.clinicAddress}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Clinic Details Form */}
                  {selectedClinic && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 bg-stone-50 rounded-lg p-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Clinic Name */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Clinic Name *
                          </label>
                          <input
                            type="text"
                            value={formData.clinicName || ""}
                            onChange={(e) => handleFormChange("clinicName", e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Clinic City */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.clinicCity || ""}
                            onChange={(e) => handleFormChange("clinicCity", e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Clinic Address */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            value={formData.clinicAddress || ""}
                            onChange={(e) => handleFormChange("clinicAddress", e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            value={formData.clinicPhone || ""}
                            onChange={(e) => handleFormChange("clinicPhone", e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={formData.clinicEmail || ""}
                            onChange={(e) => handleFormChange("clinicEmail", e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Operating Hours */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Operating Hours
                          </label>
                          <input
                            type="text"
                            value={formData.operatingHours || ""}
                            onChange={(e) => handleFormChange("operatingHours", e.target.value)}
                            placeholder="e.g., Mon-Fri 9:00 AM - 6:00 PM"
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {selectedClinic && !loading && (
              <div className="sticky bottom-0 bg-stone-50 border-t border-stone-200 p-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManageClinicModal;
