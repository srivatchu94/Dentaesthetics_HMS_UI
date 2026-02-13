import React from "react";

/**
 * 📧 Prescription Email Template Component
 * Generates HTML template for sending prescriptions via email
 * Used for sending prescription emails to patients
 */
const PrescriptionEmailTemplate = ({ prescription, patientInfo, doctorInfo, clinicInfo }) => {
  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
          .email-content { background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          
          /* Header */
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px 20px; text-align: center; }
          .clinic-name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .clinic-details { font-size: 13px; opacity: 0.9; }
          .clinic-details p { margin: 5px 0; }
          
          /* Title */
          .title-section { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 15px; text-align: center; border-bottom: 3px solid #1e293b; }
          .title-section h2 { color: #1e293b; font-size: 24px; }
          
          /* Info Grid */
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; border-bottom: 1px solid #e5e7eb; }
          .info-box h3 { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }
          .info-box p { font-size: 14px; color: #1e293b; margin: 4px 0; }
          .info-box .label { color: #64748b; font-size: 12px; }
          
          /* Patient Section */
          .patient-section { padding: 20px; background-color: #f8fafc; border-bottom: 1px solid #e5e7eb; }
          .patient-section h3 { color: #0f172a; font-size: 16px; margin-bottom: 12px; border-left: 4px solid #06b6d4; padding-left: 12px; }
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .patient-item { }
          .patient-item label { display: block; color: #475569; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
          .patient-item span { display: block; color: #1e293b; font-size: 14px; }
          
          /* Medications Section */
          .medications-section { padding: 20px; }
          .medications-section h3 { color: #0f172a; font-size: 16px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 12px; }
          .medication-list { list-style: none; }
          .medication-item { 
            background-color: #f0fdf4; 
            border-left: 4px solid #10b981; 
            padding: 12px; 
            margin-bottom: 10px; 
            border-radius: 4px;
            font-size: 14px;
            color: #1e293b;
            line-height: 1.5;
          }
          
          /* Doctor Section */
          .doctor-section { padding: 20px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
          .doctor-section h3 { color: #0f172a; font-size: 16px; margin-bottom: 12px; border-left: 4px solid #8b5cf6; padding-left: 12px; }
          .doctor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .doctor-item label { display: block; color: #475569; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
          .doctor-item span { display: block; color: #1e293b; font-size: 14px; }
          
          /* Footer */
          .footer { padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb; }
          .footer p { font-size: 12px; color: #64748b; margin: 5px 0; }
          .footer .important { color: #dc2626; font-weight: 600; margin-top: 10px; }
          .footer .contact { color: #0f172a; font-weight: 600; margin-top: 10px; }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            .info-section, .patient-grid, .doctor-grid { grid-template-columns: 1fr; }
            .clinic-name { font-size: 22px; }
            .title-section h2 { font-size: 20px; }
          }
          
          /* Print Styles */
          @media print {
            body { background-color: white; }
            .container { padding: 0; }
            .email-content { box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-content">
            <!-- Header -->
            <div class="header">
              <div class="clinic-name">
                ${clinicInfo?.clinicName || "Dentaesthetics Dental Clinic"}
              </div>
              <div class="clinic-details">
                <p>${clinicInfo?.address || "Clinic Address"}</p>
                <p>📞 ${clinicInfo?.phone || "Phone Number"} | 📧 ${clinicInfo?.email || "clinic@example.com"}</p>
              </div>
            </div>
            
            <!-- Title -->
            <div class="title-section">
              <h2>💊 MEDICAL PRESCRIPTION</h2>
            </div>
            
            <!-- Date & Prescription ID -->
            <div class="info-section">
              <div class="info-box">
                <h3>Prescription Date</h3>
                <p>${formatDate(prescription?.prescriptionDate || new Date().toISOString())}</p>
              </div>
              <div class="info-box">
                <h3>Prescription ID</h3>
                <p>${prescription?.prescriptionId || "N/A"}</p>
              </div>
            </div>
            
            <!-- Patient Information -->
            <div class="patient-section">
              <h3>👤 Patient Information</h3>
              <div class="patient-grid">
                <div class="patient-item">
                  <label>Patient Name</label>
                  <span>${patientInfo?.patientFirstName || patientInfo?.firstName || "N/A"} ${patientInfo?.patientLastName || patientInfo?.lastName || ""}</span>
                </div>
                <div class="patient-item">
                  <label>Patient ID</label>
                  <span>${patientInfo?.patientId || "N/A"}</span>
                </div>
                <div class="patient-item">
                  <label>Phone Number</label>
                  <span>${patientInfo?.patientPhone || patientInfo?.phone || "N/A"}</span>
                </div>
                <div class="patient-item">
                  <label>Email Address</label>
                  <span>${patientInfo?.patientEmail || patientInfo?.email || "N/A"}</span>
                </div>
              </div>
            </div>
            
            <!-- Medications -->
            <div class="medications-section">
              <h3>💊 Medications</h3>
              ${medications.length > 0 ? `
                <ul class="medication-list">
                  ${medications.map((med, idx) => `
                    <li class="medication-item">
                      ${idx + 1}. ${med}
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p style="color: #64748b; font-size: 14px;">No medications prescribed.</p>
              `}
            </div>
            
            <!-- Doctor Information -->
            <div class="doctor-section">
              <h3>👨‍⚕️ Prescribed By</h3>
              <div class="doctor-grid">
                <div class="doctor-item">
                  <label>Doctor Name</label>
                  <span>Dr. ${doctorInfo?.doctorName || doctorInfo?.doctor_name || doctorInfo?.firstName || "Not Specified"}</span>
                </div>
                <div class="doctor-item">
                  <label>Doctor ID</label>
                  <span>${doctorInfo?.doctorId || doctorInfo?.doctor_id || doctorInfo?.id || "N/A"}</span>
                </div>
                <div class="doctor-item">
                  <label>Specialization</label>
                  <span>${doctorInfo?.specialization || doctorInfo?.specialty || "General Dentistry"}</span>
                </div>
                <div class="doctor-item">
                  <label>Registration Number</label>
                  <span>${doctorInfo?.registrationNumber || doctorInfo?.registration_number || doctorInfo?.licenseNumber || "N/A"}</span>
                </div>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <div class="doctor-item">
                  <label>Clinic Name</label>
                  <span>${doctorInfo?.clinicName || clinicInfo?.clinicName || "Not Specified"}</span>
                </div>
                <div class="doctor-item" style="margin-top: 10px;">
                  <label>Clinic Address</label>
                  <span>${clinicInfo?.address || doctorInfo?.clinicAddress || "Address available at clinic"}</span>
                </div>
                <div class="doctor-item" style="margin-top: 10px;">
                  <label>Clinic Contact</label>
                  <span>${clinicInfo?.phone || doctorInfo?.clinicPhone || "Contact available at clinic"}</span>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="important">⚠️ IMPORTANT: Follow the dosage and frequency as prescribed.</p>
              <p>Take medications as directed by your healthcare provider. If you experience any adverse effects, please consult your doctor immediately.</p>
              <div class="contact">
                <p>For any queries regarding your prescription, please contact:</p>
                <p>${clinicInfo?.clinicName || "Clinic"}</p>
                <p>📞 ${clinicInfo?.phone || "Phone"}</p>
              </div>
              <p style="margin-top: 20px; color: #94a3b8; font-size: 11px;">
                This is an electronically generated prescription. Please ensure proper verification before use.
              </p>
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
