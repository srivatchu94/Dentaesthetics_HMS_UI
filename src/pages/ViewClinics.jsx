import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClinic, updateClinic, deleteClinic } from '../services/clinicService';

const ViewClinics = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    enterpriseId: "",
    clinicId: "",
    clinicName: "",
    address: "",
    email: "",
    phone: ""
  });
  
  // View/Edit Modal State
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'contact', 'hours'
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      enterpriseId: "",
      clinicId: "",
      clinicName: "",
      address: "",
      email: "",
      phone: ""
    });
    setSearchResults([]);
    setError('');
  }, []);

  const handleSearch = async () => {
    if (!filters.clinicId || filters.clinicId.trim() === "") {
      setError('Please enter a Clinic ID to search');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const clinicId = parseInt(filters.clinicId);
      if (isNaN(clinicId)) {
        setError('Clinic ID must be a number');
        setLoading(false);
        return;
      }
      
      const clinic = await getClinic(clinicId);
      const clinicData = Array.isArray(clinic) ? clinic[0] : clinic;
      
      if (!clinicData || !clinicData.clinicId) {
        throw new Error('Invalid clinic data received from API');
      }
      
      // Apply additional filters if provided
      let results = [clinicData];
      
      if (filters.enterpriseId && !String(clinicData.enterpriseId).includes(filters.enterpriseId)) {
        results = [];
      }
      if (filters.clinicName && !clinicData.clinicName.toLowerCase().includes(filters.clinicName.toLowerCase())) {
        results = [];
      }
      if (filters.address && !(clinicData.clinicAddress?.toLowerCase().includes(filters.address.toLowerCase()) || 
          clinicData.clinicCity?.toLowerCase().includes(filters.address.toLowerCase()))) {
        results = [];
      }
      if (filters.email && !clinicData.clinicEmail?.toLowerCase().includes(filters.email.toLowerCase())) {
        results = [];
      }
      if (filters.phone && !clinicData.clinicPhone?.includes(filters.phone)) {
        results = [];
      }
      
      setSearchResults(results);
      if (results.length === 0) {
        setError('No clinics match the filter criteria');
      }
    } catch (err) {
      setError('Failed to fetch clinic: ' + (err.message || 'Unknown error'));
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (clinic) => {
    setSelectedClinic(clinic);
    setEditData({ ...clinic });
    setShowModal(true);
    setActiveTab('details');
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData({ ...selectedClinic });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setSaveLoading(true);
    try {
      await updateClinic(selectedClinic.clinicId, editData);
      
      const funnyMessages = [
        "🎉 Clinic updated like a boss!",
        "✨ Changes saved faster than a tooth extraction!",
        "🚀 Update successful! Clinic data refreshed!",
        "💫 Boom! Clinic info upgraded!",
        "🦷 Clinic details polished to perfection!",
        "⚡ Lightning-fast update complete!"
      ];
      
      setSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowSuccessModal(true);
      setShowModal(false);
      setIsEditing(false);
      
      // Refresh search results
      setTimeout(() => {
        setShowSuccessModal(false);
        handleSearch();
      }, 2000);
    } catch (err) {
      alert('Failed to update clinic: ' + (err.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = (clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteClinic(clinicToDelete.clinicId);
      
      const funnyMessages = [
        "💥 Poof! Clinic vanished into thin air!",
        "🚀 Clinic launched into outer space!",
        "🎪 And just like that, clinic left the building!",
        "⚡ Zapped! Clinic deleted at light speed!",
        "🌪️ Whoosh! Clinic swept away!",
        "🎭 Exit stage left! Clinic has left the chat!"
      ];
      
      setSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      
      setTimeout(() => {
        setShowSuccessModal(false);
        setSearchResults(searchResults.filter(c => c.clinicId !== clinicToDelete.clinicId));
      }, 2000);
    } catch (err) {
      alert('Failed to delete clinic: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
          🏥 Clinic Search
        </h1>
        <p className="text-gray-600">Search for clinics by ID or name</p>
      </div>

      {/* Advanced Filter Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-900">🔍 Filter Clinics</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? '🔄 Searching...' : '🔍 Search'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                🔄 Clear
              </motion.button>
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Clinic ID *</label>
              <input
                type="text"
                value={filters.clinicId}
                onChange={(e) => updateFilter('clinicId', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter clinic ID..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Enterprise ID</label>
              <input
                type="text"
                value={filters.enterpriseId}
                onChange={(e) => updateFilter('enterpriseId', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Filter by enterprise..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Clinic Name</label>
              <input
                type="text"
                value={filters.clinicName}
                onChange={(e) => updateFilter('clinicName', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Filter by name..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Address / City</label>
              <input
                type="text"
                value={filters.address}
                onChange={(e) => updateFilter('address', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Filter by location..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Email</label>
              <input
                type="text"
                value={filters.email}
                onChange={(e) => updateFilter('email', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Filter by email..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1">Phone</label>
              <input
                type="text"
                value={filters.phone}
                onChange={(e) => updateFilter('phone', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Filter by phone..."
                className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <p className="text-blue-700 text-xs">
              <strong>Note:</strong> Clinic ID is required. Other filters are optional and will be applied to the search result.
            </p>
          </div>
        </div>
      </div>

      {/* Search Results - Clickable Tiles */}
      <div className="max-w-7xl mx-auto">
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((clinic) => (
              <motion.div
                key={clinic.clinicId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer"
              >
                {/* Clickable Tile Body */}
                <div onClick={() => handleViewDetails(clinic)} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                        🏥
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{clinic.clinicName}</h3>
                        <p className="text-sm text-gray-500">ID: {clinic.clinicId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span>📍</span> {clinic.clinicCity}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📞</span> {clinic.clinicPhone}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✉️</span> {clinic.clinicEmail}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(clinic);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    👁️ View
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(clinic);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    🗑️ Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && searchResults.length === 0 && filters.clinicId && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No clinics found matching your search.</p>
          </div>
        )}
      </div>

      {/* View/Edit Modal with Tabs */}
      <AnimatePresence>
        {showModal && selectedClinic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isEditing && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClinic.clinicName}</h2>
                    <p className="text-blue-100">Clinic ID: {selectedClinic.clinicId} (Read-only)</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  {[
                    { id: 'details', label: '📋 Details', icon: '📋' },
                    { id: 'contact', label: '📞 Contact', icon: '📞' },
                    { id: 'hours', label: '🕒 Hours', icon: '🕒' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name</label>
                      {isEditing ? (
                        <input
                          value={editData.clinicName}
                          onChange={(e) => setEditData({ ...editData, clinicName: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.clinicName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      {isEditing ? (
                        <textarea
                          value={editData.clinicAddress}
                          onChange={(e) => setEditData({ ...editData, clinicAddress: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.clinicAddress}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      {isEditing ? (
                        <input
                          value={editData.clinicCity}
                          onChange={(e) => setEditData({ ...editData, clinicCity: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.clinicCity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Enterprise ID</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.enterpriseId}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      {isEditing ? (
                        <input
                          value={editData.clinicPhone}
                          onChange={(e) => setEditData({ ...editData, clinicPhone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.clinicPhone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          value={editData.clinicEmail}
                          onChange={(e) => setEditData({ ...editData, clinicEmail: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClinic.clinicEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'hours' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Operating Hours</label>
                    {isEditing ? (
                      <textarea
                        value={editData.operatingHours}
                        onChange={(e) => setEditData({ ...editData, operatingHours: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-line">{selectedClinic.operatingHours}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleEdit}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✏️ Edit Clinic
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saveLoading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && clinicToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-6xl mb-4"
                >
                  🤔
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Are You Sure?</h2>
                <p className="text-white/90">This clinic is about to take a permanent vacation!</p>
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                  <p className="font-bold text-red-900 text-lg">{clinicToDelete.clinicName}</p>
                  <p className="text-red-700 text-sm mt-1">Clinic ID: {clinicToDelete.clinicId}</p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> This will permanently delete all clinic data. This action cannot be undone!
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold transition-all hover:shadow-lg"
                  >
                    😅 Nope, Keep It!
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {deleteLoading ? '⏳ Deleting...' : '💀 Yes, Delete!'}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-8 text-center relative overflow-hidden">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], rotate: [360, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute bottom-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"
                />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="relative z-10"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="text-8xl mb-4"
                  >
                    🎉
                  </motion.div>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2 relative z-10"
                >
                  Success!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-white/90 relative z-10"
                >
                  {successMessage}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewClinics;
