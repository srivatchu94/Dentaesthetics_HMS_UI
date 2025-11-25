import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchDoctors, updateDoctor, listDoctorProfiles, getDoctorByStaffId, deleteDoctor, updateDoctorProfile } from '../services/doctorService';
import { listClinicalSpecialties } from "../services/doctorService";

export default function ViewDoctors() {
  const [searchParams, setSearchParams] = useState({
    firstName: "",
    lastName: "",
    staffId: "",
    clinicId: ""
  });
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isEditingInView, setIsEditingInView] = useState(false);
  const [viewEditFormData, setViewEditFormData] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await listClinicalSpecialties();
      setSpecialties(data);
    } catch (error) {
      console.error("Error loading specialties:", error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.firstName) params.firstName = searchParams.firstName;
      if (searchParams.lastName) params.lastName = searchParams.lastName;
      if (searchParams.staffId) params.staffId = parseInt(searchParams.staffId);
      if (searchParams.clinicId) params.clinicId = parseInt(searchParams.clinicId);

      const results = await searchDoctors(params);
      setDoctors(results);
    } catch (error) {
      console.error("Error searching doctors:", error);
      alert("Failed to search doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = async () => {
    setLoading(true);
    try {
      // Uncomment when API is ready
      // const results = await listDoctorProfiles();
      // setDoctors(results);
      
      // Dummy data for demonstration
      const dummyDoctors = [
        {
          doctorId: 1,
          staffId: 1001,
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@clinic.com",
          phone: "+1-555-0101",
          specialtyId: 1,
          branchId: 1,
          employmentStatus: "Full-time",
          gender: "Female",
          dateOfBirth: "1985-03-15",
          address: "123 Medical Plaza, Suite 100",
          licenseNumber: "MED-2024-001",
          licenseExpiry: "2026-12-31",
          yearsExperience: 12,
          education: "MD from Harvard Medical School",
          certifications: "Board Certified in Internal Medicine",
          languages: "English, Spanish",
          joiningDate: "2020-01-15",
          availability: "Mon-Fri 9AM-5PM",
          insuranceDetails: "Medicare, Medicaid, Private",
          emergencyContact: "John Johnson +1-555-0102",
          bio: "Experienced physician specializing in internal medicine",
          profilePhotoUrl: "https://example.com/photo1.jpg",
          achievements: "Excellence in Patient Care Award 2023",
          publications: "Journal of Medicine Vol 45",
          socialLinks: "linkedin.com/sarah-johnson",
          role: "Doctor"
        },
        {
          doctorId: 2,
          staffId: 1002,
          firstName: "Michael",
          lastName: "Chen",
          email: "michael.chen@clinic.com",
          phone: "+1-555-0201",
          specialtyId: 2,
          branchId: 1,
          employmentStatus: "Full-time",
          gender: "Male",
          dateOfBirth: "1982-07-22",
          address: "456 Health Center Dr",
          licenseNumber: "MED-2024-002",
          licenseExpiry: "2027-06-30",
          yearsExperience: 15,
          education: "MD from Johns Hopkins University",
          certifications: "Board Certified in Cardiology",
          languages: "English, Mandarin",
          joiningDate: "2019-03-20",
          availability: "Mon-Thu 8AM-6PM",
          insuranceDetails: "All major insurances accepted",
          emergencyContact: "Lisa Chen +1-555-0202",
          bio: "Cardiologist with expertise in interventional procedures",
          profilePhotoUrl: "https://example.com/photo2.jpg",
          achievements: "Best Doctor Award 2022",
          publications: "Cardiology Today Magazine",
          socialLinks: "linkedin.com/michael-chen",
          role: "Doctor"
        },
        {
          doctorId: 3,
          staffId: 1003,
          firstName: "Emily",
          lastName: "Rodriguez",
          email: "emily.rodriguez@clinic.com",
          phone: "+1-555-0301",
          specialtyId: 3,
          branchId: 2,
          employmentStatus: "Part-time",
          gender: "Female",
          dateOfBirth: "1990-11-08",
          address: "789 Wellness Blvd",
          licenseNumber: "MED-2024-003",
          licenseExpiry: "2026-09-30",
          yearsExperience: 8,
          education: "MD from Stanford University",
          certifications: "Board Certified in Pediatrics",
          languages: "English, Spanish, Portuguese",
          joiningDate: "2021-06-01",
          availability: "Tue, Thu, Sat 10AM-4PM",
          insuranceDetails: "Most PPO and HMO plans",
          emergencyContact: "Carlos Rodriguez +1-555-0302",
          bio: "Pediatrician dedicated to children's health and wellness",
          profilePhotoUrl: "https://example.com/photo3.jpg",
          achievements: "Rising Star in Pediatrics 2024",
          publications: "Pediatric Health Journal",
          socialLinks: "linkedin.com/emily-rodriguez",
          role: "Doctor"
        },
        {
          doctorId: 4,
          staffId: 1004,
          firstName: "David",
          lastName: "Patel",
          email: "david.patel@clinic.com",
          phone: "+1-555-0401",
          specialtyId: 1,
          branchId: 2,
          employmentStatus: "Visiting",
          gender: "Male",
          dateOfBirth: "1978-05-30",
          address: "321 Care Street",
          licenseNumber: "MED-2024-004",
          licenseExpiry: "2028-03-31",
          yearsExperience: 20,
          education: "MD from Yale University",
          certifications: "Board Certified in Neurology",
          languages: "English, Hindi, Gujarati",
          joiningDate: "2022-09-15",
          availability: "Mon, Wed 1PM-7PM",
          insuranceDetails: "Medicare and select private insurances",
          emergencyContact: "Priya Patel +1-555-0402",
          bio: "Neurologist with focus on stroke and seizure disorders",
          profilePhotoUrl: "https://example.com/photo4.jpg",
          achievements: "National Excellence in Neurology 2023",
          publications: "Brain Research Quarterly",
          socialLinks: "linkedin.com/david-patel",
          role: "Doctor"
        },
        {
          doctorId: 5,
          staffId: 1005,
          firstName: "Jessica",
          lastName: "Thompson",
          email: "jessica.thompson@clinic.com",
          phone: "+1-555-0501",
          specialtyId: 4,
          branchId: 3,
          employmentStatus: "Full-time",
          gender: "Female",
          dateOfBirth: "1988-09-12",
          address: "555 Medical Court",
          licenseNumber: "MED-2024-005",
          licenseExpiry: "2027-11-30",
          yearsExperience: 10,
          education: "MD from Columbia University",
          certifications: "Board Certified in Orthopedic Surgery",
          languages: "English, French",
          joiningDate: "2020-11-01",
          availability: "Mon-Fri 7AM-3PM",
          insuranceDetails: "All major insurances",
          emergencyContact: "Robert Thompson +1-555-0502",
          bio: "Orthopedic surgeon specializing in sports medicine",
          profilePhotoUrl: "https://example.com/photo5.jpg",
          achievements: "Innovation in Surgery Award 2024",
          publications: "Orthopedic Surgery Today",
          socialLinks: "linkedin.com/jessica-thompson",
          role: "Doctor"
        },
        {
          doctorId: 6,
          staffId: 1006,
          firstName: "Ahmed",
          lastName: "Hassan",
          email: "ahmed.hassan@clinic.com",
          phone: "+1-555-0601",
          specialtyId: 2,
          branchId: 3,
          employmentStatus: "Consultant",
          gender: "Male",
          dateOfBirth: "1975-12-25",
          address: "888 Specialist Lane",
          licenseNumber: "MED-2024-006",
          licenseExpiry: "2026-08-31",
          yearsExperience: 25,
          education: "MD from Oxford University",
          certifications: "Board Certified in Gastroenterology",
          languages: "English, Arabic, French",
          joiningDate: "2023-02-01",
          availability: "Fri 9AM-5PM",
          insuranceDetails: "Premium insurance plans only",
          emergencyContact: "Fatima Hassan +1-555-0602",
          bio: "Senior consultant in gastroenterology and hepatology",
          profilePhotoUrl: "https://example.com/photo6.jpg",
          achievements: "Lifetime Achievement Award in Medicine",
          publications: "Gastroenterology International",
          socialLinks: "linkedin.com/ahmed-hassan",
          role: "Doctor"
        }
      ];
      
      setDoctors(dummyDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
      alert("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (doctor) => {
    try {
      setLoading(true);
      const fullDoctorData = await getDoctorByStaffId(doctor.staffId);
      setEditingDoctor(fullDoctorData);
      setEditFormData({
        doctorId: fullDoctorData.doctorId,
        firstName: fullDoctorData.firstName,
        lastName: fullDoctorData.lastName,
        dateOfBirth: fullDoctorData.dateOfBirth?.split('T')[0] || "",
        gender: fullDoctorData.gender,
        email: fullDoctorData.email,
        phone: fullDoctorData.phone,
        address: fullDoctorData.address,
        licenseNumber: fullDoctorData.licenseNumber,
        licenseExpiry: fullDoctorData.licenseExpiry?.split('T')[0] || "",
        specialtyId: fullDoctorData.specialtyId,
        yearsExperience: fullDoctorData.yearsExperience,
        education: fullDoctorData.education,
        certifications: fullDoctorData.certifications,
        languages: fullDoctorData.languages,
        joiningDate: fullDoctorData.joiningDate?.split('T')[0] || "",
        employmentStatus: fullDoctorData.employmentStatus,
        availability: fullDoctorData.availability,
        insuranceDetails: fullDoctorData.insuranceDetails,
        emergencyContact: fullDoctorData.emergencyContact,
        bio: fullDoctorData.bio,
        profilePhotoUrl: fullDoctorData.profilePhotoUrl,
        achievements: fullDoctorData.achievements,
        publications: fullDoctorData.publications,
        socialLinks: fullDoctorData.socialLinks,
        branchId: fullDoctorData.branchId,
      role: fullDoctorData.role
    });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      alert('Failed to load doctor details for editing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (doctor) => {
    try {
      setLoading(true);
      const fullDoctorData = await getDoctorByStaffId(doctor.staffId);
      
      // Format dates for display
      const formattedDoctorData = {
        ...fullDoctorData,
        dateOfBirth: fullDoctorData.dateOfBirth?.split('T')[0] || fullDoctorData.dateOfBirth || "",
        licenseExpiry: fullDoctorData.licenseExpiry?.split('T')[0] || fullDoctorData.licenseExpiry || "",
        joiningDate: fullDoctorData.joiningDate?.split('T')[0] || fullDoctorData.joiningDate || "",
      };
      
      setViewingDoctor(formattedDoctorData);
      setViewEditFormData(formattedDoctorData);
      setIsEditingInView(false);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      alert('Failed to load doctor details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInView = () => {
    // viewingDoctor already has formatted dates, so just copy it
    setViewEditFormData({...viewingDoctor});
    setIsEditingInView(true);
  };

  const handleCancelEditInView = () => {
    // viewingDoctor already has formatted dates, so just copy it
    setViewEditFormData({...viewingDoctor});
    setIsEditingInView(false);
  };

  const handleSaveFromView = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Send complete DoctorProfileModel with all fields
      await updateDoctorProfile(viewEditFormData);
      
      const funnyMessages = [
        "🎉 Woohoo! Doctor's profile got a glow-up!",
        "✨ Updated successfully! Even the stethoscope is impressed!",
        "🚀 Profile upgraded! The doctor is now in HD mode!",
        "💫 Boom! Doctor details updated with surgical precision!",
        "🎊 Success! The doctor's info is fresher than morning scrubs!",
        "🌟 Updated! This doctor's profile is now healthier than ever!"
      ];
      
      setSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowSuccessModal(true);
      setShowViewModal(false);
      setIsEditingInView(false);
      
      // Close success modal and refresh after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        // Refresh the doctors list
        if (doctors.length > 0) {
          const updatedDoctors = doctors.map(d => 
            d.staffId === viewingDoctor.staffId ? { ...d, ...viewEditFormData } : d
          );
          setDoctors(updatedDoctors);
        } else {
          handleSearch();
        }
      }, 2000);
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      alert('Failed to update doctor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteDoctor(doctorToDelete.staffId);
      
      const funnyDeleteMessages = [
        "💥 Poof! Doctor vanished like a magic trick!",
        "🚀 Doctor profile launched into outer space!",
        "🎪 And just like that, the doctor left the building!",
        "⚡ Zapped! Doctor profile deleted at light speed!",
        "🌪️ Whoosh! Profile swept away like autumn leaves!",
        "🎭 Exit stage left! Doctor profile has left the chat!"
      ];
      
      setSuccessMessage(funnyDeleteMessages[Math.floor(Math.random() * funnyDeleteMessages.length)]);
      setShowDeleteModal(false);
      setDoctorToDelete(null);
      setShowSuccessModal(true);
      
      // Close success modal and refresh after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setDoctors(doctors.filter(d => d.staffId !== doctorToDelete.staffId));
        handleSearch(); // Refresh the list
      }, 2000);
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editFormData,
        staffId: editingDoctor.staffId, // Keep original staffId
        doctorId: editFormData.doctorId,
        dateOfBirth: editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString() : null,
        licenseExpiry: editFormData.licenseExpiry ? new Date(editFormData.licenseExpiry).toISOString() : null,
        joiningDate: editFormData.joiningDate ? new Date(editFormData.joiningDate).toISOString() : null,
        specialtyId: editFormData.specialtyId ? parseInt(editFormData.specialtyId) : null,
        yearsExperience: editFormData.yearsExperience ? parseInt(editFormData.yearsExperience) : null,
        branchId: editFormData.branchId ? parseInt(editFormData.branchId) : null,
        updatedAt: new Date().toISOString()
      };

      await updateDoctorProfile(payload);
      
      const funnyMessages = [
        "🎉 Woohoo! Doctor's profile got a glow-up!",
        "✨ Updated successfully! Even the stethoscope is impressed!",
        "🚀 Profile upgraded! The doctor is now in HD mode!",
        "💫 Boom! Doctor details updated with surgical precision!",
        "🎊 Success! The doctor's info is fresher than morning scrubs!",
        "🌟 Updated! This doctor's profile is now healthier than ever!"
      ];
      
      setSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowSuccessModal(true);
      setShowEditModal(false);
      setEditingDoctor(null);
      
      // Close success modal and refresh after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        handleSearch();
      }, 2000);
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("Failed to update doctor. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <span className="text-5xl">👨‍⚕️</span>
            View Doctors
          </h1>
          <p className="text-purple-100 mt-2">Search and manage doctor profiles</p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
            <span>🔍</span>
            Search Filters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={searchParams.firstName}
                onChange={(e) => setSearchParams({ ...searchParams, firstName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={searchParams.lastName}
                onChange={(e) => setSearchParams({ ...searchParams, lastName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Staff ID</label>
              <input
                type="number"
                value={searchParams.staffId}
                onChange={(e) => setSearchParams({ ...searchParams, staffId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter staff ID"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic ID</label>
              <input
                type="number"
                value={searchParams.clinicId}
                onChange={(e) => setSearchParams({ ...searchParams, clinicId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter clinic ID"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Searching..." : "🔍 Search Doctors"}
            </button>
            
            <button
              onClick={handleViewAll}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Loading..." : "👥 View All Doctors"}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        {doctors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.doctorId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border-2 border-purple-100"
              >
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>👨‍⚕️</span>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-purple-100 text-sm">Staff ID: {doctor.staffId}</p>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">📧 Email:</span>
                    <span className="text-sm">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">📞 Phone:</span>
                    <span className="text-sm">{doctor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">🎓 Specialty:</span>
                    <span className="text-sm">ID {doctor.specialtyId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">🏥 Branch:</span>
                    <span className="text-sm">ID {doctor.branchId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">💼 Status:</span>
                    <span className="text-sm">{doctor.employmentStatus}</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleView(doctor)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">👁️</span> View
                    </button>
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">✏️</span> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doctor)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <span className="text-lg">🗑️</span> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && doctors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <span className="text-6xl">🔍</span>
            <p className="text-xl text-gray-600 mt-4">No doctors found. Try searching or view all doctors.</p>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span>✏️</span>
                    Edit Doctor Profile
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateDoctor} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Staff ID - Read Only */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Staff ID (Read Only)
                    </label>
                    <input
                      type="number"
                      value={editingDoctor?.staffId}
                      disabled
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.dateOfBirth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                    <select
                      required
                      value={editFormData.gender || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">License Number *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.licenseNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiry *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.licenseExpiry}
                      onChange={(e) => setEditFormData({ ...editFormData, licenseExpiry: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty ID *</label>
                    <input
                      type="number"
                      required
                      value={editFormData.specialtyId}
                      onChange={(e) => setEditFormData({ ...editFormData, specialtyId: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Years Experience</label>
                    <input
                      type="number"
                      value={editFormData.yearsExperience}
                      onChange={(e) => setEditFormData({ ...editFormData, yearsExperience: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.joiningDate}
                      onChange={(e) => setEditFormData({ ...editFormData, joiningDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Status *</label>
                    <select
                      required
                      value={editFormData.employmentStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, employmentStatus: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select status</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Visiting">Visiting</option>
                      <option value="Consultant">Consultant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch ID *</label>
                    <input
                      type="number"
                      required
                      value={editFormData.branchId}
                      onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.emergencyContact}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                  >
                    💾 Update Doctor
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && viewingDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">👨‍⚕️</span>
                    <div>
                      <h2 className="text-3xl font-bold">{isEditingInView ? '✏️ Edit Doctor Profile' : 'Doctor Profile'}</h2>
                      <p className="text-blue-100">{isEditingInView ? 'Update professional details' : 'Complete Professional Details'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setIsEditingInView(false);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <span className="text-3xl">✖️</span>
                  </button>
                </div>
              </div>

              {!isEditingInView ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                      <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="text-2xl">👤</span> Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Staff ID:</span> <span className="text-purple-700 font-bold">{viewingDoctor.staffId}</span></div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Name:</span> Dr. {viewingDoctor.firstName} {viewingDoctor.lastName}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Gender:</span> {viewingDoctor.gender || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">DOB:</span> {viewingDoctor.dateOfBirth || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="text-2xl">📞</span> Contact Information
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Email:</span> {viewingDoctor.email}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Phone:</span> {viewingDoctor.phone}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Emergency:</span> {viewingDoctor.emergencyContact}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Address:</span> {viewingDoctor.address}</div>
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                      <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="text-2xl">🎓</span> Professional Details
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Specialty ID:</span> {viewingDoctor.specialtyId || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">License #:</span> {viewingDoctor.licenseNumber || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">License Expiry:</span> {viewingDoctor.licenseExpiry || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Experience:</span> {viewingDoctor.yearsExperience || 0} years</div>
                      </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-2 border-orange-200">
                      <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="text-2xl">💼</span> Employment Details
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Branch ID:</span> {viewingDoctor.branchId || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Status:</span> {viewingDoctor.employmentStatus || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Joined:</span> {viewingDoctor.joiningDate || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Availability:</span> {viewingDoctor.availability || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-xl border-2 border-indigo-200 md:col-span-2">
                      <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="text-2xl">📋</span> Additional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Education:</span> {viewingDoctor.education || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Certifications:</span> {viewingDoctor.certifications || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Languages:</span> {viewingDoctor.languages || 'N/A'}</div>
                        <div className="bg-white p-2 rounded"><span className="font-semibold">Achievements:</span> {viewingDoctor.achievements || 'N/A'}</div>
                      </div>
                      {viewingDoctor.bio && (
                        <div className="bg-white p-3 rounded mt-3">
                          <span className="font-semibold">Bio:</span>
                          <p className="text-gray-700 mt-2">{viewingDoctor.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-semibold shadow-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleEditInView}
                      className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg flex items-center gap-2"
                    >
                      <span className="text-xl">✏️</span> Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveFromView} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Staff ID - Read Only */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Staff ID (Read Only)</label>
                      <input
                        type="text"
                        value={viewingDoctor.staffId}
                        readOnly
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Personal Information */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={viewEditFormData.firstName || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={viewEditFormData.lastName || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                      <select
                        required
                        value={viewEditFormData.gender || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, gender: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={viewEditFormData.dateOfBirth || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Contact Information */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={viewEditFormData.email || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={viewEditFormData.phone || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, phone: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                      <textarea
                        required
                        value={viewEditFormData.address || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, address: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact *</label>
                      <input
                        type="text"
                        required
                        value={viewEditFormData.emergencyContact || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, emergencyContact: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Professional Details */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty ID *</label>
                      <input
                        type="number"
                        required
                        value={viewEditFormData.specialtyId || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, specialtyId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">License Number *</label>
                      <input
                        type="text"
                        required
                        value={viewEditFormData.licenseNumber || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, licenseNumber: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiry *</label>
                      <input
                        type="date"
                        required
                        value={viewEditFormData.licenseExpiry || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, licenseExpiry: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={viewEditFormData.yearsExperience || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, yearsExperience: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Employment Details */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Branch ID *</label>
                      <input
                        type="number"
                        required
                        value={viewEditFormData.branchId || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, branchId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Status *</label>
                      <select
                        required
                        value={viewEditFormData.employmentStatus || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, employmentStatus: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select status</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Visiting">Visiting</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date *</label>
                      <input
                        type="date"
                        required
                        value={viewEditFormData.joiningDate || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, joiningDate: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                      <input
                        type="text"
                        value={viewEditFormData.availability || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, availability: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Mon-Fri 9AM-5PM"
                      />
                    </div>

                    {/* Additional Fields */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                      <input
                        type="text"
                        value={viewEditFormData.education || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, education: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications</label>
                      <input
                        type="text"
                        value={viewEditFormData.certifications || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, certifications: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
                      <input
                        type="text"
                        value={viewEditFormData.languages || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, languages: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Achievements</label>
                      <input
                        type="text"
                        value={viewEditFormData.achievements || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, achievements: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={viewEditFormData.bio || ''}
                        onChange={(e) => setViewEditFormData({ ...viewEditFormData, bio: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCancelEditInView}
                      className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold shadow-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span className="text-xl">💾</span> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && doctorToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-5xl animate-pulse">⚠️</span>
                  <div>
                    <h2 className="text-2xl font-bold">Confirm Deletion</h2>
                    <p className="text-red-100">This action cannot be undone!</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                    <p className="text-lg text-yellow-800 font-semibold flex items-center gap-2">
                      <span className="text-2xl">🤔</span>
                      <span>Hold on! Are you absolutely, positively, 100% sure?</span>
                    </p>
                  </div>
                  
                  <p className="text-gray-800 text-lg mb-4">
                    You're about to send this doctor on a permanent vacation:
                  </p>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="font-bold text-red-900 text-xl">
                      Dr. {doctorToDelete.firstName} {doctorToDelete.lastName}
                    </p>
                    <p className="text-red-700 mt-1">Staff ID: {doctorToDelete.staffId}</p>
                  </div>
                </div>
                
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-xl">🔥</span>
                    <span><strong>No joke!</strong> This will permanently delete all their data, appointments, and patient history. It's like they never existed... except in our memories! 😢</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-bold shadow-lg transform hover:scale-105"
                  >
                    😅 Nope, Keep Doctor!
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {loading ? '⏳ Deleting...' : '💀 Yes, Delete Forever!'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                  className="text-8xl mb-4"
                >
                  🎉
                </motion.div>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Success!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-white font-semibold"
                >
                  {successMessage}
                </motion.p>
              </div>
              
              <div className="p-6 bg-gradient-to-b from-green-50 to-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="flex items-center justify-center gap-2 text-green-600"
                >
                  <span className="text-5xl">✓</span>
                  <span className="text-lg font-semibold">Doctor profile updated!</span>
                </motion.div>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mt-4"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
