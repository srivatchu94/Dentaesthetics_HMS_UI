import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

// Memoized content component to prevent unnecessary re-renders
const DiagnosisContent = React.memo(({ loading, formData, onInputChange, onSave, isSaving, onClose }) => {
  return (
    <div className="p-8 space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading diagnosis...</p>
        </div>
      ) : (
        <>
          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              🔍 Diagnosis
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => onInputChange('diagnosis', e.target.value)}
              placeholder="Enter diagnosis details..."
              className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💊 Treatment Plan
            </label>
            <textarea
              value={formData.treatment}
              onChange={(e) => onInputChange('treatment', e.target.value)}
              placeholder="Enter treatment plan..."
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💉 Medications
            </label>
            <textarea
              value={formData.medications}
              onChange={(e) => onInputChange('medications', e.target.value)}
              placeholder="Enter prescribed medications..."
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              📝 Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes..."
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition text-sm"
            >
              ✕ Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 text-sm"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Diagnosis'}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
});

DiagnosisContent.displayName = 'DiagnosisContent';

export default function DiagnosisModal({ isOpen, onClose, appointmentId, initialData, onSave }) {
  const [diagnosisData, setDiagnosisData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    medications: ''
  });

  // Fetch diagnosis only when modal opens or appointmentId changes
  useEffect(() => {
    if (appointmentId && isOpen) {
      const fetchDiagnosis = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/Diagnosis/GetDiagnosisByAppointmentId?appointmentId=${appointmentId}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            setDiagnosisData(data);
            setFormData({
              diagnosis: data?.diagnosis || '',
              treatment: data?.treatment || '',
              notes: data?.notes || '',
              medications: data?.medications || ''
            });
          }
        } catch (err) {
          console.error('Error fetching diagnosis:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDiagnosis();
    }
  }, [appointmentId, isOpen]); // Only fetch when these specific values change

  // Initialize form data from initialData only on mount or when explicitly changed
  useEffect(() => {
    if (initialData && isOpen) {
      setDiagnosisData(initialData);
      setFormData({
        diagnosis: initialData.diagnosis || '',
        treatment: initialData.treatment || '',
        notes: initialData.notes || '',
        medications: initialData.medications || ''
      });
    }
  }, [initialData, isOpen]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const method = diagnosisData?.diagnosisId ? 'PUT' : 'POST';
      const endpoint = diagnosisData?.diagnosisId 
        ? `${API_BASE_URL}/Diagnosis/${diagnosisData.diagnosisId}`
        : `${API_BASE_URL}/Diagnosis`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          appointmentId
        })
      });

      if (response.ok) {
        const saved = await response.json();
        setDiagnosisData(saved);
        if (onSave) onSave();
      }
    } catch (err) {
      console.error('Error saving diagnosis:', err);
    } finally {
      setIsSaving(false);
    }
  }, [diagnosisData?.diagnosisId, formData, appointmentId, onSave]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-pink-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sticky top-0 flex items-center justify-between text-white">
              <div>
                <h2 className="text-2xl font-bold">🏥 Diagnosis & Treatment</h2>
                <p className="text-purple-100">Appointment ID: {appointmentId}</p>
              </div>
              <button
                onClick={onClose}
                className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* Content - Memoized to prevent unnecessary re-renders */}
            <DiagnosisContent
              loading={loading}
              formData={formData}
              onInputChange={handleInputChange}
              onSave={handleSave}
              isSaving={isSaving}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
