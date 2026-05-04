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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load clinic and doctors on modal open
  useEffect(() => {
    if (isOpen) {
      loadClinicAndDoctors();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
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
        console.log("📋 API Response - Doctor List:", doctors);
        if (doctors && doctors.length > 0) {
          console.log("📋 First Doctor Sample:", JSON.stringify(doctors[0], null, 2));
        }
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
      const filtered = doctorsList.filter(doctor => {
        const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.toLowerCase();
        const specialty = (doctor.specialty?.toLowerCase() || '');
        const doctorId = (doctor.doctorId?.toString().toLowerCase() || '');
        const searchLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || specialty.includes(searchLower) || doctorId.includes(searchLower);
      });
      setFilteredDoctors(filtered);
    }
    setCurrentPage(1); // Reset to first page when search term changes
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

  // Pagination helpers
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
            className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[92vh] overflow-hidden border-2 border-emerald-100"
          >
            {/* Modal Header - Enhanced */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-12 py-8 flex items-center justify-between relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-32 -mt-32"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-white flex items-center gap-3">
                  <span className="text-5xl">💰</span>
                  Salary Management Hub
                </h2>
                {clinicInfo && (
                  <p className="text-emerald-100 text-base mt-3 font-semibold">🏥 {clinicInfo.clinicName}</p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-white hover:bg-white/30 rounded-full p-3 transition-all shadow-lg relative z-10"
              >
                <span className="text-2xl">✕</span>
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(92vh-140px)] bg-gradient-to-b from-white via-slate-50 to-slate-100">
              <AnimatePresence mode="wait">
                {!selectedDoctor ? (
                  // List View
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-12"
                  >
                    {/* Search Bar - Enhanced */}
                    <div className="mb-10">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search by doctor name, specialty, or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-7 py-5 border-2 border-emerald-300 rounded-2xl focus:ring-4 focus:ring-emerald-400 focus:border-transparent outline-none font-medium text-slate-800 placeholder-slate-500 transition-all shadow-md hover:shadow-lg text-base"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">↵</span>
                      </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                      <motion.div
                        className="flex flex-col items-center justify-center py-24"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-20 h-20 border-5 border-emerald-200 border-t-emerald-600 rounded-full mb-6"
                        />
                        <p className="text-lg text-slate-600 font-semibold">Loading doctors...</p>
                      </motion.div>
                    ) : error ? (
                      <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-red-50 to-rose-50 border-3 border-red-300 rounded-2xl p-8 text-red-700 font-bold text-center shadow-md"
                      >
                        <p className="text-xl mb-2">⚠️ Oops!</p>
                        <p>{error}</p>
                      </motion.div>
                    ) : filteredDoctors.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-16 text-center border-3 border-dashed border-slate-300"
                      >
                        <p className="text-7xl mb-6">👨‍⚕️</p>
                        <p className="text-2xl font-bold text-slate-700 mb-3">No doctors found</p>
                        <p className="text-slate-600 text-lg">
                          {searchTerm ? "Try adjusting your search terms" : "No doctors available for this clinic"}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                          {paginatedDoctors.map((doctor, idx) => (
                            <motion.div
                              key={doctor.doctorId}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.06 }}
                              onClick={() => handleSelectDoctor(doctor)}
                              className="group relative h-full bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl hover:scale-[1.06]"
                            >
                              {/* Top accent bar */}
                              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-md"></div>
                              
                              {/* Floating decoration */}
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                              
                              <div className="p-7 relative z-10 flex flex-col h-full">
                                {/* Avatar and Name Section */}
                                <div className="flex items-start gap-5 mb-5">
                                  <motion.div 
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg"
                                  >
                                    {doctor.firstName && doctor.firstName.length > 0 
                                      ? doctor.firstName.charAt(0).toUpperCase()
                                      : '👨'}
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight">
                                      {doctor.firstName || doctor.lastName 
                                        ? `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
                                        : 'Dr. [Name Not Available]'
                                      }
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-2 font-semibold uppercase tracking-wide">Doctor</p>
                                  </div>
                                </div>

                                {/* Info Section */}
                                <div className="space-y-3 mb-6 flex-grow">
                                  {/* Doctor ID */}
                                  <div className="bg-slate-100 rounded-lg p-3.5 border border-slate-300 group-hover:bg-slate-200 transition-colors">
                                    <p className="text-xs text-slate-700 font-bold mb-1.5 uppercase tracking-wide">ID</p>
                                    <p className="text-sm font-bold text-emerald-700 break-all font-mono">{doctor.doctorId || 'N/A'}</p>
                                  </div>

                                  {/* Specialty */}
                                  {doctor.specialty && (
                                    <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-300 group-hover:bg-emerald-100 transition-colors">
                                      <p className="text-xs text-emerald-700 font-bold mb-1.5 uppercase tracking-wide">Specialty</p>
                                      <p className="text-sm font-semibold text-emerald-900 line-clamp-2">{doctor.specialty}</p>
                                    </div>
                                  )}

                                  {/* Qualification if available */}
                                  {doctor.qualification && (
                                    <div className="bg-blue-50 rounded-lg p-3.5 border border-blue-300 group-hover:bg-blue-100 transition-colors">
                                      <p className="text-xs text-blue-700 font-bold mb-1.5 uppercase tracking-wide">Qualification</p>
                                      <p className="text-sm font-semibold text-blue-900 line-clamp-2">{doctor.qualification}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Action Button */}
                                <motion.button
                                  whileHover={{ scale: 1.08, y: -3 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(doctor);
                                  }}
                                  className="w-full px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 text-center"
                                >
                                  Manage Salary ➜
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* Enhanced Pagination Controls */}
                        {totalPages > 1 && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-4 mt-12 pt-8 border-t-2 border-slate-300 flex-wrap bg-gradient-to-r from-slate-50 via-emerald-50 to-slate-50 rounded-2xl p-8 shadow-md"
                          >
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                              ← Previous
                            </motion.button>
                            
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <motion.button
                                  key={page}
                                  whileHover={{ scale: 1.12 }}
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-11 h-11 rounded-lg font-bold transition-all shadow-md ${
                                    currentPage === page
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-110'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:shadow-lg'
                                  }`}
                                >
                                  {page}
                                </motion.button>
                              ))}
                            </div>
                            
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 rounded-xl font-bold transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                              Next →
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // Detail View
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-12"
                  >
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-12 border-2 border-emerald-200 text-center"
                    >
                      <p className="text-7xl mb-6 drop-shadow-lg">👨‍⚕️</p>
                      <p className="text-3xl font-black text-slate-800 mb-3 bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                        Dr. {selectedDoctor.firstName || ''} {selectedDoctor.lastName || ''}
                      </p>
                      <p className="text-lg text-emerald-700 font-bold mb-8">{selectedDoctor.specialty || 'Specialist'}</p>
                      
                      <div className="flex flex-col md:flex-row gap-5 justify-center mt-8">
                        <motion.button
                          whileHover={{ scale: 1.08, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewDetails(selectedDoctor)}
                          className="px-10 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all text-lg"
                        >
                          Proceed to Salary Details ➜
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleBackToList}
                          className="px-10 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-lg"
                        >
                          ← Back to List
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer - Enhanced */}
            <div className="border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 via-emerald-50 to-slate-50 px-12 py-6 flex items-center justify-between shadow-inner">
              <p className="text-base text-slate-700 font-semibold">
                {!selectedDoctor && filteredDoctors.length > 0 && (
                  <>
                    <span className="text-emerald-600">●</span> Showing <strong className="text-emerald-700">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDoctors.length)}</strong> of <strong className="text-emerald-700">{filteredDoctors.length}</strong> doctor{filteredDoctors.length !== 1 ? 's' : ''}
                  </>
                )}
              </p>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500 text-slate-800 font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Close ✓
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SalaryManagementModal;
