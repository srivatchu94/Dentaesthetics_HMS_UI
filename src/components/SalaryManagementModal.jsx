import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getSelectedAccess } from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

const SalaryManagementModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [doctorsList, setDoctorsList] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);

  // Load clinic and doctors on modal open
  useEffect(() => {
    if (isOpen) {
      loadClinicAndDoctors();
    }
  }, [isOpen]);

  const loadClinicAndDoctors = async () => {
    setIsLoading(true);
    setError("");
    try {
      const access = getSelectedAccess();
      if (!access?.clinicId) {
        setError("❌ No clinic ID found in your access");
        setIsLoading(false);
        return;
      }

      // Fetch clinic details
      const clinicResponse = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${access.clinicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (clinicResponse.ok) {
        const clinicData = await clinicResponse.json();
        setClinicInfo(clinicData);
      }

      // Fetch doctors for the clinic
      const doctorsResponse = await fetch(`${API_BASE_URL}/DoctorProfile/GetDoctorsByClinicID?clinicId=${access.clinicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (doctorsResponse.ok) {
        const doctors = await doctorsResponse.json();
        setDoctorsList(doctors);
        setFilteredDoctors(doctors);
      } else {
        setError("❌ Failed to fetch doctors");
      }
    } catch (err) {
      console.error("Error loading clinic and doctors:", err);
      setError("❌ Error loading data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter doctors based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDoctors(doctorsList);
    } else {
      const filtered = doctorsList.filter(doctor =>
        (doctor.doctorName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (doctor.specialty?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (doctor.doctorId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctorsList]);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleViewDetails = (doctor) => {
    onClose();
    navigate(`/salary/doctor/${doctor.doctorId}`, {
      state: { doctor: doctor }
    });
  };

  const handleBackToList = () => {
    setSelectedDoctor(null);
    setSearchTerm("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <span className="text-4xl">💰</span>
                  Salary Management
                </h2>
                {clinicInfo && (
                  <p className="text-emerald-100 text-sm mt-2">🏥 {clinicInfo.clinicName}</p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                ✕
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
              <AnimatePresence mode="wait">
                {!selectedDoctor ? (
                  // List View
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-8"
                  >
                    {/* Search Bar */}
                    <div className="mb-6">
                      <input
                        type="text"
                        placeholder="🔍 Search doctor by name, specialty, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-slate-800 placeholder-slate-500 transition-all"
                      />
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-emerald-300 border-t-emerald-600 rounded-full mx-auto"
                      />
                    ) : error ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-red-700 font-semibold text-center"
                      >
                        {error}
                      </motion.div>
                    ) : filteredDoctors.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-300"
                      >
                        <p className="text-6xl mb-4">👨‍⚕️</p>
                        <p className="text-xl font-bold text-slate-700 mb-2">No doctors found</p>
                        <p className="text-slate-500">
                          {searchTerm ? "Try adjusting your search terms" : "No doctors available for this clinic"}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {filteredDoctors.map((doctor, idx) => (
                          <motion.div
                            key={doctor.doctorId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleSelectDoctor(doctor)}
                            className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-xl p-6 cursor-pointer transition-all shadow-md hover:shadow-xl hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                                {doctor.doctorName?.[0] || '👨‍⚕️'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 truncate">
                                  Dr. {doctor.doctorName}
                                </h3>
                                <p className="text-sm text-slate-600 mb-1">ID: {doctor.doctorId}</p>
                                <p className="text-sm text-emerald-700 font-semibold mb-3">
                                  {doctor.specialty || "Specialist"}
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(doctor);
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all"
                                >
                                  View Details →
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  // Detail View (optional, could navigate directly instead)
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-8"
                  >
                    <div className="text-center">
                      <p className="text-5xl mb-4">👨‍⚕️</p>
                      <p className="text-2xl font-bold text-slate-800 mb-2">Dr. {selectedDoctor.doctorName}</p>
                      <p className="text-slate-600 mb-6">{selectedDoctor.specialty}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(selectedDoctor)}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all mb-4"
                      >
                        Proceed to Salary Details
                      </motion.button>
                      <button
                        onClick={handleBackToList}
                        className="text-slate-600 hover:text-slate-800 font-semibold"
                      >
                        ← Back to List
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {!selectedDoctor && filteredDoctors.length > 0 && (
                  <>Showing <strong>{filteredDoctors.length}</strong> doctor{filteredDoctors.length !== 1 ? 's' : ''}</>
                )}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg font-semibold transition-all"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalaryManagementModal;
