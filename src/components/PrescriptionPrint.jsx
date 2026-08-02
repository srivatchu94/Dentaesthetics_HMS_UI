import React from "react";
import dantaLogo from "../assets/danta-logo.jpg";

const PrescriptionPrint = React.forwardRef(({ prescription, patientInfo, doctorInfo, clinicInfo }, ref) => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'prescription-print-styles';
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        .prescription-print-container,
        .prescription-print-container * { visibility: visible; }
        .prescription-print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
          background: white;
        }
        .prescription-print-container img.logo-color {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        .prescription-print-container *:not(img) {
          color: #000 !important;
          background-color: white !important;
          border-color: #333 !important;
          -webkit-print-color-adjust: economy;
          print-color-adjust: economy;
        }
        @page { margin: 15mm; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") {
      const now = new Date();
      return now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
             now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
           date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateAge = (dob) => {
    if (!dob || dob === "0001-01-01T00:00:00") return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
  };

  const getMedications = () => {
    if (!prescription) return [];
    const content = prescription?.prescriptionContent || prescription?.medicationsList || "";
    if (!content || content.trim() === "") return [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // not JSON — fall through
    }
    return content.split('\n').filter(line => line.trim()).map(line => ({ raw: line }));
  };

  const medications = getMedications();
  const patientFirstName = patientInfo?.firstName || patientInfo?.patientFirstName || "";
  const patientLastName = patientInfo?.lastName || patientInfo?.patientLastName || "";
  const fullPatientName = `${patientFirstName} ${patientLastName}`.trim() || patientInfo?.patientName || "Patient";
  const age = patientInfo?.dateOfBirth ? calculateAge(patientInfo.dateOfBirth) : null;
  const phone = patientInfo?.phone || patientInfo?.patientPhone || patientInfo?.phoneNumber || "";
  const invoiceNumber = prescription?.prescriptionId || "RX-001";
  
  const doctorName =
    doctorInfo?.doctorName ||
    (doctorInfo?.firstName ? `${doctorInfo.firstName} ${doctorInfo.lastName || ""}`.trim() : "") ||
    doctorInfo?.name ||
    "Swetha";
  const regNo =
    doctorInfo?.registrationNumber ||
    doctorInfo?.licenseNumber ||
    doctorInfo?.LicenseNumber ||
    doctorInfo?.RegistrationNumber ||
    "27909";
  
  const clinicName = clinicInfo?.clinicName || "Dental Clinic";
  const clinicAddress = [clinicInfo?.clinicAddress || clinicInfo?.address, clinicInfo?.clinicCity].filter(Boolean).join(", ");
  const clinicPhone = clinicInfo?.clinicPhone || clinicInfo?.phone || "";
  const clinicEmail = clinicInfo?.clinicEmail || clinicInfo?.email || "";

  return (
    <div
      ref={(node) => {
        if (ref) { if (typeof ref === 'function') ref(node); else ref.current = node; }
      }}
      className="prescription-print-container bg-white w-full max-w-3xl mx-auto text-slate-800 print:text-black"
      id="prescription-print-main"
    >
      {/* ── HEADER: LOGO (LEFT) + CLINIC NAME (CENTER) ── */}
      <div className="flex items-start justify-between px-6 pt-4 pb-2 border-b border-slate-200">
        {/* Logo on left */}
        <div className="w-16">
          <img
            src={dantaLogo}
            alt="Danta Logo"
            className="logo-color w-16 h-16 object-cover"
            style={{
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Clinic name centered */}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold text-slate-900 print:text-black">{clinicName}</h2>
        </div>

        {/* Empty space for alignment */}
        <div className="w-16"></div>
      </div>

      {/* ── PATIENT INFO SECTION ── */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 print:text-black">Patient</p>
            <p className="text-sm font-semibold text-slate-900 print:text-black">
              {fullPatientName}
              {age && <span className="text-xs text-slate-600 print:text-black"> ({age}y)</span>}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 print:text-black">Contact</p>
            <p className="text-sm text-slate-700 print:text-black">{phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 print:text-black">Visit Date & Time</p>
            <p className="text-sm text-slate-700 print:text-black">{formatDateTime(prescription?.prescriptionDate)}</p>
          </div>
        </div>
      </div>

      {/* ── INVOICE SECTION (NO doctor name here) ── */}
      <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold text-slate-800 print:text-black">
            Invoiced by: Dr. {doctorName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 print:text-black">Invoice #</p>
          <p className="text-sm font-bold text-slate-900 print:text-black">{invoiceNumber}</p>
        </div>
      </div>

      {/* ── RX SYMBOL + PRESCRIPTIONS ── */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-black text-slate-800 print:text-black" style={{ fontFamily: 'serif' }}>℞</div>
          <p className="text-sm font-bold uppercase text-slate-700 print:text-black">PRESCRIPTIONS</p>
        </div>

        {/* ── MEDICATIONS TABLE ── */}
        {medications.length > 0 ? (
          <div className="border border-slate-300 rounded overflow-hidden print:rounded-none print:border-black">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 print:bg-white print:text-black print:border-black">
                  <th className="px-3 py-2 text-left font-bold">#</th>
                  <th className="px-3 py-2 text-left font-bold">Medicine</th>
                  <th className="px-3 py-2 text-left font-bold">Dosage</th>
                  <th className="px-3 py-2 text-left font-bold">Frequency</th>
                  <th className="px-3 py-2 text-left font-bold">Duration</th>
                  <th className="px-3 py-2 text-left font-bold">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {medications.map((med, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 print:bg-white">
                    <td className="px-3 py-2 font-bold text-slate-700 print:text-black">{idx + 1}</td>
                    {med.raw ? (
                      <td colSpan={5} className="px-3 py-2 text-slate-700 print:text-black">{med.raw}</td>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-semibold text-slate-800 print:text-black">{med.medicineName || med.name || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 print:text-black">{med.dosage || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 print:text-black">{med.frequency || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 print:text-black">{med.duration || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 print:text-black">{med.specialInstructions || med.instructions || "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-4">No medications prescribed.</p>
        )}
      </div>

      {/* ── SIGNATURE SECTION (ONLY doctor name here) ── */}
      <div className="px-6 py-6 border-t border-slate-200 text-right">
        <p className="text-xs text-slate-600 print:text-black mb-2">Electronically signed by:</p>
        <div className="border-t-2 border-slate-400 pt-3 inline-block min-w-64 print:border-black">
          <p className="text-sm font-bold text-slate-800 print:text-black">Dr. {doctorName}</p>
          <p className="text-xs text-slate-600 print:text-black">ID: {regNo}</p>
        </div>
      </div>

      {/* ── FOOTER WITH ADDRESS ── */}
      <div className="border-t-2 border-slate-300 print:border-black px-6 py-3 text-center bg-slate-50 print:bg-white">
        <p className="text-xs text-slate-600 print:text-black">{clinicAddress}</p>
        {clinicPhone && <p className="text-xs text-slate-600 print:text-black">Ph: {clinicPhone}</p>}
        {clinicEmail && <p className="text-xs text-slate-600 print:text-black">{clinicEmail}</p>}
        <p className="text-xs text-slate-500 italic mt-2 print:text-black">Computer generated prescription · Valid without signature</p>
      </div>
    </div>
  );
});

PrescriptionPrint.displayName = "PrescriptionPrint";
export default PrescriptionPrint;
