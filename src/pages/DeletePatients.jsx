import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function DeletePatients() {
  const navigate = useNavigate();

  // Filters
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: "",
  });

  // Mock data and local state for deletion
  const [patients, setPatients] = useState([
    {
      patientId: 1,
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      gender: "Male",
      clinicId: 1,
      phoneNumber: "+1 555-0101",
    },
    {
      patientId: 2,
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "1985-08-22",
      gender: "Female",
      clinicId: 1,
      phoneNumber: "+1 555-0102",
    },
    {
      patientId: 3,
      firstName: "Alex",
      lastName: "Martin",
      dateOfBirth: "1992-03-02",
      gender: "Other",
      clinicId: 2,
      phoneNumber: "+1 555-0103",
    },
  ]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (filterData.firstName && !p.firstName.toLowerCase().includes(filterData.firstName.toLowerCase())) return false;
      if (filterData.lastName && !p.lastName.toLowerCase().includes(filterData.lastName.toLowerCase())) return false;
      if (filterData.dateOfBirth && p.dateOfBirth !== filterData.dateOfBirth) return false;
      if (filterData.patientId && p.patientId !== parseInt(filterData.patientId)) return false;
      if (filterData.clinicId && p.clinicId !== parseInt(filterData.clinicId)) return false;
      return true;
    });
  }, [patients, filterData]);

  // Confirm and success modal state
  const [confirmPatient, setConfirmPatient] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const requestDelete = (patient) => setConfirmPatient(patient);

  const handleDeleteConfirmed = () => {
    if (!confirmPatient) return;
    const { patientId, firstName, lastName } = confirmPatient;
    setPatients((prev) => prev.filter((p) => p.patientId !== patientId));
    setConfirmPatient(null);
    setSuccessInfo({ patientId, name: `${firstName} ${lastName}` });
  };

  const closeSuccess = () => {
    setSuccessInfo(null);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Delete Patient Records</h1>
              <p className="text-amber-50">Find patients with filters and safely delete</p>
            </div>
            <button
              onClick={() => navigate("/patients")}
              className="px-6 py-3 bg-white text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition shadow-lg"
            >
              ← Back to Patients
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filter Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 border border-stone-200 mb-6"
        >
          <h2 className="text-xl font-bold text-amber-900 mb-4">Filter Patients</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Patient ID</label>
              <input
                type="number"
                value={filterData.patientId}
                onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                placeholder="Enter patient ID"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">First Name</label>
              <input
                type="text"
                value={filterData.firstName}
                onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                placeholder="Search by first name"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Last Name</label>
              <input
                type="text"
                value={filterData.lastName}
                onChange={(e) => setFilterData({ ...filterData, lastName: e.target.value })}
                placeholder="Search by last name"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={filterData.dateOfBirth}
                onChange={(e) => setFilterData({ ...filterData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Clinic ID</label>
              <input
                type="number"
                value={filterData.clinicId}
                onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                placeholder="Enter clinic ID"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="mb-3">
          <p className="text-sm text-stone-600">
            Found <span className="font-semibold text-amber-700">{filteredPatients.length}</span> patient(s)
          </p>
        </div>

        <AnimatePresence>
          {filteredPatients.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPatients.map((patient) => (
                <motion.div
                  key={patient.patientId}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white border-2 border-stone-200 rounded-lg p-6 shadow-md hover:shadow-xl hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-amber-900">{patient.firstName} {patient.lastName}</h4>
                      <p className="text-sm text-stone-500">ID: {patient.patientId}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">DOB:</span>
                      <span className="font-medium text-stone-800">{patient.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Gender:</span>
                      <span className="font-medium text-stone-800">{patient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Clinic ID:</span>
                      <span className="font-medium text-stone-800">{patient.clinicId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Phone:</span>
                      <span className="font-medium text-stone-800">{patient.phoneNumber}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between gap-3">
                    <button
                      onClick={() => requestDelete(patient)}
                      className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition text-sm shadow"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/patients/view`)}
                      className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-semibold hover:bg-stone-200 transition text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-stone-500 text-lg">No patients found matching your criteria</p>
              <p className="text-stone-400 text-sm mt-2">Try adjusting your filters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-200"
            >
              <h3 className="text-xl font-bold text-rose-700 mb-2">Confirm Deletion</h3>
              <p className="text-stone-700 mb-4">
                Are you sure you want to delete the record for
                {" "}
                <span className="font-semibold">{confirmPatient.firstName} {confirmPatient.lastName}</span>
                {" "}(ID: {confirmPatient.patientId})?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmPatient(null)}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition shadow"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {successInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-stone-200 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-2xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-emerald-700 mb-2">Record Deleted</h3>
              <p className="text-stone-700 mb-5">
                Patient <span className="font-semibold">{successInfo.name}</span> (ID: {successInfo.patientId}) was deleted successfully.
              </p>
              <button
                onClick={closeSuccess}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition shadow"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
