import React from "react";
import clinicLogo from "../assets/dhantha-logo-new.svg";
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
        @page { margin: 15mm; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const gender = patientInfo?.gender || patientInfo?.Gender || "";
  const phone = patientInfo?.phone || patientInfo?.patientPhone || patientInfo?.phoneNumber || "";
  const doctorName =
    doctorInfo?.doctorName ||
    (doctorInfo?.firstName ? `${doctorInfo.firstName} ${doctorInfo.lastName || ""}`.trim() : "") ||
    doctorInfo?.name ||
    "Doctor";
  const regNo =
    doctorInfo?.registrationNumber ||
    doctorInfo?.licenseNumber ||
    doctorInfo?.LicenseNumber ||
    doctorInfo?.RegistrationNumber ||
    "";
  const speciality = doctorInfo?.speciality || doctorInfo?.specialtyName || "";
  const clinicName = clinicInfo?.clinicName || "Dental Clinic";
  const clinicAddress = [clinicInfo?.clinicAddress || clinicInfo?.address, clinicInfo?.clinicCity].filter(Boolean).join(", ");
  const clinicPhone = clinicInfo?.clinicPhone || clinicInfo?.phone || "";
  const clinicEmail = clinicInfo?.clinicEmail || clinicInfo?.email || "";
  const clinicReg = clinicInfo?.registrationNumber || clinicInfo?.gstNumber || "";
  const notes = prescription?.notes || prescription?.additionalNotes || "";
  const diagnosis = prescription?.diagnosis || "";
  const treatment = prescription?.treatment || "";

  return (
    <div
      ref={(node) => {
        if (ref) { if (typeof ref === 'function') ref(node); else ref.current = node; }
      }}
      className="prescription-print-container bg-white w-full max-w-2xl mx-auto"
      id="prescription-print-main"
    >
      {/* ── HEADER ── screen: dark gradient | print: white + black border */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-teal-900 text-white px-8 pt-7 pb-6 print:bg-white print:text-black print:border-b-2 print:border-black">
        <div className="flex items-start justify-between gap-6">
          {/* Left: clinic + doctor identity */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={dantaLogo}
                alt="Dentaesthetics Logo"
                className="logo-color w-14 h-14 object-cover flex-shrink-0"
                style={{
                  printColorAdjust: 'exact',
                  WebkitPrintColorAdjust: 'exact',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              />
              <div>
                <h1 className="text-2xl font-black tracking-wide print:text-black">{clinicName}</h1>
                {clinicAddress && <p className="text-teal-300 text-xs mt-0.5 print:text-black">{clinicAddress}</p>}
                {(clinicPhone || clinicEmail) && (
                  <p className="text-slate-400 text-xs mt-0.5 print:text-black">
                    {clinicPhone}{clinicEmail ? "  ·  " + clinicEmail : ""}
                  </p>
                )}
                {clinicReg && <p className="text-slate-400 text-xs mt-0.5 print:text-black">Reg: {clinicReg}</p>}
              </div>
            </div>
            {/* Doctor line */}
            <div className="border-l-2 border-teal-500 pl-3 print:border-black">
              <p className="font-black text-base print:text-black">
                Dr. {doctorName}{speciality ? ` — ${speciality}` : ""}
              </p>
              {regNo && <p className="text-indigo-300 text-xs print:text-black">Reg. No: {regNo}</p>}
            </div>
          </div>

          {/* Right: Rx badge */}
          <div className="text-right flex-shrink-0">
            <div className="inline-block border border-teal-400/40 rounded-xl px-5 py-3 print:border-black print:rounded-none">
              <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1 print:text-black">Prescription</p>
              <div className="text-white text-4xl font-black print:text-black" style={{ fontFamily: 'serif' }}>℞</div>
              <p className="text-slate-300 text-xs mt-1 print:text-black">{formatDate(prescription?.prescriptionDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PATIENT STRIP ── screen: 2-col | print: stacked */}
      <div className="grid grid-cols-2 print:grid-cols-1 border-b-2 border-slate-100 print:border-black">
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 border-r border-slate-100 print:bg-white print:border-r-0 print:border-b print:border-black">
          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 print:text-black">Patient</p>
          <p className="text-xl font-black text-slate-900 print:text-black">{fullPatientName}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 print:text-black">
            {age && <span>{age} yrs</span>}
            {gender && <span>{gender}</span>}
          </div>
        </div>
        <div className="p-5 bg-white print:py-3">
          <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-2 print:text-black">Issued By</p>
          <p className="text-sm font-bold text-slate-800 print:text-black">Dr. {doctorName}</p>
          {regNo && <p className="text-xs text-slate-500 mt-0.5 print:text-black">Reg: {regNo}</p>}
          <p className="text-xs text-slate-400 mt-1 print:text-black">{formatDate(prescription?.prescriptionDate)}</p>
        </div>
      </div>

      {/* ── DIAGNOSIS (if present) ── */}
      {diagnosis && (
        <div className="px-6 pt-5 pb-0">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 print:text-black">Diagnosis</p>
          <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 print:bg-white print:border-gray-300 print:text-black">{diagnosis}</p>
        </div>
      )}

      {/* ── MEDICATIONS TABLE ── */}
      <div className="px-6 py-5">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 print:text-black">Prescription / Medications</p>
        {medications.length > 0 ? (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm print:rounded-none print:shadow-none">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white print:bg-white print:text-black print:border-b-2 print:border-black">
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase w-8">#</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Medicine</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Dosage</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Frequency</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Duration</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                {medications.map((med, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60 print:bg-white"}>
                    <td className="px-3 py-3 text-sm font-black text-indigo-600 print:text-black">{idx + 1}</td>
                    {med.raw ? (
                      <td colSpan={5} className="px-3 py-3 text-sm text-slate-800 print:text-black">{med.raw}</td>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-sm font-semibold text-slate-900 print:text-black">{med.medicineName || med.name || "—"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700 print:text-black">{med.dosage || "—"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700 print:text-black">{med.frequency || "—"}</td>
                        <td className="px-3 py-3 text-sm text-slate-700 print:text-black">{med.duration || "—"}</td>
                        <td className="px-3 py-3 text-sm text-slate-600 print:text-black">{med.specialInstructions || med.instructions || "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic print:text-black">No medications prescribed.</p>
        )}
      </div>

      {/* ── TREATMENT / DOCTOR ADVICE ── */}
      {treatment && (
        <div className="px-6 pb-5">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 print:text-black">Treatment / Doctor Advice</p>
          <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 print:bg-white print:border-gray-300 print:text-black whitespace-pre-wrap">{treatment}</p>
        </div>
      )}

      {/* ── IMPORTANT NOTE ── */}
      <div className="mx-6 mb-5 px-4 py-3 bg-amber-50 border-l-4 border-amber-400 rounded print:bg-white print:border-black">
        <p className="text-xs font-bold text-amber-800 print:text-black">Important:</p>
        <p className="text-xs text-amber-900 mt-0.5 print:text-black">
          Follow the dosage and frequency as prescribed. If you experience any adverse effects, consult your doctor immediately.
        </p>
      </div>

      {/* ── SIGNATURE + FOOTER ── */}
      <div className="border-t-2 border-slate-100 print:border-black">
        <div className="px-6 py-4 flex justify-end">
          <div className="text-right border-t-2 border-dashed border-slate-300 pt-3 min-w-48 print:border-black">
            <p className="text-xs text-slate-400 mb-0.5 print:text-black">Electronically signed by</p>
            <p className="text-sm font-black text-slate-800 print:text-black">Dr. {doctorName}</p>
            {regNo && <p className="text-xs text-slate-500 print:text-black">(Reg No.: {regNo})</p>}
            <p className="text-xs text-slate-400 mt-0.5 print:text-black">Dentist</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-teal-900 text-white px-8 py-4 print:bg-white print:text-black print:border-t-2 print:border-black">
          <div className="flex items-center justify-between gap-4 print:flex-col print:items-start print:gap-1">
            <div className="text-xs space-y-0.5">
              {clinicAddress && <p className="text-slate-300 print:text-black">{clinicAddress}</p>}
              <p className="text-slate-400 print:text-black">
                {clinicPhone}{clinicEmail ? "  ·  " + clinicEmail : ""}
              </p>
            </div>
            <p className="text-xs text-slate-400 italic print:text-black">
              Computer generated prescription · Valid without signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PrescriptionPrint.displayName = "PrescriptionPrint";
export default PrescriptionPrint;
