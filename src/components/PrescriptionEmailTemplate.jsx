import React from "react";

const PrescriptionEmailTemplate = ({ prescription, patientInfo, doctorInfo, clinicInfo }) => {
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
    } catch { /* fall through */ }
    return content.split('\n').filter(l => l.trim()).map(l => ({ raw: l }));
  };

  const medications = getMedications();
  const pFirstName = patientInfo?.firstName || patientInfo?.patientFirstName || "";
  const pLastName = patientInfo?.lastName || patientInfo?.patientLastName || "";
  const fullPatientName = `${pFirstName} ${pLastName}`.trim() || patientInfo?.patientName || "Patient";
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

  const medRowsHTML = medications.map((med, idx) => {
    if (med.raw) {
      return `<tr style="border-bottom:1px solid #d1d5db;">
        <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#374151;">${idx + 1}</td>
        <td colspan="5" style="padding:8px 10px;font-size:12px;color:#1f2937;">${med.raw}</td>
      </tr>`;
    }
    return `<tr style="border-bottom:1px solid #d1d5db;">
      <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#374151;">${idx + 1}</td>
      <td style="padding:8px 10px;font-size:12px;font-weight:600;color:#1f2937;">${med.medicineName || med.name || "—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:#374151;">${med.dosage || "—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:#374151;">${med.frequency || "—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:#374151;">${med.duration || "—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:#4b5563;">${med.specialInstructions || med.instructions || "—"}</td>
    </tr>`;
  }).join("");

  const generateEmailHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937;">
  <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- CENTERED LOGO -->
    <div style="text-align:center;padding:24px 0 8px;">
      <img src="cid:logo" alt="Danta" style="width:60px;height:60px;border-radius:8px;" />
    </div>

    <!-- DOCTOR INFO HEADER -->
    <div style="text-align:center;padding:0 24px 16px;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:18px;font-weight:700;color:#1f2937;">${clinicName}</div>
      <div style="font-size:12px;color:#6b7280;">Dr. ${doctorName}</div>
      <div style="font-size:11px;color:#6b7280;font-weight:600;">REG NO: ${regNo}</div>
    </div>

    <!-- PATIENT INFO SECTION -->
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33.33%;vertical-align:top;padding-right:12px;">
            <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Patient</div>
            <div style="font-size:13px;font-weight:600;color:#1f2937;">
              ${fullPatientName}${age ? ` (${age}y)` : ""}
            </div>
          </td>
          <td style="width:33.33%;vertical-align:top;padding-right:12px;">
            <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Contact</div>
            <div style="font-size:12px;color:#374151;">${phone || "N/A"}</div>
          </td>
          <td style="width:33.33%;vertical-align:top;">
            <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Visit Date & Time</div>
            <div style="font-size:12px;color:#374151;">${formatDateTime(prescription?.prescriptionDate)}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- INVOICE SECTION -->
    <div style="padding:12px 24px;border-bottom:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:12px;font-weight:600;color:#1f2937;">
              Invoiced by: Dr. ${doctorName}
            </div>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <div style="font-size:10px;color:#6b7280;">Invoice #</div>
            <div style="font-size:13px;font-weight:700;color:#1f2937;">${invoiceNumber}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- RX SYMBOL + PRESCRIPTIONS -->
    <div style="padding:16px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td style="width:40px;vertical-align:middle;">
            <div style="font-size:28px;font-weight:900;font-family:Georgia,serif;color:#1f2937;">&#8478;</div>
          </td>
          <td style="vertical-align:middle;padding-left:8px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;letter-spacing:1px;">Prescriptions</div>
          </td>
        </tr>
      </table>

      ${medications.length > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1d5db;border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f4f6;border-bottom:1px solid #d1d5db;">
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;width:28px;">#</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;">Medicine</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;">Dosage</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;">Frequency</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;">Duration</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#374151;">Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medRowsHTML}
        </tbody>
      </table>` : `<p style="font-size:12px;color:#9ca3af;font-style:italic;">No medications prescribed.</p>`}
    </div>

    <!-- SIGNATURE SECTION -->
    <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:right;">
      <div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Electronically signed by:</div>
      <div style="display:inline-block;border-top:2px solid #9ca3af;padding-top:8px;text-align:right;">
        <div style="font-size:12px;font-weight:700;color:#1f2937;">Dr. ${doctorName}</div>
        <div style="font-size:10px;color:#6b7280;">ID: ${regNo}</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f9fafb;padding:12px 24px;border-top:1px solid #e5e7eb;">
      <div style="text-align:center;">
        <div style="font-size:11px;color:#6b7280;">
          ${clinicAddress ? `${clinicAddress}` : ""}<br/>
          ${clinicPhone ? `Ph: ${clinicPhone}` : ""}
          ${clinicPhone && clinicEmail ? `<br/>` : ""}
          ${clinicEmail ? `${clinicEmail}` : ""}
        </div>
        <div style="font-size:10px;color:#9ca3af;font-style:italic;margin-top:8px;">Computer generated prescription · Valid without signature</div>
      </div>
    </div>

  </div>
</body>
</html>`;

  return {
    getHTML: generateEmailHTML
  };
};

export default PrescriptionEmailTemplate;
