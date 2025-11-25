import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listDoctorProfiles } from "../services/doctorService";
import { listClinics } from "../services/clinicService";

export default function DoctorClinicMapping() {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Uncomment when API is ready
      // const [doctorsData, clinicsData] = await Promise.all([
      //   listDoctorProfiles(),
      //   listClinics()
      // ]);
      // setDoctors(doctorsData);
      // setClinics(clinicsData);
      
      // Dummy data for demonstration
      const dummyDoctors = [
        {
          doctorId: 1,
          staffId: 1001,
          firstName: "Sarah",
          lastName: "Johnson",
          specialtyId: 1,
          branchId: 1,
          employmentStatus: "Full-time"
        },
        {
          doctorId: 2,
          staffId: 1002,
          firstName: "Michael",
          lastName: "Chen",
          specialtyId: 2,
          branchId: 1,
          employmentStatus: "Full-time"
        },
        {
          doctorId: 3,
          staffId: 1003,
          firstName: "Emily",
          lastName: "Rodriguez",
          specialtyId: 3,
          branchId: 2,
          employmentStatus: "Part-time"
        },
        {
          doctorId: 4,
          staffId: 1004,
          firstName: "David",
          lastName: "Patel",
          specialtyId: 1,
          branchId: 2,
          employmentStatus: "Visiting"
        },
        {
          doctorId: 5,
          staffId: 1005,
          firstName: "Jessica",
          lastName: "Thompson",
          specialtyId: 4,
          branchId: 3,
          employmentStatus: "Full-time"
        },
        {
          doctorId: 6,
          staffId: 1006,
          firstName: "Ahmed",
          lastName: "Hassan",
          specialtyId: 2,
          branchId: 3,
          employmentStatus: "Consultant"
        },
        {
          doctorId: 7,
          staffId: 1007,
          firstName: "Maria",
          lastName: "Garcia",
          specialtyId: 5,
          branchId: 1,
          employmentStatus: "Full-time"
        },
        {
          doctorId: 8,
          staffId: 1008,
          firstName: "James",
          lastName: "Wilson",
          specialtyId: 3,
          branchId: 2,
          employmentStatus: "Part-time"
        }
      ];

      const dummyClinics = [
        {
          clinicId: 1,
          clinicName: "Downtown Medical Center",
          location: "123 Main Street, Downtown",
          phone: "+1-555-1000",
          email: "downtown@clinic.com"
        },
        {
          clinicId: 2,
          clinicName: "Westside Family Clinic",
          location: "456 West Avenue, Westside",
          phone: "+1-555-2000",
          email: "westside@clinic.com"
        },
        {
          clinicId: 3,
          clinicName: "Northgate Health Center",
          location: "789 North Boulevard, Northgate",
          phone: "+1-555-3000",
          email: "northgate@clinic.com"
        },
        {
          clinicId: 4,
          clinicName: "Riverside Wellness Clinic",
          location: "321 River Road, Riverside",
          phone: "+1-555-4000",
          email: "riverside@clinic.com"
        },
        {
          clinicId: 5,
          clinicName: "Sunrise Medical Plaza",
          location: "654 Sunrise Drive, East End",
          phone: "+1-555-5000",
          email: "sunrise@clinic.com"
        },
        {
          clinicId: 6,
          clinicName: "Central Care Clinic",
          location: "987 Central Avenue, Midtown",
          phone: "+1-555-6000",
          email: "central@clinic.com"
        },
        {
          clinicId: 7,
          clinicName: "Lakeside Medical Group",
          location: "147 Lake Shore Drive, Lakeside",
          phone: "+1-555-7000",
          email: "lakeside@clinic.com"
        },
        {
          clinicId: 8,
          clinicName: "Hillcrest Specialty Clinic",
          location: "258 Hill Street, Hillcrest",
          phone: "+1-555-8000",
          email: "hillcrest@clinic.com"
        },
        {
          clinicId: 9,
          clinicName: "Parkview Community Health",
          location: "369 Park Avenue, Parkview",
          phone: "+1-555-9000",
          email: "parkview@clinic.com"
        },
        {
          clinicId: 10,
          clinicName: "Meadowbrook Medical Center",
          location: "741 Meadow Lane, Meadowbrook",
          phone: "+1-555-1100",
          email: "meadowbrook@clinic.com"
        }
      ];
      
      setDoctors(dummyDoctors);
      setClinics(dummyClinics);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    // Pre-select doctor's current clinic
    setSelectedClinics([doctor.branchId]);
  };

  const toggleClinicSelection = (clinicId) => {
    setSelectedClinics(prev => {
      if (prev.includes(clinicId)) {
        return prev.filter(id => id !== clinicId);
      } else {
        return [...prev, clinicId];
      }
    });
  };

  const handleSaveMapping = async () => {
    if (!selectedDoctor) {
      alert("Please select a doctor first.");
      return;
    }

    if (selectedClinics.length === 0) {
      alert("Please select at least one clinic.");
      return;
    }

    try {
      // Here you would call your mapping API
      console.log("Mapping Doctor:", selectedDoctor.doctorId);
      console.log("To Clinics:", selectedClinics);
      
      alert(`Successfully mapped Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} to ${selectedClinics.length} clinic(s)!`);
      
      // Reset selections
      setSelectedDoctor(null);
      setSelectedClinics([]);
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Failed to save mapping. Please try again.");
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.staffId.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <span className="text-5xl">🔗</span>
            Doctor-Clinic Mapping
          </h1>
          <p className="text-purple-100 mt-2">Map doctors to multiple clinic locations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctors List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                <span>👨‍⚕️</span>
                Select Doctor
              </h2>
              <span className="text-sm text-gray-600">{doctors.length} doctors</span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or staff ID..."
                className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Doctors List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading doctors...</p>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No doctors found</p>
              ) : (
                filteredDoctors.map((doctor) => (
                  <motion.div
                    key={doctor.doctorId}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDoctor?.doctorId === doctor.doctorId
                        ? "border-indigo-500 bg-indigo-50 shadow-lg"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">Staff ID: {doctor.staffId}</p>
                        <p className="text-xs text-gray-500">
                          Specialty ID: {doctor.specialtyId} • {doctor.employmentStatus}
                        </p>
                      </div>
                      {selectedDoctor?.doctorId === doctor.doctorId && (
                        <span className="text-3xl">✅</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Clinics Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                <span>🏥</span>
                Select Clinics
              </h2>
              <span className="text-sm text-gray-600">
                {selectedClinics.length} selected
              </span>
            </div>

            {!selectedDoctor ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-6xl mb-4">👈</span>
                <p className="text-lg">Select a doctor first</p>
              </div>
            ) : (
              <>
                {/* Selected Doctor Info */}
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 mb-6 border-2 border-indigo-300">
                  <p className="text-sm text-gray-600">Mapping for:</p>
                  <h3 className="text-xl font-bold text-indigo-900">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">Staff ID: {selectedDoctor.staffId}</p>
                </div>

                {/* Clinics Display - Chip View */}
                <div className="max-h-[450px] overflow-y-auto pr-2 mb-6">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading clinics...</p>
                  ) : clinics.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No clinics found</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {clinics.map((clinic) => (
                        <motion.button
                          key={clinic.clinicId}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleClinicSelection(clinic.clinicId)}
                          className={`px-4 py-3 rounded-full font-semibold transition-all shadow-md ${
                            selectedClinics.includes(clinic.clinicId)
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                              : "bg-white text-gray-700 hover:bg-purple-50 border-2 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {selectedClinics.includes(clinic.clinicId) ? "✓" : "🏥"}
                            </span>
                            <div className="text-left">
                              <div className="text-sm font-bold">{clinic.clinicName}</div>
                              <div className="text-xs opacity-80">{clinic.location.split(',')[0]}</div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setSelectedClinics([]);
                    }}
                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleSaveMapping}
                    disabled={selectedClinics.length === 0}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💾 Save Mapping
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Summary Card */}
        {selectedDoctor && selectedClinics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-300"
          >
            <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              Mapping Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Doctor:</p>
                <p className="font-bold text-gray-900">
                  Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </p>
                <p className="text-sm text-gray-600">Staff ID: {selectedDoctor.staffId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Selected Clinics ({selectedClinics.length}):</p>
                <div className="space-y-1">
                  {selectedClinics.map(clinicId => {
                    const clinic = clinics.find(c => c.clinicId === clinicId);
                    return clinic ? (
                      <p key={clinicId} className="text-sm text-gray-700">
                        • {clinic.clinicName}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
