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
          console.log('  - Element:', node.tagName);
          console.log('  - ID:', node.id);
          console.log('  - Classes:', node.className);
          console.log('  - HTML Length:', node.outerHTML.length, 'chars');
        }
      }}
      className="prescription-print-container bg-white p-8 w-full max-w-4xl mx-auto"
      style={{ pageBreakAfter: 'always' }}
      id="prescription-print-main"
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

      {/* Medications Section - Grid Layout */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-stone-900 mb-4 pb-2 border-b-2 border-stone-400">
          ✓ PRESCRIBED MEDICATIONS
        </h3>
        
        {medications && medications.length > 0 ? (
          <div className="border-2 border-stone-300 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 bg-stone-800 text-white p-3 font-bold text-xs">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Medicine Name</div>
              <div className="col-span-2">Dosage</div>
              <div className="col-span-2">Frequency</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-1 text-center">Qty</div>
            </div>
            
            {/* Table Body */}
            {(() => {
              try {
                const prescriptionData = typeof prescription?.prescriptionContent === 'string'
                  ? JSON.parse(prescription.prescriptionContent)
                  : (Array.isArray(medications) ? medications : []);
                
                if (Array.isArray(prescriptionData) && prescriptionData[0]?.medicineName) {
                  return prescriptionData.map((med, index) => (
                    <div key={index}>
                      <div className={`grid grid-cols-12 gap-2 p-3 text-xs ${
                        index % 2 === 0 ? 'bg-stone-50' : 'bg-white'
                      }`}>
                        <div className="col-span-1 text-center font-bold text-stone-700">{index + 1}</div>
                        <div className="col-span-4 font-semibold text-stone-900">{med.medicineName || 'N/A'}</div>
                        <div className="col-span-2 text-stone-700">{med.dosage || '-'}</div>
                        <div className="col-span-2 text-stone-700">{med.frequency || '-'}</div>
                        <div className="col-span-2 text-stone-700">{med.duration || '-'}</div>
                        <div className="col-span-1 text-center text-stone-700">-</div>
                      </div>
                      {med.specialInstructions && (
                        <div className="px-3 py-2 bg-amber-50 border-t border-amber-200">
                          <span className="text-xs font-semibold text-amber-800">⚠️ Instructions: </span>
                          <span className="text-xs text-amber-900">{med.specialInstructions}</span>
                        </div>
                      )}
                    </div>
                  ));
                }
              } catch (e) {
                console.error('Error parsing prescription:', e);
              }
              
              // Fallback for simple text format
              return medications.map((med, index) => (
                <div key={index} className={`grid grid-cols-12 gap-2 p-3 text-xs ${
                  index % 2 === 0 ? 'bg-stone-50' : 'bg-white'
                }`}>
                  <div className="col-span-1 text-center font-bold text-stone-700">{index + 1}</div>
                  <div className="col-span-11 text-stone-700">{med}</div>
                </div>
              ));
            })()}
            
            {/* General Notes Row */}
            {(() => {
              try {
                const prescriptionData = typeof prescription?.prescriptionContent === 'string'
                  ? JSON.parse(prescription.prescriptionContent)
                  : null;
                if (prescriptionData && prescriptionData[0]?.generalPrescriptionNotes) {
                  return (
                    <div className="bg-blue-50 p-3 border-t-2 border-blue-300">
                      <span className="text-xs font-semibold text-blue-800">📝 General Instructions: </span>
                      <span className="text-xs text-blue-900">{prescriptionData[0].generalPrescriptionNotes}</span>
                    </div>
                  );
                }
              } catch (e) {}
              return null;
            })()}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-stone-600">
            <p className="text-sm">📝 No medications prescribed in this prescription.</p>
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
