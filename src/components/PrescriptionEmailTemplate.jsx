import React from "react";

/**
 * 📧 Prescription Email Template Component
 * Generates HTML template for sending prescriptions via email
 * Used for sending prescription emails to patients
 */
const PrescriptionEmailTemplate = ({ prescription, patientInfo, doctorInfo, clinicInfo }) => {
  console.log('📧 EMAIL TEMPLATE RECEIVED DATA:');
  console.log('  patientInfo:', patientInfo);
  console.log('  doctorInfo:', doctorInfo);
  console.log('  clinicInfo:', clinicInfo);
  
  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A";
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

  const getMedications = () => {
    if (!prescription) return [];
    const content = prescription?.prescriptionContent || prescription?.medicationsList || "";
    if (!content || content.trim() === "") return [];
    return content.split('\n').filter(line => line.trim());
  };

  const medications = getMedications();

  // Generate HTML string for email
  const generateEmailHTML = () => {
    const getClinicName = () => clinicInfo?.clinicName || "Dental Clinic";
    const getClinicPhone = () => clinicInfo?.phone || "Contact clinic for information";
    const getClinicEmail = () => clinicInfo?.email || "clinic@example.com";

    const getPatientName = () => {
      const firstName = patientInfo?.patientFirstName || patientInfo?.firstName || "";
      const lastName = patientInfo?.patientLastName || patientInfo?.lastName || "";
      return `${firstName} ${lastName}`.trim() || "Patient";
    };

    const getDoctorName = () => doctorInfo?.doctorName || "Doctor";
    const getDoctorRegistration = () => doctorInfo?.registrationNumber || "N/A";
    const getPatientAge = () => patientInfo?.dateOfBirth ? calculateAge(patientInfo.dateOfBirth) : "-";

    const patientName = getPatientName();
    const doctorName = getDoctorName();
    const patientAge = getPatientAge();
    const clinicName = getClinicName();
    const clinicPhone = getClinicPhone();
    const clinicEmail = getClinicEmail();
    const doctorRegistration = getDoctorRegistration();

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
          .container { max-width: 700px; margin: 0 auto; background: white; padding: 30px; }
          
          /* RX Header */
          .rx-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 15px;
          }
          .rx-label { 
            font-size: 48px; 
            font-weight: bold; 
            color: #1a1a1a;
            letter-spacing: 3px;
          }
          .clinic-header {
            text-align: center;
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
          }
          
          /* Patient and Doctor Info Panel */
          .info-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
          }
          
          .info-section {
            padding: 15px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #333;
          }
          
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #666;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          
          .info-value {
            font-size: 16px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .info-sub {
            font-size: 13px;
            color: #555;
          }
          
          /* Medications Section */
          .meds-header {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1a1a1a;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1a1a1a;
            letter-spacing: 1px;
          }
          
          .medication-list {
            list-style: none;
          }
          
          .medication-item {
            background: #fafafa;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-left: 3px solid #333;
            font-size: 14px;
            line-height: 1.5;
          }
          
          /* Footer */
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            text-align: center;
            color: #666;
          }
          
          .footer-clinic {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .footer-contact {
            font-size: 12px;
            color: #666;
          }
          
          .important-note {
            background: #fff3cd;
            border-left: 4px solid #ff9800;
            padding: 12px;
            margin-top: 20px;
            font-size: 12px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Clinic Header -->
          <div style="text-align: center; margin-bottom: 25px; font-size: 20px; font-weight: bold; color: #1a1a1a; border-bottom: 2px solid #ddd; padding-bottom: 15px;">
            ${clinicName}
          </div>
          
          <!-- Patient and Doctor Info Panel -->
          <div class="info-panel">
            <!-- Patient Info -->
            <div class="info-section">
              <div class="info-label">👤 Patient Name</div>
              <div class="info-value">${patientName}</div>
              <div class="info-label">📅 Age</div>
              <div class="info-sub">${patientAge} years</div>
            </div>
            
            <!-- Doctor Info -->
            <div class="info-section">
              <div class="info-label">👨‍⚕️ Doctor Name</div>
              <div class="info-value">Dr. ${doctorName}</div>
              <div class="info-label">📋 Registration Number</div>
              <div class="info-sub">${doctorRegistration}</div>
            </div>
          </div>
          
          <!-- RX Header - Before Medications -->
          <div class="rx-header" style="margin-top: 30px; margin-bottom: 20px;">
            <div class="rx-label">℞</div>
          </div>
          
          <!-- Medications -->
          <div class="meds-header">Prescription</div>
          ${medications.length > 0 ? `
            <ul class="medication-list">
              ${medications.map((med, idx) => `
                <li class="medication-item">${med}</li>
              `).join('')}
            </ul>
          ` : `
            <p style="color: #999; font-size: 14px;">No medications prescribed.</p>
          `}
          
          <!-- Important Note -->
          <div class="important-note">
            ⚠️ Please follow the dosage and frequency as prescribed. If you experience any adverse effects, consult your doctor immediately.
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-clinic">${clinicName}</div>
            <div class="footer-contact">📞 ${clinicPhone} | 📧 ${clinicEmail}</div>
            <div style="margin-top: 15px; font-size: 11px; color: #999;">
              This is an electronically generated prescription.
            </div>
          </div>
        </div>
      </body>
    </html>
    `;
  };

  return {
    getHTML: generateEmailHTML,
    getMedications,
    patientInfo,
    doctorInfo,
    clinicInfo,
    prescription
  };
};

export default PrescriptionEmailTemplate;
