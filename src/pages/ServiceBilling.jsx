import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ServiceBillingManagement from '../components/ServiceBillingManagement';
import { ServiceBillingModal } from '../components/ServiceBillingModal';

export default function ServiceBilling() {
  const navigate = useNavigate();
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalMode, setModalMode] = useState("edit"); // "edit" for create, "view" for view, "edit-invoice" for editing existing
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePaymentClick = (appointment) => {
    console.log("🎯 handlePaymentClick received:", appointment);
    console.log("✅ Invoice Number in appointment:", appointment.invoiceNumber);
    console.log("📝 Mode:", appointment.mode);
    setSelectedAppointment(appointment);
    // Set mode based on appointment.mode parameter
    if (appointment.mode === "view") {
      setModalMode("view");
    } else if (appointment.mode === "edit") {
      setModalMode("edit-invoice");
    } else {
      setModalMode("edit");
    }
    setShowBillingModal(true);
  };

  const handleBillingSuccess = () => {
    setShowBillingModal(false);
    setSelectedAppointment(null);
    // Trigger refresh in the management component
    setRefreshTrigger(prev => prev + 1);
  };

  const handleModalClose = () => {
    setShowBillingModal(false);
    setSelectedAppointment(null);
    // Trigger refresh when modal closes (both success and cancel cases)
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-20 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-300/20 to-blue-300/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/60 rounded-xl transition-all"
              title="Go Back"
            >
              <span className="text-2xl">←</span>
            </motion.button>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Service Billing
              </h1>
              <p className="text-slate-600 mt-1 text-lg">Invoice Management & Appointment Billing</p>
            </div>
          </div>
        </motion.div>

        {/* Management Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ServiceBillingManagement 
            onPaymentClick={handlePaymentClick}
            refreshTrigger={refreshTrigger}
          />
        </motion.div>
      </div>

      {/* Modal rendered at page level - outside constrained context */}
      <AnimatePresence>
        {showBillingModal && selectedAppointment && (
          <ServiceBillingModal
            show={showBillingModal}
            onClose={handleModalClose}
            appointmentId={selectedAppointment.appointmentId}
            appointmentDetails={selectedAppointment}
            invoiceNumber={selectedAppointment.invoiceNumber}
            onSuccess={handleBillingSuccess}
            initialMode={modalMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
