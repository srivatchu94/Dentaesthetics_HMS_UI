import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function ViewPatients() {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState("search");
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: ""
  });
  const [selectedClinicId, setSelectedClinicId] = useState("");

  // Mock patient data (replace with API call)
  const mockPatients = [
    { patientId: 1, firstName: "John", lastName: "Doe", dateOfBirth: "1990-05-15", gender: "Male", clinicId: 1, phoneNumber: "+1 555-0101", email: "john.doe@email.com", registrationDate: "2024-01-15" },
    { patientId: 2, firstName: "Jane", lastName: "Smith", dateOfBirth: "1985-08-22", gender: "Female", clinicId: 1, phoneNumber: "+1 555-0102", email: "jane.smith@email.com", registrationDate: "2024-02-20" },
    { patientId: 3, firstName: "Michael", lastName: "Johnson", dateOfBirth: "1978-12-10", gender: "Male", clinicId: 2, phoneNumber: "+1 555-0103", email: "michael.j@email.com", registrationDate: "2024-03-10" },
    { patientId: 4, firstName: "Emily", lastName: "Williams", dateOfBirth: "1992-03-28", gender: "Female", clinicId: 2, phoneNumber: "+1 555-0104", email: "emily.w@email.com", registrationDate: "2024-04-05" },
    { patientId: 5, firstName: "Robert", lastName: "Brown", dateOfBirth: "1988-07-14", gender: "Male", clinicId: 1, phoneNumber: "+1 555-0105", email: "robert.b@email.com", registrationDate: "2024-05-12" },
  ];

  const mockClinics = [
    { clinicId: 1, clinicName: "Downtown Dental Clinic" },
    { clinicId: 2, clinicName: "Eastside Dental Care" },
    { clinicId: 3, clinicName: "Westside Family Dentistry" }
  ];

  // Filter patients based on search criteria
  const filteredPatients = mockPatients.filter(patient => {
    if (filterData.firstName && !patient.firstName.toLowerCase().includes(filterData.firstName.toLowerCase())) return false;
    if (filterData.lastName && !patient.lastName.toLowerCase().includes(filterData.lastName.toLowerCase())) return false;
    if (filterData.dateOfBirth && patient.dateOfBirth !== filterData.dateOfBirth) return false;
    if (filterData.patientId && patient.patientId !== parseInt(filterData.patientId)) return false;
    if (filterData.clinicId && patient.clinicId !== parseInt(filterData.clinicId)) return false;
    return true;
  });

  // Filter patients by selected clinic
  const clinicPatients = selectedClinicId 
    ? mockPatients.filter(p => p.clinicId === parseInt(selectedClinicId))
    : [];

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">View Patients</h1>
              <p className="text-amber-50">Search and filter patient records</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Tab Selector */}
          <div className="flex gap-4 mb-6 border-b border-stone-200">
            <button
              onClick={() => setViewTab("search")}
              className={`px-6 py-3 font-semibold transition-all ${
                viewTab === "search"
                  ? "text-amber-700 border-b-2 border-amber-600"
                  : "text-stone-500 hover:text-amber-600"
              }`}
            >
              🔍 Search Patients
            </button>
            <button
              onClick={() => setViewTab("clinic")}
              className={`px-6 py-3 font-semibold transition-all ${
                viewTab === "clinic"
                  ? "text-amber-700 border-b-2 border-amber-600"
                  : "text-stone-500 hover:text-amber-600"
              }`}
            >
              🏥 By Clinic
            </button>
          </div>

          {/* Search Patients Tab */}
          {viewTab === "search" && (
            <div>
              {/* Filter Section */}
              <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">Filter Patients</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-stone-700 mb-2">Clinic ID</label>
                    <input
                      type="number"
                      value={filterData.clinicId}
                      onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                      placeholder="Enter clinic ID"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
                      className="w-full px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-stone-600">
                    Showing <span className="font-semibold text-amber-700">{filteredPatients.length}</span> patient(s)
                  </p>
                </div>
                
                {filteredPatients.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-amber-50 border-b-2 border-amber-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Patient ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Date of Birth</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Gender</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Clinic ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-amber-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient, idx) => (
                        <tr key={patient.patientId} className={`border-b border-stone-200 hover:bg-amber-25 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.patientId}</td>
                          <td className="px-4 py-3 text-sm font-medium text-stone-900">{patient.firstName} {patient.lastName}</td>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.dateOfBirth}</td>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.gender}</td>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.clinicId}</td>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.phoneNumber}</td>
                          <td className="px-4 py-3 text-sm text-stone-700">{patient.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <button className="text-amber-600 hover:text-amber-800 font-semibold mr-3">View</button>
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                    <p className="text-stone-500 text-lg">No patients found matching your criteria</p>
                    <p className="text-stone-400 text-sm mt-2">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clinic-Based Grid Tab */}
          {viewTab === "clinic" && (
            <div>
              {/* Clinic Selector */}
              <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">Select Clinic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Clinic</label>
                    <select
                      value={selectedClinicId}
                      onChange={(e) => setSelectedClinicId(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    >
                      <option value="">Select a clinic</option>
                      {mockClinics.map(clinic => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>
                          {clinic.clinicName} (ID: {clinic.clinicId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Patients Grid */}
              {selectedClinicId ? (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-amber-900">
                      Patients at {mockClinics.find(c => c.clinicId === parseInt(selectedClinicId))?.clinicName}
                    </h3>
                    <p className="text-sm text-stone-600">
                      Total: <span className="font-semibold text-amber-700">{clinicPatients.length}</span> patient(s)
                    </p>
                  </div>

                  {clinicPatients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clinicPatients.map((patient) => (
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
                              <span className="text-stone-600">Phone:</span>
                              <span className="font-medium text-stone-800">{patient.phoneNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Registered:</span>
                              <span className="font-medium text-stone-800">{patient.registrationDate}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                            <button className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition text-sm">
                              View Details
                            </button>
                            <button className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-semibold hover:bg-stone-200 transition text-sm">
                              Edit
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-stone-500 text-lg">No patients registered at this clinic</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-500 text-lg">Please select a clinic to view patients</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
