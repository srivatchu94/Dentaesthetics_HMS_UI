import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentEditModal({
  isOpen,
  onClose,
  editPaymentForm,
  setEditPaymentForm,
  isSaving,
  onSave
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0 flex justify-between items-center text-white flex-shrink-0 z-10">
              <h2 className="text-xl md:text-2xl font-bold">✏️ Edit Payment Details</h2>
              <button
                onClick={onClose}
                className="text-2xl hover:bg-white/20 p-2 rounded-full transition flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billable Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPaymentForm.billableAmount}
                  onChange={(e) => {
                    const billable = parseFloat(e.target.value) || 0;
                    const paid = parseFloat(editPaymentForm.paidAmount) || 0;
                    const pending = Math.max(billable - paid, 0);
                    setEditPaymentForm({ 
                      ...editPaymentForm, 
                      billableAmount: billable,
                      pendingAmount: pending
                    });
                  }}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPaymentForm.paidAmount}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    const billable = parseFloat(editPaymentForm.billableAmount) || 0;
                    const pending = Math.max(billable - paid, 0);
                    setEditPaymentForm({ 
                      ...editPaymentForm, 
                      paidAmount: paid,
                      pendingAmount: pending
                    });
                  }}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pending Amount (auto-calculated)</label>
                <input
                  type="number"
                  value={editPaymentForm.pendingAmount}
                  disabled
                  className="w-full p-3 border-2 border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status</label>
                <select
                  value={editPaymentForm.paymentStatus}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, paymentStatus: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Status</label>
                <select
                  value={editPaymentForm.appointmentStatus}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, appointmentStatus: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="NoShow">No-show</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 md:p-6 flex gap-3 border-t border-slate-200 flex-shrink-0 sticky bottom-0 z-10">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-50 text-sm md:text-base"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 text-sm md:text-base"
              >
                {isSaving ? '💾 Saving...' : '💾 Save Changes'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
