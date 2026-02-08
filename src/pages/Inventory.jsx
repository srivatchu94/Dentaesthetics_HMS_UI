import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Inventory() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  // Order form state
  const [orderForm, setOrderForm] = useState({
    vendor: '',
    itemName: '',
    quantity: '',
    unitPrice: '',
    notes: ''
  });

  // Sample suppliers for dropdown
  const [suppliers] = useState([
    { id: 1, name: 'MediCare Supplies', phone: '+91-9876543210', email: 'info@medicaresupp.com' },
    { id: 2, name: 'DentalCo Inc', phone: '+91-8765432109', email: 'sales@dentalco.com' },
    { id: 3, name: 'Health Plus Ltd', phone: '+91-7654321098', email: 'contact@healthplus.com' }
  ]);

  // Sample inventory items
  const [inventoryItems] = useState([
    { id: 1, name: 'Dental Paste (500g)', unit: 'Box' },
    { id: 2, name: 'Surgical Gloves (Medium)', unit: 'Box' },
    { id: 3, name: 'Face Masks (50pcs)', unit: 'Pack' },
    { id: 4, name: 'Dental Forceps Set', unit: 'Set' },
    { id: 5, name: 'Sterilization Pouches', unit: 'Pack' },
    { id: 6, name: 'Temporary Filling Material', unit: 'Syringe' }
  ]);

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    console.log('Supplier submitted:', supplierForm);
    alert('✅ Supplier added successfully!');
    setShowAddModal(false);
    setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!orderForm.vendor || !orderForm.itemName || !orderForm.quantity || !orderForm.unitPrice) {
      alert('⚠️ Please fill all required fields!');
      return;
    }
    console.log('Order placed:', orderForm);
    alert(`✅ Order placed successfully!\n\nVendor: ${orderForm.vendor}\nItem: ${orderForm.itemName}\nQuantity: ${orderForm.quantity}`);
    setShowOrderModal(false);
    setOrderForm({ vendor: '', itemName: '', quantity: '', unitPrice: '', notes: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20">
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <span className="text-5xl">📦</span>
            Inventory Management System
          </h1>
          <p className="text-xl text-purple-100">
            Manage your master inventory and clinic-specific stocks seamlessly
          </p>
        </div>
      </motion.div>

      {/* Section Panels - Like Patients/Clinics Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Master Inventory Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-indigo-200 overflow-hidden cursor-pointer group"
          onClick={() => navigate('/inventory/add-master')}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">➕</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Add Master Inventory
              </h2>
              <p className="text-emerald-50 text-sm">
                Create and manage master inventory items
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-stone-600 mb-6 leading-relaxed">
              Define item names, categories, SKUs, units, and other essential details for your inventory system.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Add multiple items at once</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Categorize and organize</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Define units and SKUs</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/inventory/add-master');
              }}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Start Adding Items
            </motion.button>
          </div>
        </motion.div>

        {/* View Master Inventory Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden cursor-pointer group"
          onClick={() => navigate('/inventory/view-master')}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">📋</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                View Master Inventory
              </h2>
              <p className="text-blue-50 text-sm">
                Browse and manage your complete catalog
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-stone-600 mb-6 leading-relaxed">
              Browse all master inventory items, search by name, edit details, and manage your product catalog.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-blue-700 bg-blue-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">View all items</span>
              </div>
              <div className="flex items-center gap-3 text-blue-700 bg-blue-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Edit item details</span>
              </div>
              <div className="flex items-center gap-3 text-blue-700 bg-blue-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Search and filter</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/inventory/view-master');
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Browse Inventory
            </motion.button>
          </div>
        </motion.div>

        {/* Suppliers Management Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 overflow-hidden cursor-pointer group"
          onClick={() => setShowAddModal(true)}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">🚚</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Suppliers Management
              </h2>
              <p className="text-orange-50 text-sm">
                Manage supplier information and contacts
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-stone-600 mb-6 leading-relaxed">
              Add and manage supplier information including basic details, contact information, and maintain supplier database.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Add supplier details</span>
              </div>
              <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Contact information</span>
              </div>
              <div className="flex items-center gap-3 text-orange-700 bg-orange-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Supplier database</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddModal(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Manage Suppliers
            </motion.button>
          </div>
        </motion.div>

        {/* Place Order Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden cursor-pointer group"
          onClick={() => setShowOrderModal(true)}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">🛒</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Place New Order
              </h2>
              <p className="text-purple-50 text-sm">
                Order inventory items from vendors
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-stone-600 mb-6 leading-relaxed">
              Place orders for inventory items, manage quantities, select vendors, and track your orders.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-purple-700 bg-purple-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Select vendor</span>
              </div>
              <div className="flex items-center gap-3 text-purple-700 bg-purple-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Choose items</span>
              </div>
              <div className="flex items-center gap-3 text-purple-700 bg-purple-50 p-3 rounded-lg">
                <span className="text-xl font-bold">✓</span>
                <span className="font-semibold">Set quantities & prices</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowOrderModal(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Place Order
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    🚚
                  </div>
                  <h2 className="text-2xl font-bold text-white">Add New Supplier</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSupplierSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  required
                  placeholder="Enter supplier name"
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="supplier@example.com"
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                <textarea
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Enter complete address"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-stone-700 hover:text-stone-900 font-semibold transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all"
                >
                  Add Supplier
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    🛒
                  </div>
                  <h2 className="text-2xl font-bold text-white">Place New Order</h2>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
              {/* Vendor Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Select Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderForm.vendor}
                  onChange={(e) => setOrderForm({ ...orderForm, vendor: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="">Choose a vendor...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name} - {supplier.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Select Item <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderForm.itemName}
                  onChange={(e) => setOrderForm({ ...orderForm, itemName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="">Choose an item...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    required
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Unit Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={orderForm.unitPrice}
                    onChange={(e) => setOrderForm({ ...orderForm, unitPrice: e.target.value })}
                    required
                    placeholder="Enter unit price"
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Total Amount Display */}
              {orderForm.quantity && orderForm.unitPrice && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-purple-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ₹{(parseFloat(orderForm.quantity) * parseFloat(orderForm.unitPrice)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Additional Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Any special instructions or delivery notes..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOrderModal(false)}
                  className="px-6 py-2.5 text-stone-700 hover:text-stone-900 font-semibold transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all"
                >
                  Place Order
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
