import React from "react";
import { motion } from "framer-motion";

const PrescriptionPrint = React.forwardRef(({ prescription, patientInfo, doctorInfo, clinicInfo }, ref) => {
  // Add print styles
  React.useEffect(() => {
    console.log('%c🎨 PrescriptionPrint: Adding print styles', 'color: green; font-weight: bold');
    const style = document.createElement('style');
    style.id = 'prescription-print-styles';
    style.textContent = `
      @media print {
        /* Hide everything except the prescription */
        body * {
          visibility: hidden;
        }
        
        /* Show only the prescription container and its children */
        .prescription-print-container,
        .prescription-print-container * {
          visibility: visible;
        }
        
        /* Position prescription at top of page */
        .prescription-print-container {
          position: absolute;
          left: 0;
          top: 0;
          margin: 0;
          padding: 20mm;
          width: 100%;
          background: white;
          page-break-after: avoid;
        }
        
        /* Ensure colors print correctly */
        .prescription-print-container * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        
        /* Hide modals and overlays during print */
        .fixed,
        [class*="modal"],
        [class*="backdrop"],
        button:not(.prescription-print-container button) {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log('%c✅ Print styles injected', 'color: green; font-weight: bold', { styleId: style.id, length: style.textContent.length });
    return () => {
      document.head.removeChild(style);
      console.log('%c🗑️ Print styles removed', 'color: red; font-weight: bold');
    };
  }, []);

  // Log when component mounts
  React.useEffect(() => {
    console.log('%c📋 PrescriptionPrint mounted with ref:', 'color: blue; font-weight: bold', ref);
  }, [ref]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateAge = (dob) => {
    if (!dob || dob === "0001-01-01T00:00:00") return "-";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : "-";
  };

  // Safely extract and parse medications
  const getMedications = () => {
    if (!prescription) return [];
    
    // Try to get prescriptionContent first
    const content = prescription?.prescriptionContent || prescription?.medicationsList || "";
    
    if (!content || content.trim() === "") {
      return [];
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, try splitting by newline
      const medications = content.split('\n').filter(line => line.trim());
      return medications.length > 0 ? medications : [];
    }
    
    return [];
  };

  const medications = getMedications();

  // Console log for debugging
  React.useEffect(() => {
    console.group('%c📋 PrescriptionPrint Debug Info', 'color: #1f2937; font-weight: bold; font-size: 14px');
    console.log('%c💊 Prescription Data:', 'color: #3b82f6; font-weight: bold');
    if (prescription) {
      console.log('  - prescriptionContent:', prescription.prescriptionContent ? 'Present (' + prescription.prescriptionContent.length + ' chars)' : 'Missing');
      console.log('  - prescriptionDate:', prescription.prescriptionDate);
      console.log('  - Full object:', prescription);
    } else {
      console.warn('  ⚠️ Prescription is NULL/UNDEFINED');
    }
    console.log('%c💊 Medications Extracted:', 'color: #10b981; font-weight: bold', medications.length + ' items');
    medications.slice(0, 3).forEach((med, idx) => console.log(`  [${idx}]:`, med));
    console.log('%c👤 Patient Info:', 'color: #f59e0b; font-weight: bold');
    console.log('  - Name:', patientInfo?.firstName && patientInfo?.lastName ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Missing');
    console.log('  - Full object:', patientInfo);
    console.log('%c👨‍⚕️ Doctor Info:', 'color: #8b5cf6; font-weight: bold', doctorInfo);
    console.log('%c🏥 Clinic Info:', 'color: #ec4899; font-weight: bold', clinicInfo?.clinicName || 'Missing clinic name');
    const container = document.querySelector('.prescription-print-container');
    console.log('%c📦 Container Status:', 'color: #06b6d4; font-weight: bold');
    console.log('  - Found:', !!container);
    if (container) {
      console.log('  - ID:', container.id || 'no-id');
      console.log('  - Classes:', container.className);
      console.log('  - HTML length:', container.outerHTML.length + ' chars');
      console.log('  - Is visible:', window.getComputedStyle(container).display !== 'none');
      console.log('  - Z-index:', window.getComputedStyle(container).zIndex);
      console.log('  - Opacity:', window.getComputedStyle(container).opacity);
      
      // Check all children
      const children = container.querySelectorAll('*');
      console.log('%c📊 Child Elements:', 'color: #6366f1; font-weight: bold', children.length);
      if (children.length === 0) {
        console.warn('⚠️ WARNING: Container has NO child elements!');
      }
    } else {
      console.error('❌ Container NOT FOUND in DOM!');
    }
    
    // Try to find in modal
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      console.log('%c🗂️ Modal Found:', 'color: #0ea5e9; font-weight: bold');
      console.log('  - Display:', window.getComputedStyle(modal).display);
      console.log('  - Visibility:', window.getComputedStyle(modal).visibility);
      console.log('  - Z-index:', window.getComputedStyle(modal).zIndex);
    }
    
    console.groupEnd();
  }, [prescription, medications, patientInfo, doctorInfo, clinicInfo]);

  return (
    <div
      ref={(node) => {
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
        if (node) {
          console.log('%c✅ Prescription container DOM assigned to ref', 'color: green; font-weight: bold');
        }
      }}
      className="prescription-print-container bg-white p-10 w-full max-w-2xl mx-auto"
      style={{ pageBreakAfter: 'always' }}
      id="prescription-print-main"
    >
      {/* Clinic Header */}
      <div className="text-center mb-10 pb-4 border-b-2 border-stone-400">
        <h1 className="text-2xl font-bold text-stone-900">
          {clinicInfo?.clinicName || "Dental Clinic"}
        </h1>
      </div>

      {/* Patient and Doctor Info Panel */}
      <div className="grid grid-cols-2 gap-6 mb-10 bg-stone-50 p-6 rounded-lg border border-stone-300">
        {/* Patient Info */}
        <div className="border-l-4 border-stone-900 pl-4">
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">👤 Patient Name</p>
          <p className="text-lg font-bold text-stone-900 mb-4">
            {(patientInfo?.firstName && patientInfo?.lastName) 
              ? `${patientInfo.firstName} ${patientInfo.lastName}` 
              : (patientInfo?.patientName || "Patient Name")}
          </p>
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">📅 Age</p>
          <p className="text-base font-semibold text-stone-800">
            {patientInfo?.dateOfBirth ? calculateAge(patientInfo.dateOfBirth) : "-"} years
          </p>
        </div>

        {/* Doctor Info */}
        <div className="border-l-4 border-stone-900 pl-4">
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">👨‍⚕️ Doctor Name</p>
          <p className="text-lg font-bold text-stone-900 mb-4">
            Dr. {doctorInfo?.doctorName || "Doctor Name"}
          </p>
          <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">📋 Registration Number</p>
          <p className="text-base font-semibold text-stone-800">
            {doctorInfo?.registrationNumber || "N/A"}
          </p>
        </div>
      </div>

      {/* Prescription Date */}
      <div className="mb-8 pb-4 border-b border-stone-300">
        <p className="text-xs uppercase tracking-wider text-stone-600 font-semibold">📅 Date</p>
        <p className="text-lg font-bold text-stone-900">
          {formatDate(prescription?.prescriptionDate || new Date())}
        </p>
      </div>

      {/* RX Header - Before Medications */}
      <div className="text-center mb-8 py-6">
        <div className="text-5xl font-bold text-stone-900">℞</div>
      </div>

      {/* Medications Section */}
      <div className="mb-10">
        <h3 className="text-sm uppercase font-bold text-stone-900 mb-6 pb-3 border-b-2 border-stone-900 tracking-wider">
          Prescription
        </h3>
        
        {medications && medications.length > 0 ? (
          <ul className="space-y-3">
            {medications.map((med, index) => (
              <li key={index} className="flex items-start bg-stone-50 p-4 rounded border-l-4 border-stone-700">
                <span className="font-bold text-stone-900 mr-4 min-w-fit">{index + 1}.</span>
                <span className="text-stone-800 text-sm">{med}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-stone-600">
            <p className="text-sm">No medications prescribed in this prescription.</p>
          </div>
        )}
      </div>

      {/* Important Note */}
      <div className="mb-10 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
        <p className="text-xs font-bold text-yellow-800 mb-1">⚠️ IMPORTANT:</p>
        <p className="text-xs text-yellow-900">
          Please follow the dosage and frequency as prescribed. If you experience any adverse effects, consult your doctor immediately.
        </p>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-stone-300 text-center text-xs text-stone-600">
        <p className="font-semibold text-stone-700 mb-2">{clinicInfo?.clinicName}</p>
        <p>📞 {clinicInfo?.phone || "Phone"} | 📧 {clinicInfo?.email || "Email"}</p>
        <p className="text-stone-500 mt-4">
          This is an electronically generated prescription.
        </p>
      </div>
    </div>
  );
});

PrescriptionPrint.displayName = "PrescriptionPrint";

export default PrescriptionPrint;
