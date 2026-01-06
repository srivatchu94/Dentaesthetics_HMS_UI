import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createCamp,
  getAllCamps,
  updateCamp,
  deleteCamp,
  addCampParticipant,
  getAllCampParticipants,
  updateCampParticipant,
  deleteCampParticipant,
  CampRegistrationModel,
  CampParticipantRegistrationModel,
} from "../services/campService";

export default function Camps() {
  const [camps, setCamps] = useState<CampRegistrationModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampTab, setSelectedCampTab] = useState<"list" | "create">("list");
  const [showCampModal, setShowCampModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState<CampRegistrationModel | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<CampRegistrationModel | null>(null);
  const [participants, setParticipants] = useState<CampParticipantRegistrationModel[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<CampParticipantRegistrationModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "camp" | "participant"; id: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [campForm, setCampForm] = useState<CampRegistrationModel>({
    campName: "",
    campType: "",
    campDate: "",
    startTime: "",
    endTime: "",
    venueType: "",
    institutionName: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    organizedBy: "",
    contactPerson: "",
    contactNumber: "",
    contactEmail: "",
    expectedParticipants: 0,
    targetAgeGroup: "",
    servicesOffered: "",
    campDescription: "",
    specialNotes: "",
    budgetAllocated: 0,
    sponsorshipDetails: "",
  });

  const [participantForm, setParticipantForm] = useState<CampParticipantRegistrationModel>({
    campId: 0,
    participantName: "",
    age: 0,
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    parentGuardianName: "",
    studentOrStaff: "",
    classStandard: "",
    gradeYear: "",
    rollNumber: "",
    department: "",
    existingDentalIssues: "",
    medicalHistory: "",
    currentMedications: "",
    allergies: "",
    consentGiven: false,
    photoConsent: false,
  });

  // Fetch all camps
  const fetchCamps = async () => {
    setLoading(true);
    try {
      const data = await getAllCamps();
      setCamps(data || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(`Error fetching camps: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch participants for a camp
  const fetchParticipants = async (campId: number) => {
    setLoadingParticipants(true);
    try {
      const data = await getAllCampParticipants(campId);
      setParticipants(data || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(`Error fetching participants: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleCreateOrUpdateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCamp?.campId) {
        await updateCamp({
          ...campForm,
          campId: editingCamp.campId,
        });
        setSuccessMessage("Camp updated successfully!");
      } else {
        await createCamp(campForm);
        setSuccessMessage("Camp created successfully!");
      }
      setCampForm({
        campName: "",
        campType: "",
        campDate: "",
        startTime: "",
        endTime: "",
        venueType: "",
        institutionName: "",
        address: "",
        city: "",
        state: "",
        pinCode: "",
        organizedBy: "",
        contactPerson: "",
        contactNumber: "",
        contactEmail: "",
        expectedParticipants: 0,
        targetAgeGroup: "",
        servicesOffered: "",
        campDescription: "",
        specialNotes: "",
        budgetAllocated: 0,
        sponsorshipDetails: "",
      });
      setEditingCamp(null);
      setShowCampModal(false);
      fetchCamps();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error saving camp: ${(error as Error).message}`);
    }
  };

  const handleDeleteCamp = async (campId: number) => {
    try {
      await deleteCamp(campId);
      setSuccessMessage("Camp deleted successfully!");
      fetchCamps();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error deleting camp: ${(error as Error).message}`);
    }
  };

  const handleEditCamp = (camp: CampRegistrationModel) => {
    setEditingCamp(camp);
    setCampForm(camp);
    setShowCampModal(true);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedCamp?.campId) return;
      
      if (editingParticipant?.participantId) {
        await updateCampParticipant({
          ...participantForm,
          campId: selectedCamp.campId,
          participantId: editingParticipant.participantId,
        });
        setSuccessMessage("Participant updated successfully!");
      } else {
        await addCampParticipant({
          ...participantForm,
          campId: selectedCamp.campId,
        });
        setSuccessMessage("Participant added successfully!");
      }
      resetParticipantForm();
      setEditingParticipant(null);
      setShowParticipantModal(false);
      fetchParticipants(selectedCamp.campId);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error saving participant: ${(error as Error).message}`);
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    try {
      await deleteCampParticipant(participantId);
      setSuccessMessage("Participant deleted successfully!");
      if (selectedCamp?.campId) {
        fetchParticipants(selectedCamp.campId);
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(`Error deleting participant: ${(error as Error).message}`);
    }
  };

  const handleEditParticipant = (participant: CampParticipantRegistrationModel) => {
    setEditingParticipant(participant);
    setParticipantForm(participant);
    setShowParticipantModal(true);
  };

  const resetParticipantForm = () => {
    setParticipantForm({
      campId: selectedCamp?.campId || 0,
      participantName: "",
      age: 0,
      gender: "",
      dateOfBirth: "",
      phoneNumber: "",
      email: "",
      parentGuardianName: "",
      studentOrStaff: "",
      classStandard: "",
      gradeYear: "",
      rollNumber: "",
      department: "",
      existingDentalIssues: "",
      medicalHistory: "",
      currentMedications: "",
      allergies: "",
      consentGiven: false,
      photoConsent: false,
    });
  };

  const viewCampDetails = (camp: CampRegistrationModel) => {
    setSelectedCamp(camp);
    setShowParticipantsList(true);
    fetchParticipants(camp.campId || 0);
  };

  const filteredCamps = camps.filter(
    (camp) =>
      camp.campName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.institutionName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white p-8 shadow-2xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            🏕️ Camp Management System
          </h1>
          <p className="text-purple-100 mt-2">Manage dental camps and participants</p>
        </motion.div>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            ✅ {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold">Unable to load camps</p>
                <p className="text-sm opacity-90">The server is currently unavailable. Please refresh the page or try again shortly.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {!showParticipantsList ? (
            // Camps List View
            <motion.div
              key="camps-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Camps Controls */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="w-full md:w-1/3">
                    <input
                      type="text"
                      placeholder="🔍 Search camps..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCampForm({
                        campName: "",
                        campType: "",
                        campDate: "",
                        startTime: "",
                        endTime: "",
                        venueType: "",
                        institutionName: "",
                        address: "",
                        city: "",
                        state: "",
                        pinCode: "",
                        organizedBy: "",
                        contactPerson: "",
                        contactNumber: "",
                        contactEmail: "",
                        expectedParticipants: 0,
                        targetAgeGroup: "",
                        servicesOffered: "",
                        campDescription: "",
                        specialNotes: "",
                        budgetAllocated: 0,
                        sponsorshipDetails: "",
                      });
                      setEditingCamp(null);
                      setShowCampModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition font-semibold"
                  >
                    ➕ Create New Camp
                  </button>
                </div>
              </div>

              {/* Camps Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin">⏳</div>
                  <p className="text-gray-600 mt-2">Loading camps...</p>
                </div>
              ) : filteredCamps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200"
                >
                  <div className="text-6xl mb-4">🏕️</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Camps Yet!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {errorMessage 
                      ? "There was an issue loading camps. Please try again or create a new camp." 
                      : "Start managing dental camps by creating your first one!"}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCampForm({
                        campName: "",
                        campType: "",
                        campDate: "",
                        institutionName: "",
                        location: "",
                        expectedParticipants: "",
                        objectives: "",
                      });
                      setShowCampModal(true);
                      setEditingCamp(null);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition"
                  >
                    ➕ Create Your First Camp
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCamps.map((camp, index) => (
                    <motion.div
                      key={camp.campId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition"
                    >
                      {/* Camp Header */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                        <h3 className="text-xl font-bold">{camp.campName}</h3>
                        <p className="text-purple-100">{camp.institutionName}</p>
                      </div>

                      {/* Camp Details */}
                      <div className="p-6 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-semibold">Date</p>
                            <p className="font-semibold text-gray-800">
                              {new Date(camp.campDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-semibold">Type</p>
                            <p className="font-semibold text-gray-800">{camp.campType}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-semibold">Venue</p>
                            <p className="font-semibold text-gray-800">{camp.venueType}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-semibold">Expected</p>
                            <p className="font-semibold text-gray-800">{camp.expectedParticipants}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs uppercase font-semibold">Address</p>
                          <p className="text-gray-700">{camp.address}, {camp.city}</p>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Contact</p>
                          <p className="text-sm text-gray-700">{camp.contactPerson}</p>
                          <p className="text-sm text-gray-600">{camp.contactNumber}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bg-gray-50 px-6 py-4 flex gap-3">
                        <button
                          onClick={() => viewCampDetails(camp)}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold text-sm"
                        >
                          👥 Participants
                        </button>
                        <button
                          onClick={() => handleEditCamp(camp)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-semibold text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: "camp", id: camp.campId || 0 });
                            setShowDeleteConfirm(true);
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // Participants View
            <motion.div
              key="participants-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back Button */}
              <button
                onClick={() => {
                  setShowParticipantsList(false);
                  setSelectedCamp(null);
                  resetParticipantForm();
                }}
                className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ← Back to Camps
              </button>

              {/* Camp Header */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-3xl font-bold text-gray-800">{selectedCamp?.campName}</h2>
                <p className="text-gray-600 mt-1">{selectedCamp?.institutionName}</p>
                <p className="text-gray-500 text-sm mt-2">
                  📅 {new Date(selectedCamp?.campDate || "").toLocaleDateString()} | 📍 {selectedCamp?.city}, {selectedCamp?.state}
                </p>
              </div>

              {/* Add Participant Button */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    resetParticipantForm();
                    setEditingParticipant(null);
                    setShowParticipantModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition font-semibold"
                >
                  ➕ Add Participant
                </button>
              </div>

              {/* Participants List */}
              {loadingParticipants ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin">⏳</div>
                  <p className="text-gray-600 mt-2">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg">📭 No participants registered</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.participantId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-4 text-white">
                        <h4 className="font-bold text-lg">{participant.participantName}</h4>
                        <p className="text-blue-100 text-sm">{participant.studentOrStaff}</p>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Age</p>
                            <p className="text-gray-800 font-semibold">{participant.age}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Gender</p>
                            <p className="text-gray-800 font-semibold">{participant.gender}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Phone</p>
                            <p className="text-gray-800 text-sm">{participant.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold">Email</p>
                            <p className="text-gray-800 text-sm truncate">{participant.email}</p>
                          </div>
                        </div>

                        {participant.existingDentalIssues && (
                          <div className="pt-2 border-t">
                            <p className="text-gray-500 text-xs font-semibold">Dental Issues</p>
                            <p className="text-gray-700 text-sm">{participant.existingDentalIssues}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {participant.consentGiven && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                              ✓ Consent
                            </span>
                          )}
                          {participant.photoConsent && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                              📸 Photo OK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bg-gray-50 px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleEditParticipant(participant)}
                          className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-semibold text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: "participant", id: participant.participantId || 0 });
                            setShowDeleteConfirm(true);
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camp Modal */}
      <AnimatePresence>
        {showCampModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-2xl font-bold">
                  {editingCamp ? "✏️ Edit Camp" : "➕ Create New Camp"}
                </h2>
                <button
                  onClick={() => {
                    setShowCampModal(false);
                    setEditingCamp(null);
                  }}
                  className="text-2xl hover:text-pink-200 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateCamp} className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Camp Name"
                      required
                      value={campForm.campName}
                      onChange={(e) => setCampForm({ ...campForm, campName: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <select
                      required
                      value={campForm.campType}
                      onChange={(e) => setCampForm({ ...campForm, campType: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select Camp Type</option>
                      <option value="School">School</option>
                      <option value="College">College</option>
                      <option value="Community">Community</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Special">Special Needs</option>
                    </select>
                    <input
                      type="date"
                      required
                      value={campForm.campDate}
                      onChange={(e) => setCampForm({ ...campForm, campDate: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <select
                      required
                      value={campForm.venueType}
                      onChange={(e) => setCampForm({ ...campForm, venueType: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select Venue Type</option>
                      <option value="School">School</option>
                      <option value="College">College</option>
                      <option value="Institution">Institution</option>
                      <option value="Community Center">Community Center</option>
                      <option value="Hospital">Hospital</option>
                    </select>
                  </div>
                </div>

                {/* Time */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Timing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="time"
                      required
                      value={campForm.startTime}
                      onChange={(e) => setCampForm({ ...campForm, startTime: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="time"
                      required
                      value={campForm.endTime}
                      onChange={(e) => setCampForm({ ...campForm, endTime: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Location</h3>
                  <input
                    type="text"
                    placeholder="Institution Name"
                    required
                    value={campForm.institutionName}
                    onChange={(e) => setCampForm({ ...campForm, institutionName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    required
                    value={campForm.address}
                    onChange={(e) => setCampForm({ ...campForm, address: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={campForm.city}
                      onChange={(e) => setCampForm({ ...campForm, city: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      required
                      value={campForm.state}
                      onChange={(e) => setCampForm({ ...campForm, state: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pin Code"
                      required
                      value={campForm.pinCode}
                      onChange={(e) => setCampForm({ ...campForm, pinCode: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Person"
                      required
                      value={campForm.contactPerson}
                      onChange={(e) => setCampForm({ ...campForm, contactPerson: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Contact Number"
                      required
                      value={campForm.contactNumber}
                      onChange={(e) => setCampForm({ ...campForm, contactNumber: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Contact Email"
                      required
                      value={campForm.contactEmail}
                      onChange={(e) => setCampForm({ ...campForm, contactEmail: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Organized By"
                      value={campForm.organizedBy}
                      onChange={(e) => setCampForm({ ...campForm, organizedBy: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Camp Details */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Camp Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="number"
                      placeholder="Expected Participants"
                      required
                      value={campForm.expectedParticipants}
                      onChange={(e) => setCampForm({ ...campForm, expectedParticipants: Number(e.target.value) })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Target Age Group"
                      value={campForm.targetAgeGroup}
                      onChange={(e) => setCampForm({ ...campForm, targetAgeGroup: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Budget Allocated"
                      value={campForm.budgetAllocated}
                      onChange={(e) => setCampForm({ ...campForm, budgetAllocated: Number(e.target.value) })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Services Offered"
                    value={campForm.servicesOffered}
                    onChange={(e) => setCampForm({ ...campForm, servicesOffered: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-4 h-20"
                  />
                  <textarea
                    placeholder="Camp Description"
                    value={campForm.campDescription}
                    onChange={(e) => setCampForm({ ...campForm, campDescription: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-4 h-20"
                  />
                  <textarea
                    placeholder="Special Notes"
                    value={campForm.specialNotes}
                    onChange={(e) => setCampForm({ ...campForm, specialNotes: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none h-20"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition font-bold"
                  >
                    {editingCamp ? "💾 Update Camp" : "➕ Create Camp"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCampModal(false);
                      setEditingCamp(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-bold"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participant Modal */}
      <AnimatePresence>
        {showParticipantModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-2xl font-bold">
                  {editingParticipant ? "✏️ Edit Participant" : "➕ Add Participant"}
                </h2>
                <button
                  onClick={() => {
                    setShowParticipantModal(false);
                    setEditingParticipant(null);
                  }}
                  className="text-2xl hover:text-cyan-200 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddParticipant} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={participantForm.participantName}
                      onChange={(e) => setParticipantForm({ ...participantForm, participantName: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      required
                      value={participantForm.dateOfBirth}
                      onChange={(e) => setParticipantForm({ ...participantForm, dateOfBirth: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      required
                      value={participantForm.age}
                      onChange={(e) => setParticipantForm({ ...participantForm, age: Number(e.target.value) })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <select
                      required
                      value={participantForm.gender}
                      onChange={(e) => setParticipantForm({ ...participantForm, gender: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      required
                      value={participantForm.phoneNumber}
                      onChange={(e) => setParticipantForm({ ...participantForm, phoneNumber: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={participantForm.email}
                      onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Institution/Organization */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Institution/Organization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Parent/Guardian Name"
                      value={participantForm.parentGuardianName}
                      onChange={(e) => setParticipantForm({ ...participantForm, parentGuardianName: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <select
                      required
                      value={participantForm.studentOrStaff}
                      onChange={(e) => setParticipantForm({ ...participantForm, studentOrStaff: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Class/Standard"
                      value={participantForm.classStandard}
                      onChange={(e) => setParticipantForm({ ...participantForm, classStandard: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Grade/Year"
                      value={participantForm.gradeYear}
                      onChange={(e) => setParticipantForm({ ...participantForm, gradeYear: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Roll Number"
                      value={participantForm.rollNumber}
                      onChange={(e) => setParticipantForm({ ...participantForm, rollNumber: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Department"
                      value={participantForm.department}
                      onChange={(e) => setParticipantForm({ ...participantForm, department: e.target.value })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Medical/Dental Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Medical/Dental Information</h3>
                  <textarea
                    placeholder="Existing Dental Issues"
                    value={participantForm.existingDentalIssues}
                    onChange={(e) => setParticipantForm({ ...participantForm, existingDentalIssues: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4 h-20"
                  />
                  <textarea
                    placeholder="Medical History"
                    value={participantForm.medicalHistory}
                    onChange={(e) => setParticipantForm({ ...participantForm, medicalHistory: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4 h-20"
                  />
                  <textarea
                    placeholder="Current Medications"
                    value={participantForm.currentMedications}
                    onChange={(e) => setParticipantForm({ ...participantForm, currentMedications: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4 h-20"
                  />
                  <textarea
                    placeholder="Allergies"
                    value={participantForm.allergies}
                    onChange={(e) => setParticipantForm({ ...participantForm, allergies: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none h-20"
                  />
                </div>

                {/* Consent */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Consent</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantForm.consentGiven}
                        onChange={(e) => setParticipantForm({ ...participantForm, consentGiven: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-700">Medical/Dental Treatment Consent</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participantForm.photoConsent}
                        onChange={(e) => setParticipantForm({ ...participantForm, photoConsent: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                      <span className="text-gray-700">Photo Documentation Consent</span>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition font-bold"
                  >
                    {editingParticipant ? "💾 Update Participant" : "➕ Add Participant"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowParticipantModal(false);
                      setEditingParticipant(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-bold"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this {deleteTarget?.type === "camp" ? "camp" : "participant"}?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (deleteTarget?.type === "camp") {
                      handleDeleteCamp(deleteTarget.id);
                    } else if (deleteTarget?.type === "participant") {
                      handleDeleteParticipant(deleteTarget.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-bold"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-bold"
                >
                  ✕ Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
