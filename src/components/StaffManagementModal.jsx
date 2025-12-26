import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getStaffProfileByClinicId, updateStaffDetail } from "../services/staffService";
import { getClinicsByEnterpriseId } from "../services/doctorService";

const StaffManagementModal = ({ isOpen, onClose, clinicIds, enterpriseId }) => {
  const [staffList, setStaffList] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({});

  // Load clinics when modal opens
  useEffect(() => {
    if (isOpen && enterpriseId) {
      loadClinics();
    }
  }, [isOpen, enterpriseId]);

  // Load staff when clinic is selected
  useEffect(() => {
    if (selectedClinicId) {
      loadStaffForClinic(selectedClinicId);
    }
  }, [selectedClinicId]);

  const loadClinics = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClinicsByEnterpriseId(enterpriseId);
      
      if (Array.isArray(data) && data.length > 0) {
        // Filter by clinicIds if provided
        const filteredClinics = clinicIds 
          ? data.filter(c => clinicIds.includes(c.clinicId))
          : data;
        
        setClinics(filteredClinics);
        
        // If only one clinic, auto-select it
        if (filteredClinics.length === 1) {
          setSelectedClinicId(filteredClinics[0].clinicId);
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

  const loadStaffForClinic = async (clinicId) => {
    setStaffLoading(true);
    setError("");
    setStaffList([]);
    setSelectedStaffId(null);
    setSelectedStaff(null);
    
    try {
      const data = await getStaffProfileByClinicId(clinicId);
      
      if (Array.isArray(data) && data.length > 0) {
        setStaffList(data);
      } else {
        setError("No staff found for this clinic");
      }
    } catch (err) {
      setError(`Failed to load staff: ${err.message}`);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffSelect = (staffId) => {
    const staff = staffList.find(s => s.staffId === staffId);
    if (staff) {
      setSelectedStaffId(staffId);
      setSelectedStaff(staff);
      setFormData({ ...staff });
      setSuccessMessage("");
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedStaff) return;

    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      await updateStaffDetail(selectedStaff.staffId, formData);
      setSuccessMessage("✅ Staff information updated successfully!");
      
      // Update the staff in the local state
      setStaffList(prev => prev.map(s => 
        s.staffId === selectedStaff.staffId ? formData : s
      ));
      setSelectedStaff(formData);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(`Failed to save staff information: ${err.message}`);
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl">
                  👥
                </div>
                <div>
                  <h2 className="text-xl font-bold text-teal-900">Staff Management</h2>
                  <p className="text-sm text-stone-600">Manage clinic staff and their profiles</p>
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                  <p className="text-stone-600">Loading clinic information...</p>
                </div>
              ) : clinics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏥</div>
                  <p className="text-stone-700 font-semibold text-lg">No Clinics Found</p>
                  <p className="text-stone-500 mt-2">Unable to load clinic data. Please try again or contact support.</p>
                  <button
                    onClick={() => loadClinics()}
                    className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
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
                        onChange={(e) => setSelectedClinicId(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">-- Select a Clinic --</option>
                        {clinics.map(clinic => (
                          <option key={clinic.clinicId} value={clinic.clinicId}>
                            {clinic.clinicName} - {clinic.clinicCity}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Staff List and Details */}
                  {selectedClinicId && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Staff List */}
                      <div className="md:col-span-1">
                        <h3 className="font-bold text-stone-800 mb-3">Staff Members</h3>
                        {staffLoading ? (
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2"></div>
                            <p className="text-stone-600 text-sm">Loading staff...</p>
                          </div>
                        ) : staffList.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="text-4xl mb-2">👥</div>
                            <p className="text-stone-700 font-semibold">No Staff Found</p>
                            <p className="text-stone-500 text-sm mt-1">This clinic has no staff members yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {staffList.map(staff => (
                              <motion.button
                                key={staff.staffId}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleStaffSelect(staff.staffId)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                                  selectedStaffId === staff.staffId
                                    ? "border-teal-500 bg-teal-50"
                                    : "border-stone-200 bg-white hover:border-teal-300"
                                }`}
                              >
                                <p className="font-semibold text-stone-800">
                                  {staff.firstName} {staff.lastName}
                                </p>
                                <p className="text-xs text-stone-600">ID: {staff.staffId}</p>
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Staff Details */}
                      <div className="md:col-span-2">
                        {selectedStaff ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 bg-stone-50 rounded-lg p-6"
                          >
                            <h3 className="font-bold text-stone-800 mb-4">Staff Details</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                              {/* First Name */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.firstName || ""}
                                  onChange={(e) => handleFormChange("firstName", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Last Name */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.lastName || ""}
                                  onChange={(e) => handleFormChange("lastName", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Email */}
                              <div className="col-span-2">
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  value={formData.email || ""}
                                  onChange={(e) => handleFormChange("email", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Phone */}
                              <div className="col-span-2">
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Phone
                                </label>
                                <input
                                  type="tel"
                                  value={formData.phone || formData.phoneNumber || ""}
                                  onChange={(e) => handleFormChange("phone", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Date of Birth */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Date of Birth
                                </label>
                                <input
                                  type="date"
                                  value={formData.dateOfBirth || ""}
                                  onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Gender */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Gender
                                </label>
                                <select
                                  value={formData.gender || ""}
                                  onChange={(e) => handleFormChange("gender", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              {/* License Number */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  License Number
                                </label>
                                <input
                                  type="text"
                                  value={formData.licenseNumber || ""}
                                  onChange={(e) => handleFormChange("licenseNumber", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* License Expiry */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  License Expiry
                                </label>
                                <input
                                  type="date"
                                  value={formData.licenseExpiry || ""}
                                  onChange={(e) => handleFormChange("licenseExpiry", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Years of Experience */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Years of Experience
                                </label>
                                <input
                                  type="number"
                                  value={formData.yearsExperience || ""}
                                  onChange={(e) => handleFormChange("yearsExperience", e.target.value ? parseInt(e.target.value) : null)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>

                              {/* Employment Status */}
                              <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Employment Status
                                </label>
                                <select
                                  value={formData.employmentStatus || ""}
                                  onChange={(e) => handleFormChange("employmentStatus", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                  <option value="">Select Status</option>
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                  <option value="On Leave">On Leave</option>
                                </select>
                              </div>

                              {/* Address */}
                              <div className="col-span-2">
                                <label className="block text-sm font-semibold text-stone-700 mb-2">
                                  Address
                                </label>
                                <input
                                  type="text"
                                  value={formData.address || ""}
                                  onChange={(e) => handleFormChange("address", e.target.value)}
                                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="text-center py-12 bg-stone-50 rounded-lg text-stone-600">
                            <p>Select a staff member to view details</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {selectedStaff && !staffLoading && (
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
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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

export default StaffManagementModal;
