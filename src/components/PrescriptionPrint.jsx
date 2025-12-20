import React from "react";
import { motion } from "framer-motion";

const PrescriptionPrint = React.forwardRef(({ prescription, patientInfo, doctorInfo, clinicInfo }, ref) => {
  // Add print styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .prescription-print-container {
          margin: 0;
          padding: 0;
          page-break-after: avoid;
          background: white;
        }
        .prescription-print-container * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Safely extract and parse medications
  const getMedications = () => {
    if (!prescription) return [];
    
    // Try to get prescriptionContent first
    const content = prescription?.prescriptionContent || prescription?.medicationsList || "";
    
    if (!content || content.trim() === "") {
      return [];
    }

    // Split by newline and filter empty lines
    const medications = content.split('\n').filter(line => line.trim());
    
    // If still empty, return empty array
    return medications.length > 0 ? medications : [];
  };

  const medications = getMedications();

  // Console log for debugging
  React.useEffect(() => {
    console.log('🖨️ PrescriptionPrint Debug:');
    console.log('Prescription data:', prescription);
    console.log('Medications extracted:', medications);
    console.log('Patient info:', patientInfo);
  }, [prescription, medications, patientInfo]);

  return (
    <div
      ref={ref}
      className="prescription-print-container bg-white p-8 w-full max-w-4xl mx-auto"
      style={{ pageBreakAfter: 'always' }}
    >
      {/* Header with Clinic Info */}
      <div className="border-b-4 border-stone-800 pb-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-stone-900">
              {clinicInfo?.clinicName || "Dentaesthetics Dental Clinic"}
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              {clinicInfo?.address || "Address"}
            </p>
          </div>
          <div className="text-right text-stone-700">
            <p className="font-semibold">📞 {clinicInfo?.phone || "Phone"}</p>
            <p className="text-sm">📧 {clinicInfo?.email || "Email"}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-stone-100 to-stone-200 rounded-lg p-4">
          <h2 className="text-2xl font-bold text-stone-800 text-center">💊 PRESCRIPTION</h2>
        </div>
      </div>

      {/* Doctor and Date Info */}
      <div className="grid grid-cols-2 gap-6 mb-8 pb-4 border-b border-stone-300">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-1">
            Prescribed By
          </p>
          <p className="text-lg font-bold text-stone-900">
            Dr. {doctorInfo?.doctorName || "Doctor Name"}
          </p>
          <p className="text-sm text-stone-600">
            Reg. No: {doctorInfo?.registrationNumber || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-1">
            Date
          </p>
          <p className="text-lg font-bold text-stone-900">
            {formatDate(prescription?.prescriptionDate || new Date())}
          </p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-stone-50 rounded-lg p-4 mb-8 border border-stone-300">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Patient Name</p>
            <p className="text-sm font-bold text-stone-900 mt-1">
              {(patientInfo?.firstName && patientInfo?.lastName) 
                ? `${patientInfo.firstName} ${patientInfo.lastName}` 
                : (patientInfo?.patientName || "Patient Name")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Age / Sex</p>
            <p className="text-sm font-bold text-stone-900 mt-1">
              {patientInfo?.age || "-"} / {patientInfo?.gender || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">Patient ID</p>
            <p className="text-sm font-bold text-stone-900 mt-1">
              {patientInfo?.patientId || patientInfo?.id || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Medications Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-stone-900 mb-4 pb-2 border-b-2 border-stone-400">
          ✓ MEDICATIONS & DOSAGE
        </h3>
        
        {medications && medications.length > 0 ? (
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg border-l-4 border-blue-500"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="flex-1 text-sm text-stone-700 leading-relaxed">
                  {med}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-stone-600">
            <p>📝 No medications prescribed in this prescription.</p>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="mt-12 pt-8 border-t-2 border-stone-300 flex justify-between items-end">
        <div>
          <p className="text-xs text-stone-600 mb-8">Signature</p>
          <div className="w-32 h-16 border-t border-stone-400"></div>
          <p className="text-xs font-semibold text-stone-700 mt-2">Doctor Name</p>
        </div>
        <div className="text-right text-xs text-stone-600">
          <p>Printed on: {formatDate(new Date())}</p>
          <p className="text-xs text-stone-500 mt-2">
            This is a computer-generated prescription. Valid without signature.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-4 border-t border-stone-300 text-center">
        <p className="text-xs text-stone-600">
          ⚕️ This prescription is valid for <span className="font-semibold">90 days</span> from the date of issue.
        </p>
        <p className="text-xs text-stone-500 mt-2">
          Patient should follow doctor's instructions carefully. Keep away from children and pets.
        </p>
      </div>
    </div>
  );
});

PrescriptionPrint.displayName = "PrescriptionPrint";

export default PrescriptionPrint;
