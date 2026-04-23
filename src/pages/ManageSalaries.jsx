import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSelectedAccess } from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function ManageSalaries() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  
  // State variables
  const [salarySearchClinicId, setSalarySearchClinicId] = useState("");
  const [salarySearchResults, setSalarySearchResults] = useState([]);
  const [salarySearchLoading, setSalarySearchLoading] = useState(false);
  const [salarySearchError, setSalarySearchError] = useState("");
  const [salaryClinics, setSalaryClinics] = useState([]);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Load clinics for salary management from user's token on mount
  useEffect(() => {
    loadClinicsForSalary();
    setPageLoaded(true);
    // Scroll to top smoothly
    if (pageRef.current) {
      pageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load clinics for salary management from user's token
  const loadClinicsForSalary = async () => {
    const access = getSelectedAccess();
    if (!access?.clinicId) {
      console.warn("❌ No clinic ID found in token");
      setSalaryClinics([]);
      return;
    }

    try {
      // Fetch clinic details using the clinicId from token
      const response = await fetch(`${API_BASE_URL}/Clinic/GetClinicByID?id=${access.clinicId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🏥 Clinic loaded for salary:", data);
        const clinics = Array.isArray(data) ? data : (data.data ? Array.isArray(data.data) ? data.data : [data] : [data]);
        setSalaryClinics(clinics);
        // Pre-populate with user's clinic
        setSalarySearchClinicId(access.clinicId.toString());
      }
    } catch (error) {
      console.error("Error loading clinic for salary:", error);
      setSalaryClinics([]);
    }
  };

  // Search doctors by clinic for salary management
  const handleSalaryDoctorSearch = async () => {
    if (!salarySearchClinicId) {
      setSalarySearchError("⚠️ Please select a clinic");
      return;
    }

    setSalarySearchLoading(true);
    setSalarySearchError("");
    
    try {
      console.log("📡 Calling API: GetDoctorsByClinicID with ClinicID=", salarySearchClinicId);
      const response = await fetch(
        `${API_BASE_URL}/DoctorProfile/GetDoctorsByClinicID?ClinicID=${salarySearchClinicId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Doctors loaded from GetDoctorsByClinicID:", data);
        const doctors = Array.isArray(data) ? data : data.data || [];
        
        // Enrich doctors with payroll data
        const enrichedDoctors = doctors.map(doctor => ({
          ...doctor,
          fixedSalary: doctor.fixedSalary || 0,
          totalPatientsThisMonth: doctor.totalPatientsThisMonth || 0,
          totalRevenueGenerated: doctor.totalRevenueGenerated || 0,
          lastSalaryUpdate: doctor.lastSalaryUpdate || null
        }));
        
        setSalarySearchResults(enrichedDoctors);
        if (enrichedDoctors.length === 0) {
          setSalarySearchError("ℹ️ No doctors found for this clinic");
        }
      } else {
        setSalarySearchError("❌ Failed to fetch doctors. Please try again.");
      }
    } catch (error) {
      console.error("Error searching doctors for salary:", error);
      setSalarySearchError("❌ Error fetching doctors: " + error.message);
      setSalarySearchResults([]);
    } finally {
      setSalarySearchLoading(false);
    }
  };

  // Function to navigate to doctor salary details page
  const handleViewDoctorSalaryDetails = (doctor) => {
    // Navigate to the doctor salary details page with doctor data as state
    navigate(`/salary/doctor/${doctor.doctorId}`, {
      state: { doctor: doctor }
    });
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">
              💰 Manage Salaries
            </h1>
            <p className="text-slate-600">Search and manage staff salaries</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            ← Back
          </motion.button>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-emerald-100"
      >
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span>🔍</span> Find Doctor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <label className="block text-sm font-bold text-slate-700 mb-3">
              🏥 Select Your Clinic
            </label>
            {salaryClinics.length > 0 ? (
              <div className="w-full px-6 py-4 border-2 border-emerald-400 rounded-lg bg-white font-semibold text-slate-800 flex items-center gap-3 shadow-md">
                <span className="text-2xl">🏥</span>
                <span>{salaryClinics[0]?.clinicName || "Your Clinic"}</span>
              </div>
            ) : (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full px-6 py-4 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-500 font-medium"
              >
                Loading clinic...
              </motion.div>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSalaryDoctorSearch}
            disabled={salarySearchLoading || !salarySearchClinicId}
            className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {salarySearchLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                🔄
              </motion.span>
            ) : (
              "🔍"
            )} {salarySearchLoading ? " Searching..." : " Search Doctors"}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: salarySearchResults.length > 0 ? 1 : 0, x: salarySearchResults.length > 0 ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            {salarySearchResults.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-md"
              >
                <span className="text-2xl">✓</span>
                <span className="font-bold text-emerald-700">{salarySearchResults.length} Doctor{salarySearchResults.length !== 1 ? 's' : ''}</span>
              </motion.span>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {salarySearchError && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 bg-red-50 border-2 border-red-400 rounded-lg p-4 text-red-700 font-bold"
            >
              ⚠️ {salarySearchError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {salarySearchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👨‍⚕️
              </motion.span>
              Available Doctors ({salarySearchResults.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salarySearchResults.map((doctor, idx) => (
                <motion.div
                  key={doctor.doctorId || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.25)" }}
                  className="bg-white rounded-lg shadow-lg p-6 border-2 border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
                >
                  {/* Doctor Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                    >
                      {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-800">
                        {doctor.firstName} {doctor.lastName}
                      </h4>
                      <p className="text-sm text-emerald-600 font-semibold">
                        {doctor.specialtyName || doctor.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg">
                    {doctor.registrationNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-medium">Reg. No.</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{doctor.registrationNumber}</span>
                      </div>
                    )}
                    {doctor.fixedSalary > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-medium">Fixed Salary</span>
                        <span className="text-base font-bold text-emerald-700">₹{doctor.fixedSalary.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewDoctorSalaryDetails(doctor)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    👁️ View Details
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {salarySearchResults.length === 0 && !salarySearchLoading && !salarySearchError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-slate-50 rounded-lg p-16 text-center border-2 border-dashed border-slate-300"
        >
          <motion.p
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🔍
          </motion.p>
          <p className="text-xl text-slate-700 font-bold mb-2">Click search to find doctors</p>
          <p className="text-slate-500">Select your clinic and search to view salary information</p>
        </motion.div>
      )}
    </div>
  );
}
