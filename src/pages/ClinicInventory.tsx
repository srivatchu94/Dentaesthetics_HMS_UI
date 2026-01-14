import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InventoryAutoComplete from '../components/InventoryAutoComplete';
import AddToMasterInventoryModal from '../components/AddToMasterInventoryModal';
import {
  listClinicInventories,
  createClinicInventory,
  updateClinicInventory,
  deleteClinicInventory,
  searchClinicInventories,
  listInventoryMasters,
  getInventoryStats,
  saveClinicInventoryBatch,
  addInventoryMasterItemsBulk
} from '../services/inventoryService';
import { listEnterprises } from '../services/enterpriseService';
import { listClinics, getClinicsByEnterpriseId } from '../services/clinicService';
import type { ClinicInventory, InventoryMaster, EnterpriseModel, ClinicModel, InventoryAddRow, MasterInventoryAddRow } from '../Interfaces';

export default function ClinicInventory() {
  const [inventoryItems, setInventoryItems] = useState<(ClinicInventory & { itemName?: string })[]>([]);
  const [masterItems, setMasterItems] = useState<InventoryMaster[]>([]);
  const [enterprises, setEnterprises] = useState<EnterpriseModel[]>([]);
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<number | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [showAddMasterFromAutocomplete, setShowAddMasterFromAutocomplete] = useState(false);
  const [showInventoryDetailModal, setShowInventoryDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<(ClinicInventory & { itemName?: string }) | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [autocompleteNewItemName, setAutocompleteNewItemName] = useState('');
  
  // Multi-row states
  const [inventoryRows, setInventoryRows] = useState<InventoryAddRow[]>([{
    itemId: 0,
    itemName: '',
    quantityAvailable: 0,
    reorderLevel: 0,
    minimumStock: 0,
    storageLocation: '',
    unit: '',
    description: '',
    status: 'Available'
  }]);

  // Master inventory add states
  const [masterRows, setMasterRows] = useState<MasterInventoryAddRow[]>([{
    itemName: '',
    itemCode: '',
    category: '',
    subCategory: '',
    unit: '',
    isActive: true
  }]);

  const [editingInventory, setEditingInventory] = useState<Partial<ClinicInventory>>({});

  const inventoryStatuses = ['Available', 'LowStock', 'OutOfStock', 'Damaged', 'Expired'];
  const unitOptions = ['Box', 'Tablet', 'Piece', 'Bottle', 'Tube', 'Pack', 'Grams', 'Liters', 'ml', 'Units'];
  const categoryOptions = ['Consumables', 'Equipment', 'Instruments', 'Medicines', 'Supplies', 'Other'];
  const subCategoryOptions = ['Dental Materials', 'Cleaning Supplies', 'PPE', 'Sterilization', 'Office Supplies', 'Medications'];

  // Funny success messages
  const funnyMessages = [
    '🎉 Boom! Your inventory is now legendary! 🚀',
    '💎 Holy moly! You just became an inventory wizard! 🧙‍♂️',
    '🌟 Your inventory is so organized, Marie Kondo just called! 👀',
    '🎊 Bazinga! Your items are perfectly stocked! 🎯',
    '🏆 You deserve a medal! Your inventory is immaculate! 👑',
    '🚀 Houston, we have perfect inventory! 🌌',
    '💫 Your inventory is chef\'s kiss! 👨‍🍳',
    '🎯 Nailed it! Your inventory is on point! 💯',
    '✨ Abracadabra! Magic inventory levels detected! 🎩'
  ];

  const getRandomMessage = () => funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEnterprise && selectedClinic) {
      loadClinicInventory();
    }
  }, [selectedEnterprise, selectedClinic]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [enterpriseList, masterList] = await Promise.all([
        listEnterprises(),
        listInventoryMasters()
      ]);
      setEnterprises(enterpriseList);
      setMasterItems(masterList);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseChange = async (enterpriseId: number) => {
    setSelectedEnterprise(enterpriseId);
    setSelectedClinic(null);
    setInventoryItems([]);
    
    try {
      const clinicList = await getClinicsByEnterpriseId(enterpriseId);
      setClinics(clinicList);
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  };

  const loadClinicInventory = async () => {
    if (!selectedEnterprise || !selectedClinic) return;

    setLoading(true);
    try {
      const [inventoryList, statsData] = await Promise.all([
        listClinicInventories(selectedEnterprise, selectedClinic),
        getInventoryStats(selectedEnterprise, selectedClinic)
      ]);

      const enrichedInventory = (inventoryList || []).map(inv => ({
        ...inv,
        itemName: masterItems.find(m => m.itemId === inv.itemId)?.itemName || 'Unknown Item',
        status: inv.status || 'Available'
      }));

      setInventoryItems(enrichedInventory);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading clinic inventory:', error);
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnterprise || !selectedClinic) {
      showError('Please select enterprise and clinic');
      return;
    }

    // Validate all rows
    const validRows = inventoryRows.filter(row => {
      return row.itemId > 0 && row.quantityAvailable > 0 && row.storageLocation.trim();
    });

    if (validRows.length === 0) {
      showError('Please fill at least one inventory item with required fields');
      return;
    }

    setLoading(true);
    try {
      // Convert to ClinicInventory format for batch save
      const itemsToSave: ClinicInventory[] = validRows.map(row => ({
        inventoryId: 0, // New items
        itemId: row.itemId,
        enterpriseId: selectedEnterprise,
        clinicId: selectedClinic,
        quantityAvailable: row.quantityAvailable,
        reorderLevel: row.reorderLevel,
        minimumStock: row.minimumStock,
        storageLocation: row.storageLocation,
        status: row.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await saveClinicInventoryBatch(selectedEnterprise, selectedClinic, itemsToSave);

      const funnMessage = getRandomMessage();
      showSuccess(funnMessage);
      setShowAddModal(false);
      
      // Reset form
      setInventoryRows([{
        itemId: 0,
        itemName: '',
        quantityAvailable: 0,
        reorderLevel: 0,
        minimumStock: 0,
        storageLocation: '',
        unit: '',
        description: '',
        status: 'Available'
      }]);

      loadClinicInventory();
    } catch (error) {
      console.error('Error adding inventory:', error);
      showError('Failed to add inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.inventoryId || !selectedEnterprise || !selectedClinic) return;

    setLoading(true);
    try {
      // Use batch save for consistency
      const itemsToUpdate: ClinicInventory[] = [{
        inventoryId: selectedItem.inventoryId,
        itemId: selectedItem.itemId,
        enterpriseId: selectedEnterprise,
        clinicId: selectedClinic,
        quantityAvailable: editingInventory.quantityAvailable || selectedItem.quantityAvailable,
        reorderLevel: editingInventory.reorderLevel || selectedItem.reorderLevel,
        minimumStock: editingInventory.minimumStock || selectedItem.minimumStock,
        storageLocation: editingInventory.storageLocation || selectedItem.storageLocation,
        status: editingInventory.status || selectedItem.status,
        createdAt: selectedItem.createdAt,
        updatedAt: new Date().toISOString()
      }];

      await saveClinicInventoryBatch(selectedEnterprise, selectedClinic, itemsToUpdate);

      showSuccess('💾 Inventory updated successfully!');
      setShowEditModal(false);
      loadClinicInventory();
    } catch (error) {
      console.error('Error updating inventory:', error);
      showError('Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem?.inventoryId || !selectedEnterprise || !selectedClinic) return;

    setLoading(true);
    try {
      // Call delete with proper parameters: enterpriseId, clinicId, inventoryId
      await deleteClinicInventory(selectedEnterprise, selectedClinic, selectedItem.inventoryId);

      showSuccess('🗑️ Inventory deleted successfully!');
      setShowDeleteModal(false);
      loadClinicInventory();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      showError('Failed to delete inventory');
    } finally {
      setLoading(false);
    }
  };

  // Multi-row inventory handlers
  const addInventoryRow = () => {
    setInventoryRows([...inventoryRows, {
      itemId: 0,
      itemName: '',
      quantityAvailable: 0,
      reorderLevel: 0,
      minimumStock: 0,
      storageLocation: '',
      unit: '',
      description: '',
      status: 'Available'
    }]);
  };

  const removeInventoryRow = (index: number) => {
    if (inventoryRows.length > 1) {
      setInventoryRows(inventoryRows.filter((_, i) => i !== index));
    } else {
      showError('You must keep at least one row');
    }
  };

  const updateInventoryRow = (index: number, field: keyof InventoryAddRow, value: any) => {
    const updatedRows = [...inventoryRows];
    
    // If updating itemId, also populate itemName and unit
    if (field === 'itemId' && value > 0) {
      const selectedMaster = masterItems.find(m => m.itemId === value);
      if (selectedMaster) {
        updatedRows[index] = {
          ...updatedRows[index],
          itemId: value,
          itemName: selectedMaster.itemName,
          unit: selectedMaster.unit
        };
      }
    } else {
      updatedRows[index] = { ...updatedRows[index], [field]: value };
    }
    
    setInventoryRows(updatedRows);
  };

  // Master inventory handlers
  const addMasterRow = () => {
    setMasterRows([...masterRows, {
      itemName: '',
      itemCode: '',
      category: '',
      subCategory: '',
      unit: '',
      isActive: true
    }]);
  };

  const removeMasterRow = (index: number) => {
    if (masterRows.length > 1) {
      setMasterRows(masterRows.filter((_, i) => i !== index));
    } else {
      showError('You must keep at least one row');
    }
  };

  const updateMasterRow = (index: number, field: keyof MasterInventoryAddRow, value: any) => {
    const updatedRows = [...masterRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setMasterRows(updatedRows);
  };

  const handleAddMasterItems = async (validRows: MasterInventoryAddRow[]) => {
    setLoading(true);
    try {
      await addInventoryMasterItemsBulk(validRows);

      // Reload master items
      const updatedMasters = await listInventoryMasters();
      setMasterItems(updatedMasters);

      const funnyMsg = getRandomMessage();
      showSuccess(`${funnyMsg} New items are ready for selection!`);
      setShowAddMasterModal(false);
      setShowAddMasterFromAutocomplete(false);
      
      // Reset form
      setMasterRows([{
        itemName: '',
        itemCode: '',
        category: '',
        subCategory: '',
        unit: '',
        isActive: true
      }]);

      setAutocompleteNewItemName('');
    } catch (error) {
      console.error('Error adding master items:', error);
      showError('Failed to add items to master inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedEnterprise || !selectedClinic) {
      showError('Please select enterprise and clinic first');
      return;
    }

    if (!searchTerm.trim()) {
      loadClinicInventory();
      return;
    }

    setLoading(true);
    try {
      const results = await searchClinicInventories({
        enterpriseId: selectedEnterprise,
        clinicId: selectedClinic,
        itemName: searchTerm
      });

      const enrichedResults = results.map(inv => ({
        ...inv,
        itemName: masterItems.find(m => m.itemId === inv.itemId)?.itemName || 'Unknown Item'
      }));

      setInventoryItems(enrichedResults);
    } catch (error) {
      console.error('Error searching:', error);
      showError('Failed to search inventory');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: ClinicInventory & { itemName?: string }) => {
    setSelectedItem(item);
    setEditingInventory({
      quantityAvailable: item.quantityAvailable,
      reorderLevel: item.reorderLevel,
      minimumStock: item.minimumStock,
      storageLocation: item.storageLocation,
      status: item.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item: ClinicInventory & { itemName?: string }) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'from-blue-400 to-cyan-500';
    
    switch (status) {
      case 'Available':
        return 'from-green-400 to-emerald-500';
      case 'LowStock':
        return 'from-yellow-400 to-amber-500';
      case 'OutOfStock':
        return 'from-red-400 to-rose-500';
      case 'Damaged':
        return 'from-orange-400 to-red-500';
      case 'Expired':
        return 'from-gray-400 to-slate-500';
      default:
        return 'from-blue-400 to-cyan-500';
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const showError = (message: string) => {
    alert(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <span className="text-5xl">🏥</span>
            Clinic Inventory Management
          </h1>
          <p className="text-blue-100 mt-2">Manage inventory for your clinics across the enterprise</p>
        </div>

        {/* Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Enterprise *</label>
              <select
                value={selectedEnterprise || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleEnterpriseChange(parseInt(value));
                  }
                }}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Enterprise --</option>
                {enterprises && enterprises.map(ent => (
                  <option key={ent.enterpriseId} value={ent.enterpriseId}>
                    {ent.enterpriseName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Clinic *</label>
              <select
                value={selectedClinic || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    setSelectedClinic(parseInt(value));
                  } else {
                    setSelectedClinic(null);
                  }
                }}
                disabled={!selectedEnterprise}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- Choose Clinic --</option>
                {clinics && clinics.map(clinic => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.clinicName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Display */}
          {stats && selectedEnterprise && selectedClinic && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                <p className="text-sm text-green-700 font-semibold">Total Items</p>
                <p className="text-3xl font-bold text-green-900">{stats.totalItems}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-4 border-2 border-blue-300">
                <p className="text-sm text-blue-700 font-semibold">Available</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalItems - stats.lowStockItems - stats.outOfStockItems}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-4 border-2 border-yellow-300">
                <p className="text-sm text-yellow-700 font-semibold">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.lowStockItems}</p>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-lg p-4 border-2 border-red-300">
                <p className="text-sm text-red-700 font-semibold">Out of Stock</p>
                <p className="text-3xl font-bold text-red-900">{stats.outOfStockItems}</p>
              </div>
            </motion.div>
          )}

          {/* Search & Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Item</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search inventory items..."
                disabled={!selectedEnterprise || !selectedClinic}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!selectedEnterprise || !selectedClinic}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-md disabled:opacity-50"
            >
              🔍 Search
            </button>
            <button
              onClick={async () => {
                // Reload master items when opening modal to ensure dropdown has fresh data
                try {
                  const masterList = await listInventoryMasters();
                  setMasterItems(masterList);
                } catch (error) {
                  console.error('Error loading master items:', error);
                }
                setShowAddModal(true);
              }}
              disabled={!selectedEnterprise || !selectedClinic}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50"
            >
              ➕ Add Item
            </button>
            <button
              onClick={() => setShowAddMasterModal(true)}
              disabled={!selectedEnterprise || !selectedClinic}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50"
            >
              📦 Add to Master Inventory
            </button>
          </div>
        </motion.div>

        {/* Inventory Display */}
        {!selectedEnterprise || !selectedClinic ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-blue-300"
          >
            <span className="text-6xl">🏢</span>
            <p className="text-xl text-gray-600 mt-4">Please select an Enterprise and Clinic to view inventory</p>
          </motion.div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="text-4xl">⏳</div>
            <p className="text-gray-600 mt-4">Loading inventory...</p>
          </div>
        ) : inventoryItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <span className="text-6xl">📭</span>
            <p className="text-xl text-gray-600 mt-4">No inventory items in this clinic</p>
            <button
              onClick={async () => {
                // Reload master items when opening modal to ensure dropdown has fresh data
                try {
                  const masterList = await listInventoryMasters();
                  setMasterItems(masterList);
                } catch (error) {
                  console.error('Error loading master items:', error);
                }
                setShowAddModal(true);
              }}
              className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              ➕ Add First Item
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {inventoryItems.map((item, index) => (
              <motion.div
                key={item.inventoryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setShowInventoryDetailModal(true);
                }}
              >
                <div className={`bg-gradient-to-br ${getStatusColor(item.status)} rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden h-full transform group-hover:scale-105`}>
                  <div className="bg-white/10 backdrop-blur p-4">
                    <h3 className="text-lg font-bold text-white">{item.itemName}</h3>
                    <p className="text-white/80 text-sm">Location: {item.storageLocation}</p>
                  </div>

                  <div className="p-6 bg-white">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-600">Quantity</span>
                        <span className="text-2xl font-bold text-gray-900">{item.quantityAvailable}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.min((item.quantityAvailable / (item.reorderLevel * 2)) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-gray-600">Reorder Level</p>
                          <p className="font-bold text-yellow-700">{item.reorderLevel}</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-gray-600">Min Stock</p>
                          <p className="font-bold text-red-700">{item.minimumStock}</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                          item.status === 'Available' ? 'bg-green-500' :
                          item.status === 'LowStock' ? 'bg-yellow-500' :
                          item.status === 'OutOfStock' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {item.status || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(item);
                        }}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add Inventory Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 sticky top-0">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>➕</span> Add Inventory Items (Bulk Entry)
                  </h2>
                  <p className="text-green-100 text-sm mt-1">Add multiple inventory items at once</p>
                </div>

                <form onSubmit={handleAddInventory} className="p-6">
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-green-300 bg-green-50">
                          <th className="text-left p-3 font-semibold text-gray-700">Item *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Unit</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Quantity *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Reorder Level</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Min Stock</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Location *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryRows.map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <InventoryAutoComplete
                                value={{ itemId: row.itemId, itemName: row.itemName }}
                                masterItems={masterItems}
                                placeholder="Search item..."
                                onChange={(item) => {
                                  updateInventoryRow(index, 'itemId', item.itemId);
                                  updateInventoryRow(index, 'itemName', item.itemName);
                                  updateInventoryRow(index, 'unit', item.unit || '');
                                }}
                                onSelect={(item) => {
                                  updateInventoryRow(index, 'itemId', item.itemId);
                                  updateInventoryRow(index, 'itemName', item.itemName);
                                  updateInventoryRow(index, 'unit', item.unit || '');
                                }}
                                onAddNewItem={(itemData) => {
                                  setAutocompleteNewItemName(itemData.itemName);
                                  setShowAddMasterFromAutocomplete(true);
                                }}
                                className="w-full"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={row.unit || ''}
                                disabled
                                className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.quantityAvailable}
                                onChange={(e) => updateInventoryRow(index, 'quantityAvailable', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.reorderLevel}
                                onChange={(e) => updateInventoryRow(index, 'reorderLevel', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.minimumStock}
                                onChange={(e) => updateInventoryRow(index, 'minimumStock', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="e.g., Shelf A-1"
                                value={row.storageLocation}
                                onChange={(e) => updateInventoryRow(index, 'storageLocation', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={row.status}
                                onChange={(e) => updateInventoryRow(index, 'status', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500"
                              >
                                {inventoryStatuses.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeInventoryRow(index)}
                                className="text-red-600 hover:text-red-700 font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <button
                      type="button"
                      onClick={addInventoryRow}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      ➕ Add Row
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMasterModal(true)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      📦 Add to Master Inventory
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : '💾 Save All Items'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Master Inventory Modal */}
        <AnimatePresence>
          {showAddMasterModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              onClick={() => setShowAddMasterModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 sticky top-0">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>📦</span> Add Items to Master Inventory
                  </h2>
                  <p className="text-purple-100 text-sm mt-1">Create new inventory items for your clinic</p>
                </div>

                <form onSubmit={handleAddMasterItems} className="p-6">
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-purple-300 bg-purple-50">
                          <th className="text-left p-3 font-semibold text-gray-700">Item Name *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Item Code *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Category *</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Sub Category</th>
                          <th className="text-left p-3 font-semibold text-gray-700">Unit *</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Active</th>
                          <th className="text-center p-3 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterRows.map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="e.g., Surgical Mask"
                                value={row.itemName}
                                onChange={(e) => updateMasterRow(index, 'itemName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="e.g., SKU-001"
                                value={row.itemCode}
                                onChange={(e) => updateMasterRow(index, 'itemCode', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={row.category}
                                onChange={(e) => updateMasterRow(index, 'category', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Select</option>
                                {categoryOptions.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={row.subCategory}
                                onChange={(e) => updateMasterRow(index, 'subCategory', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Select</option>
                                {subCategoryOptions.map(subcat => (
                                  <option key={subcat} value={subcat}>{subcat}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={row.unit}
                                onChange={(e) => updateMasterRow(index, 'unit', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Select</option>
                                {unitOptions.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.isActive}
                                onChange={(e) => updateMasterRow(index, 'isActive', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeMasterRow(index)}
                                className="text-red-600 hover:text-red-700 font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <button
                      type="button"
                      onClick={addMasterRow}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      ➕ Add Row
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowAddMasterModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : '💾 Add to Master'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Inventory Modal */}
        <AnimatePresence>
          {showEditModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>✏️</span> Edit Clinic Inventory
                  </h2>
                </div>

                <form onSubmit={handleEditInventory} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item</label>
                      <input
                        type="text"
                        value={selectedItem.itemName || 'Unknown'}
                        disabled
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Available *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingInventory.quantityAvailable || ''}
                        onChange={(e) => setEditingInventory({ ...editingInventory, quantityAvailable: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Reorder Level *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingInventory.reorderLevel || ''}
                        onChange={(e) => setEditingInventory({ ...editingInventory, reorderLevel: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Stock *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingInventory.minimumStock || ''}
                        onChange={(e) => setEditingInventory({ ...editingInventory, minimumStock: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Storage Location *</label>
                      <input
                        type="text"
                        required
                        value={editingInventory.storageLocation || ''}
                        onChange={(e) => setEditingInventory({ ...editingInventory, storageLocation: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                      <select
                        required
                        value={editingInventory.status || ''}
                        onChange={(e) => setEditingInventory({ ...editingInventory, status: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        {inventoryStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
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
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : '💾 Update'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              >
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>⚠️</span> Confirm Delete
                  </h2>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete <strong>{selectedItem.itemName}</strong> from this clinic's inventory?
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : '🗑️ Delete'}
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-[200] p-4"
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                <div className="text-6xl mb-4">✨</div>
                <p className="text-xl font-bold text-gray-800">{successMessage}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add to Master Inventory Modal - from Autocomplete */}
        <AddToMasterInventoryModal
          isOpen={showAddMasterFromAutocomplete}
          onClose={() => {
            setShowAddMasterFromAutocomplete(false);
            setAutocompleteNewItemName('');
          }}
          onSubmit={handleAddMasterItems}
          isLoading={loading}
          initialItemName={autocompleteNewItemName}
        />
      </motion.div>
    </div>
  );
}
