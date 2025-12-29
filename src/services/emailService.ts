import { request } from './apiClient';

const EMAIL_BASE_URL = '/Email';

export interface EmailRequest {
  Email: string;
  Subject: string;
  HtmlBody: string;
}

/**
 * Send email via backend email service
 * Backend handles SMTP configuration and actual email delivery
 */
export const sendEmail = async (emailData: EmailRequest): Promise<{ success: boolean; message: string }> => {
  try {
    if (!emailData.Email || !emailData.Email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!emailData.Subject) {
      throw new Error('Subject is required');
    }

    if (!emailData.HtmlBody) {
      throw new Error('Email content is required');
    }

    const payload = {
      Email: emailData.Email,
      Subject: emailData.Subject,
      HtmlBody: emailData.HtmlBody
    };

    console.log('📧 Sending email via backend:', {
      Email: emailData.Email,
      Subject: emailData.Subject,
      contentLength: emailData.HtmlBody?.length
    });

    const response = await request<{ success: boolean; message: string }>(`${EMAIL_BASE_URL}/sendemail`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Send prescription email to patient with professional formatting
 */
export const sendPrescriptionEmail = async (
  patientEmail: string,
  patientName: string,
  doctorName: string,
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; instructions?: string }>,
  clinicName?: string,
  doctorId?: string | number
): Promise<{ success: boolean; message: string }> => {
  try {
    const medicationsList = medications
      .map((med, idx) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: center; font-weight: bold; background-color: #f9fafb;">${idx + 1}</td>
          <td style="padding: 12px; font-weight: 600; color: #1f2937;">${med.name}</td>
          <td style="padding: 12px; text-align: center; color: #374151;">${med.dosage}</td>
          <td style="padding: 12px; text-align: center; color: #374151;">${med.frequency}</td>
          <td style="padding: 12px; text-align: center; color: #374151;">${med.duration}</td>
          ${med.instructions ? `<td style="padding: 12px; background-color: #fef3c7; color: #78350f; font-size: 13px;"><strong>Note:</strong> ${med.instructions}</td>` : '<td style="padding: 12px;">-</td>'}
        </tr>
      `)
      .join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Arial', sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 700px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    
    /* Header Section */
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .clinic-name { font-size: 24px; font-weight: 700; margin-bottom: 10px; letter-spacing: 0.5px; }
    .header-separator { height: 3px; background: rgba(255,255,255,0.3); margin: 20px 0; }
    
    /* Doctor & Patient Info */
    .info-section { background: linear-gradient(to right, #f8fafc, #f1f5f9); padding: 25px 40px; border-bottom: 2px solid #e5e7eb; }
    .info-row { margin-bottom: 15px; }
    .info-row:last-child { margin-bottom: 0; }
    .greeting { font-size: 16px; color: #1f2937; }
    .greeting strong { color: #667eea; font-weight: 600; }
    .doctor-info { font-size: 13px; color: #6b7280; margin-top: 8px; line-height: 1.5; }
    .doctor-info .label { font-weight: 600; color: #374151; }
    
    /* Content Section */
    .content { padding: 40px; }
    .section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 3px solid #667eea; display: inline-block; }
    
    /* Medications Table */
    .medications-section { margin: 30px 0; }
    .medications-table { width: 100%; border-collapse: collapse; margin-top: 15px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .medications-table thead { background: linear-gradient(to right, #667eea, #764ba2); color: white; }
    .medications-table th { padding: 14px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .medications-table td { padding: 12px 14px; }
    .medications-table tbody tr:nth-child(even) { background-color: #f9fafb; }
    .medications-table tbody tr:hover { background-color: #f3f4f6; }
    
    /* Instructions */
    .instructions { background: linear-gradient(to right, #fef3c7, #fde68a); padding: 20px; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 25px 0; }
    .instructions h4 { color: #92400e; font-size: 14px; font-weight: 700; margin-bottom: 10px; }
    .instructions ul { margin-left: 20px; }
    .instructions li { margin: 8px 0; font-size: 14px; color: #78350f; line-height: 1.5; }
    
    /* Footer */
    .footer { background: #f9fafb; padding: 25px 40px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer-text { font-size: 12px; color: #6b7280; line-height: 1.6; margin-bottom: 10px; }
    .footer-link { color: #667eea; text-decoration: none; font-weight: 600; }
    .footer-link:hover { text-decoration: underline; }
    .timestamp { font-size: 11px; color: #9ca3af; margin-top: 15px; }
    
    /* Professional styling */
    .highlight { background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Clinic Name -->
    <div class="header">
      <div class="clinic-name">${clinicName || 'Dental Aesthetics Clinic'}</div>
      <div class="header-separator"></div>
      <div style="font-size: 20px; font-weight: 600; letter-spacing: 0.3px;">💊 Medical Prescription</div>
    </div>

    <!-- Patient & Doctor Information -->
    <div class="info-section">
      <div class="info-row greeting">
        Dear <strong>${patientName}</strong>,
      </div>
      <div class="doctor-info">
        <div class="label">👨‍⚕️ Prescribed By:</div>
        <div style="margin-top: 4px;">Dr. ${doctorName}${doctorId ? ` (ID: ${doctorId})` : ''}</div>
      </div>
      <div class="doctor-info" style="margin-top: 12px;">
        <div class="label">📅 Date Issued:</div>
        <div style="margin-top: 4px;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Medications Section -->
      <div class="medications-section">
        <h2 class="section-title">📋 Prescribed Medications</h2>
        <table class="medications-table">
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 30%;">Medication Name</th>
              <th style="width: 20%;">Dosage</th>
              <th style="width: 20%;">Frequency</th>
              <th style="width: 15%;">Duration</th>
              <th>Special Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${medicationsList}
          </tbody>
        </table>
      </div>

      <!-- Important Instructions -->
      <div class="instructions">
        <h4>⚠️ Important Instructions for Your Safety</h4>
        <ul>
          <li><strong>Follow Exactly:</strong> Take medications exactly as prescribed by your doctor. Do not alter dosages without consultation.</li>
          <li><strong>Set Reminders:</strong> Use phone alarms or medication apps to ensure you don't miss doses.</li>
          <li><strong>Side Effects:</strong> If you experience any adverse effects or allergic reactions, stop immediately and contact your doctor.</li>
          <li><strong>Storage:</strong> Keep medications in a cool, dry place away from direct sunlight and moisture.</li>
          <li><strong>Do Not Share:</strong> Never share your medications with others, even if they have similar symptoms.</li>
          <li><strong>Food Interactions:</strong> Check with your pharmacist about potential food or alcohol interactions.</li>
          <li><strong>Emergency:</strong> In case of emergency or severe reactions, contact emergency services or your nearest hospital.</li>
        </ul>
      </div>

      <!-- Additional Information -->
      <div class="highlight">
        <p><strong>Next Steps:</strong></p>
        <p>1. Show this prescription to your pharmacist to get your medications</p>
        <p>2. If you have any questions, feel free to contact our clinic</p>
        <p>3. Follow up with your doctor as recommended</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        <strong style="color: #1f2937;">Dr. ${doctorName}</strong><br>
        ${doctorId ? `Medical License: ${doctorId}<br>` : ''}
        ${clinicName || 'Dental Aesthetics Clinic'}
      </p>
      <p class="footer-text">
        This is a confidential medical document. If you received this email in error, please delete it immediately and notify us.
      </p>
      <p class="footer-text">
        <a href="mailto:support@dentalaesthetics.com" class="footer-link">📧 Contact Support</a> | 
        <a href="#" class="footer-link">Privacy Policy</a>
      </p>
      <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail({
      Email: patientEmail,
      Subject: `Prescription from Dr. ${doctorName} - ${clinicName || 'Dental Aesthetics Clinic'}`,
      HtmlBody: htmlBody
    });
  } catch (error) {
    console.error('❌ Error sending prescription email:', error);
    throw error;
  }
};

/**
 * Send patient profile email with all patient details
 */
export const sendPatientProfileEmail = async (
  patientEmail: string,
  patientName: string,
  clinicName: string,
  patientDetails: Record<string, any>
): Promise<{ success: boolean; message: string }> => {
  try {
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
    .container { background-color: #ffffff; max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(to right, #10b981, #14b8a6); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .profile-section { background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
    .profile-section h3 { margin: 0 0 10px 0; color: #065f46; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #047857; }
    .detail-value { color: #333; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👤 Your Patient Profile</h1>
      <p>${clinicName}</p>
    </div>

    <p style="font-size: 16px;">Dear <strong>${patientName}</strong>,</p>

    <p>Your patient profile has been created and is now active in our system. Below is a summary of your registered information:</p>

    <div class="profile-section">
      <h3>📋 Personal Information</h3>
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${patientName}</span>
      </div>
      ${patientDetails.dateOfBirth ? `<div class="detail-row"><span class="detail-label">Date of Birth:</span><span class="detail-value">${new Date(patientDetails.dateOfBirth).toLocaleDateString()}</span></div>` : ''}
      ${patientDetails.gender ? `<div class="detail-row"><span class="detail-label">Gender:</span><span class="detail-value">${patientDetails.gender}</span></div>` : ''}
      ${patientDetails.phone ? `<div class="detail-row"><span class="detail-label">Phone:</span><span class="detail-value">${patientDetails.phone}</span></div>` : ''}
      ${patientDetails.email ? `<div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">${patientDetails.email}</span></div>` : ''}
    </div>

    ${patientDetails.bloodType ? `<div class="profile-section"><h3>🩸 Medical Information</h3><div class="detail-row"><span class="detail-label">Blood Type:</span><span class="detail-value">${patientDetails.bloodType}</span></div></div>` : ''}

    <p>If any of the above information is incorrect, please contact us immediately to update your records.</p>

    <div class="footer">
      <p><strong>${clinicName}</strong></p>
      <p>This is an automated email. Please do not reply to this address.</p>
      <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail({
      Email: patientEmail,
      Subject: `Your Patient Profile - ${clinicName}`,
      HtmlBody: htmlBody
    });
  } catch (error) {
    console.error('❌ Error sending patient profile email:', error);
    throw error;
  }
};

export default {
  sendEmail,
  sendPrescriptionEmail,
  sendPatientProfileEmail
};
