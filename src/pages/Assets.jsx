import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAssetsByClinicId,
  getAssetsByEnterpriseId,
  deleteAsset as deleteAssetAPI,
  listClinics
} from '../api/hmsApi';
import { getSelectedAccess } from '../services/authService';
import { getUserAccess } from '../services/tokenManager';
import AddAssetModal from '../components/AddAssetModal';
import EditAssetModal from '../components/EditAssetModal';
import SuccessModal from '../components/SuccessModal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successEmoji, setSuccessEmoji] = useState('🎉');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const successMessages = [
    '🎊 Asset registered! Your clinic equipment is now tracked!',
    '✨ Boom! New asset added to your arsenal!',
    '🚀 Asset added! Your inventory just got stronger!',
    '💪 Equipment registered! Your clinic is now more organized!',
    '🎯 Asset stored! Ready for maintenance tracking!',
    '🏆 New asset added! Your clinic infrastructure is growing!',
    '⚡ Asset added! Stay on top of your equipment!',
    '🌟 Successfully registered! Your clinic just leveled up!',
  ];

  // Get auth data on mount
  useEffect(() => {
    const selectedAccess = getSelectedAccess();
    if (selectedAccess) {
      setSelectedEnterprise(selectedAccess.enterpriseId);
      
      // Get all clinics for entity admin (multiple clinic access)
      const userAccess = getUserAccess();
      if (userAccess && userAccess.length > 0) {
        // Extract unique clinics from access array
        const clinicList = userAccess.map(access => ({
          clinicID: access.clinicId,
          enterpriseId: access.enterpriseId
        }));
        setClinics(clinicList);
        
        // If only one clinic, auto-select it; if multiple, leave unselected for enterprise view
        if (clinicList.length === 1) {
          setSelectedClinic(clinicList[0].clinicID);
        }
      }
    }
  }, []);

  // Fetch clinic details if needed (clinics are now from auth payload)
  useEffect(() => {
    const fetchClinicDetails = async () => {
      try {
        // Optionally fetch full clinic details with names if available
        const allClinics = await listClinics();
        if (allClinics && allClinics.length > 0) {
          // Merge clinic names with our clinic list
          const enrichedClinics = clinics.map(c => {
            const details = allClinics.find(ac => ac.clinicID === c.clinicID);
            return details ? { ...c, clinicName: details.clinicName } : c;
          });
          setClinics(enrichedClinics);
        }
      } catch (error) {
        console.error('Failed to fetch clinic details:', error);
      }
    };

    if (clinics.length > 0 && selectedEnterprise) {
      fetchClinicDetails();
    }
  }, [selectedEnterprise]);

  // Fetch assets based on selection (clinic-specific or enterprise-wide)
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        if (selectedClinic) {
          // Fetch assets for specific clinic
          const data = await getAssetsByClinicId(selectedClinic);
          setAssets(data || []);
        } else if (selectedEnterprise && clinics.length > 1) {
          // Enterprise admin viewing all clinics - fetch enterprise data
          const data = await getAssetsByEnterpriseId(selectedEnterprise);
          setAssets(data || []);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [selectedClinic, selectedEnterprise, clinics.length]);

  const handleAddAsset = () => {
    setShowAddModal(true);
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDeleteAsset = (assetId) => {
    setAssetToDelete(assetId);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAssetAPI(assetToDelete);
      setAssets(assets.filter((a) => a.assetID !== assetToDelete));
      showSuccessMessage('🗑️ Asset deleted successfully!');
      setShowDeleteConfirmation(false);
      setAssetToDelete(null);
    } catch (error) {
      console.error('Failed to delete asset:', error);
      alert('Failed to delete asset');
      setShowDeleteConfirmation(false);
      setAssetToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setAssetToDelete(null);
  };

  const handleAssetAdded = (newAsset) => {
    setAssets([...assets, newAsset]);
    setShowAddModal(false);
    showSuccessMessage(
      successMessages[Math.floor(Math.random() * successMessages.length)]
    );
  };

  const handleAssetUpdated = (updatedAsset) => {
    setAssets(assets.map((a) => (a.assetID === updatedAsset.assetID ? updatedAsset : a)));
    setShowEditModal(false);
    showSuccessMessage('✏️ Asset updated successfully!');
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active') || statusLower.includes('operational')) {
      return 'bg-green-100 text-green-800 border border-green-300';
    } else if (statusLower.includes('maintenance')) {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    } else if (statusLower.includes('inactive') || statusLower.includes('retired')) {
      return 'bg-red-100 text-red-800 border border-red-300';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-300';
  };

  const getEquipmentIcon = (equipment) => {
    const equip = equipment?.toLowerCase() || '';
    if (equip.includes('chair')) return '🪑';
    if (equip.includes('drill')) return '⚙️';
    if (equip.includes('light')) return '💡';
    if (equip.includes('compressor')) return '💨';
    if (equip.includes('scaler')) return '🔧';
    if (equip.includes('suction')) return '🌪️';
    if (equip.includes('xray') || equip.includes('x-ray')) return '📷';
    if (equip.includes('microscope')) return '🔬';
    if (equip.includes('sterilizer')) return '🔥';
    return '🏥';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-800">Equipment & Assets</h1>
            <span className="text-5xl">🏥</span>
          </div>
          <p className="text-gray-600 text-lg">
            Manage your clinic's equipment and assets efficiently
          </p>
        </motion.div>

        {/* Selection Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Enterprise Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enterprise ID
              </label>
              <input
                type="text"
                value={selectedEnterprise || 'Loading...'}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-medium"
              />
            </div>

            {/* Clinic Selection - Optional Dropdown */}
            {clinics.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Clinic ID <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <select
                  value={selectedClinic || ''}
                  onChange={(e) => setSelectedClinic(Number(e.target.value) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                >
                  <option value="">All Clinics (Enterprise View)</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.clinicID} value={clinic.clinicID}>
                      Clinic {clinic.clinicID} {clinic.clinicName ? `(${clinic.clinicName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {(selectedClinic || (clinics.length > 1 && !selectedClinic)) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddAsset}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition"
            >
              <span className="text-lg">➕</span>
              Add New Asset
            </motion.button>
          )}
        </motion.div>

        {/* Assets Grid or Empty State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading assets...</p>
            </div>
          </motion.div>
        ) : assets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Assets Registered Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {clinics.length > 1 && !selectedClinic
                ? 'No assets found across your clinics. Add your first equipment by clicking the button above!'
                : 'We\'re yet to register any assets for this clinic. Click the button above to add your first equipment or asset!'}
            </p>
            {(selectedClinic || (clinics.length > 1 && !selectedClinic)) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddAsset}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center gap-2 hover:shadow-lg transition"
              >
                <span className="text-lg">➕</span>
                Register First Asset
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {assets.map((asset) => (
                <motion.div
                  key={asset.assetID}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden"
                >
                  {/* Card Header with Icon */}
                  <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-20 flex items-center justify-center">
                    <span className="text-4xl">{getEquipmentIcon(asset.equipment)}</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {asset.equipment}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      SN: <span className="font-mono font-semibold">{asset.serialNumber}</span>
                    </p>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span className="font-medium">Purchase Date:</span>
                        <span>
                          {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {asset.lastMaintenance && (
                        <div className="flex justify-between">
                          <span className="font-medium">Last Maintenance:</span>
                          <span>{new Date(asset.lastMaintenance).toLocaleDateString()}</span>
                        </div>
                      )}
                      {asset.nextMaintenance && (
                        <div className="flex justify-between">
                          <span className="font-medium">Next Maintenance:</span>
                          <span className="text-orange-600 font-semibold">
                            {new Date(asset.nextMaintenance).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditAsset(asset)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <span className="text-sm">✏️</span>
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteAsset(asset.assetID)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <span className="text-sm">🗑️</span>
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showAddModal && (
            <AddAssetModal
              clinicId={selectedClinic}
              enterpriseId={selectedEnterprise}
              onAssetAdded={handleAssetAdded}
              onClose={() => setShowAddModal(false)}
            />
          )}
          {showEditModal && selectedAsset && (
            <EditAssetModal
              asset={selectedAsset}
              onAssetUpdated={handleAssetUpdated}
              onClose={() => setShowEditModal(false)}
            />
          )}
          {showSuccess && (
            <SuccessModal
              title="Success!"
              message={successMessage}
              onClose={() => setShowSuccess(false)}
            />
          )}
          {showDeleteConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelDelete}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🗑️</span>
                    <div>
                      <h2 className="text-2xl font-bold">Delete Asset</h2>
                      <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <p className="text-gray-700 text-base mb-6">
                    Are you sure you want to delete this asset? All associated data will be permanently removed.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">Warning:</span> This operation is permanent and cannot be reversed.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelDelete}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Assets;
