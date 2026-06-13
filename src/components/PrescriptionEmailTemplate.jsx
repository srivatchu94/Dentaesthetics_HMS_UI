import React from "react";

const PrescriptionEmailTemplate = ({ prescription, patientInfo, doctorInfo, clinicInfo }) => {
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
    } catch { /* fall through */ }
    return content.split('\n').filter(l => l.trim()).map(l => ({ raw: l }));
  };

  const medications = getMedications();
  const pFirstName = patientInfo?.firstName || patientInfo?.patientFirstName || "";
  const pLastName = patientInfo?.lastName || patientInfo?.patientLastName || "";
  const fullPatientName = `${pFirstName} ${pLastName}`.trim() || patientInfo?.patientName || "Patient";
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
  const diagnosis = prescription?.diagnosis || "";
  const treatment = prescription?.treatment || "";
  const notes = prescription?.notes || "";

  const medRowsHTML = medications.map((med, idx) => {
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    if (med.raw) {
      return `<tr style="background:${bg};border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#4f46e5;width:32px;">${idx + 1}</td>
        <td colspan="5" style="padding:10px 12px;font-size:13px;color:#1e293b;">${med.raw}</td>
      </tr>`;
    }
    return `<tr style="background:${bg};border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#4f46e5;width:32px;">${idx + 1}</td>
      <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#0f172a;">${med.medicineName || med.name || "—"}</td>
      <td style="padding:10px 12px;font-size:13px;color:#334155;">${med.dosage || "—"}</td>
      <td style="padding:10px 12px;font-size:13px;color:#334155;">${med.frequency || "—"}</td>
      <td style="padding:10px 12px;font-size:13px;color:#334155;">${med.duration || "—"}</td>
      <td style="padding:10px 12px;font-size:13px;color:#64748b;">${med.specialInstructions || med.instructions || "—"}</td>
    </tr>`;
  }).join("");

  const generateEmailHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b;">
  <div style="max-width:680px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#312e81 50%,#0f766e 100%);padding:32px;color:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:22px;font-weight:900;letter-spacing:0.5px;">${clinicName}</div>
            ${clinicAddress ? `<div style="font-size:11px;color:#5eead4;margin-top:3px;">${clinicAddress}</div>` : ""}
            ${clinicPhone || clinicEmail ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${clinicPhone}${clinicEmail ? "  ·  " + clinicEmail : ""}</div>` : ""}
            ${clinicReg ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Reg: ${clinicReg}</div>` : ""}
            <div style="margin-top:12px;border-left:2px solid #14b8a6;padding-left:10px;">
              <div style="font-weight:700;font-size:14px;">Dr. ${doctorName}${speciality ? ` &mdash; ${speciality}` : ""}</div>
              ${regNo ? `<div style="font-size:11px;color:#a5b4fc;">Reg. No: ${regNo}</div>` : ""}
            </div>
          </td>
          <td style="text-align:right;vertical-align:top;min-width:110px;">
            <div style="border:1px solid rgba(45,212,191,0.4);border-radius:10px;padding:12px 16px;display:inline-block;">
              <div style="font-size:10px;color:#5eead4;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Prescription</div>
              <div style="font-size:36px;font-weight:900;font-family:Georgia,serif;line-height:1;">&#8478;</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${formatDate(prescription?.prescriptionDate)}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Patient strip -->
    <div style="background:#f0f4ff;padding:20px 32px;border-bottom:2px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:16px;border-right:1px solid #c7d2fe;vertical-align:top;">
            <div style="font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Patient</div>
            <div style="font-size:18px;font-weight:900;color:#0f172a;">${fullPatientName}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px;">
              ${age ? age + " yrs" : ""}${age && gender ? " · " : ""}${gender}${phone ? " · " + phone : ""}
            </div>
          </td>
          <td style="padding-left:16px;vertical-align:top;">
            <div style="font-size:10px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Issued By</div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;">Dr. ${doctorName}</div>
            ${regNo ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">Reg: ${regNo}</div>` : ""}
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${formatDate(prescription?.prescriptionDate)}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Diagnosis -->
    ${diagnosis ? `
    <div style="padding:20px 32px 0;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Diagnosis</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:13px;color:#1e293b;">${diagnosis}</div>
    </div>` : ""}

    <!-- Medications table -->
    <div style="padding:20px 32px;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Prescription / Medications</div>
      ${medications.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:collapse;">
        <thead>
          <tr style="background:linear-gradient(90deg,#4f46e5,#0d9488);color:#ffffff;">
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;width:32px;">#</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;">Medicine</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;">Dosage</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;">Frequency</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;">Duration</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;">Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medRowsHTML}
        </tbody>
      </table>` : `<p style="font-size:13px;color:#94a3b8;font-style:italic;">No medications prescribed.</p>`}
    </div>

    <!-- Treatment / Doctor advice -->
    ${treatment ? `
    <div style="padding:0 32px 20px;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Treatment / Doctor Advice</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:13px;color:#1e293b;white-space:pre-wrap;">${treatment}</div>
    </div>` : ""}

    <!-- Important note -->
    <div style="margin:0 32px 20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 16px;">
      <div style="font-size:11px;font-weight:700;color:#92400e;">Important:</div>
      <div style="font-size:11px;color:#78350f;margin-top:4px;">Follow the dosage and frequency as prescribed. If you experience any adverse effects, consult your doctor immediately.</div>
    </div>

    <!-- Signature -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;text-align:right;">
      <div style="display:inline-block;border-top:2px dashed #94a3b8;padding-top:10px;text-align:right;">
        <div style="font-size:11px;color:#94a3b8;">Electronically signed by</div>
        <div style="font-size:14px;font-weight:900;color:#0f172a;">Dr. ${doctorName}</div>
        ${regNo ? `<div style="font-size:11px;color:#64748b;">(Reg No.: ${regNo})</div>` : ""}
        <div style="font-size:11px;color:#94a3b8;">Dentist</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:16px 32px;color:#94a3b8;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:11px;">
            ${clinicAddress ? `<div>${clinicAddress}</div>` : ""}
            <div>${clinicPhone}${clinicEmail ? "  ·  " + clinicEmail : ""}</div>
          </td>
          <td style="text-align:right;font-size:11px;font-style:italic;">Computer generated prescription</td>
        </tr>
      </table>
    </div>

  </div>
</body>
</html>`;

  return {
    getHTML: generateEmailHTML
  };
};

export default PrescriptionEmailTemplate;
