import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function PatientVisitReminderEmail({ patientName, patientEmail, clinicName, clinicEmail, appointmentDate, daysRemaining = 0 }) {
  const [showPreview, setShowPreview] = useState(false);

  // Calculate day of week and formatted dates
  const appointmentDateObj = new Date(appointmentDate);
  const today = new Date();
  
  const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = appointmentDateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const actualDaysRemaining = Math.ceil((appointmentDateObj - today) / (1000 * 60 * 60 * 24));
  const displayDays = daysRemaining > 0 ? daysRemaining : actualDaysRemaining;

  // Generate email HTML content
  const generateEmailHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .header-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 25px;
      line-height: 1.6;
    }
    .reminder-box {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-left: 5px solid #667eea;
      padding: 25px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .reminder-label {
      font-size: 12px;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .appointment-info {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-top: 15px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e5e5;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666;
    }
    .info-value {
      color: #333;
      font-weight: 500;
    }
    .days-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin: 20px 0;
    }
    .action-buttons {
      text-align: center;
      margin: 35px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      margin: 10px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
    }
    .btn-secondary:hover {
      background: #e5e5e5;
    }
    .tips-section {
      background: #fff3cd;
      border-left: 5px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .tips-title {
      font-weight: 700;
      color: #856404;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .tips-list li {
      padding: 8px 0;
      color: #664d03;
      font-size: 13px;
      line-height: 1.5;
    }
    .tips-list li:before {
      content: "✓ ";
      color: #28a745;
      font-weight: 700;
      margin-right: 8px;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px 30px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      margin: 8px 0;
      line-height: 1.6;
    }
    .clinic-footer {
      font-weight: 600;
      color: #333;
      margin-top: 15px;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 25px 0;
    }
    .urgency-high {
      background: #ffe5e5;
      border-left-color: #dc3545;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 13px;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📅 Appointment Reminder</h1>
      <p class="header-subtitle">Your dental visit is coming up soon!</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>We hope you're doing well! This is a friendly reminder about your upcoming appointment with us.</p>
      </div>

      <!-- Main Reminder Box -->
      <div class="reminder-box">
        <div class="reminder-label">📌 Your Appointment</div>
        
        <div class="appointment-info">
          <div class="info-row">
            <span class="info-label">📅 Date</span>
            <span class="info-value">${dayOfWeek}, ${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">🏥 Clinic</span>
            <span class="info-value">${clinicName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">⏰ Time</span>
            <span class="info-value">As per scheduled time</span>
          </div>
        </div>

        <!-- Days Remaining -->
        <div style="text-align: center; margin-top: 20px;">
          ${displayDays <= 7 ? '<div class="urgency-high">⚠️ Your appointment is in ' + displayDays + ' day' + (displayDays !== 1 ? 's' : '') + '. Please confirm your attendance.</div>' : ''}
          <div class="days-badge">
            ${displayDays} day${displayDays !== 1 ? 's' : ''} remaining
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <a href="mailto:${clinicEmail}" class="btn btn-primary">✓ Confirm Appointment</a>
        <a href="tel:+91" class="btn btn-secondary">📞 Call Clinic</a>
      </div>

      <!-- Important Tips -->
      <div class="tips-section">
        <div class="tips-title">💡 Preparation Tips</div>
        <ul class="tips-list">
          <li>Brush and floss your teeth before the appointment</li>
          <li>Arrive 10-15 minutes early for check-in</li>
          <li>Bring any insurance documents or ID</li>
          <li>List any current medications you're taking</li>
          <li>Mention any dental concerns or pain areas</li>
        </ul>
      </div>

      <!-- Cancellation Notice -->
      <div class="divider"></div>
      <p style="font-size: 13px; color: #666; margin: 20px 0;">
        <strong>Need to reschedule?</strong> If you need to change your appointment, please contact us at least 24 hours in advance. 
        We appreciate your consideration.
      </p>

      <!-- Footer -->
      <div class="divider"></div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        <strong>Best regards,</strong><br>
        <strong class="clinic-footer">${clinicName} Team</strong>
      </p>
      
      <p class="footer-text">
        📧 <a href="mailto:${clinicEmail}" class="footer-link">${clinicEmail}</a><br>
        🌐 <span style="color: #333;">Visit us for more information</span>
      </p>

      <p class="footer-text" style="margin-top: 20px; font-size: 11px; color: #999;">
        This is an automated reminder. Please do not reply directly to this email.<br>
        For questions or concerns, please contact our clinic directly.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Copy email HTML to clipboard
  const copyToClipboard = () => {
    const html = generateEmailHTML();
    navigator.clipboard.writeText(html);
    alert('Email template copied to clipboard!');
  };

  // Download email as HTML
  const downloadEmail = () => {
    const html = generateEmailHTML();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));
    element.setAttribute('download', `appointment_reminder_${patientName}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-4xl">📧</span>
            Patient Visit Reminder Email
          </h1>
          <p className="text-blue-100">Professional appointment reminder template for your patients</p>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500"
        >
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Patient Name</p>
          <p className="text-lg font-bold text-gray-900">{patientName || 'John Doe'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500"
        >
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Appointment Date</p>
          <p className="text-lg font-bold text-gray-900">{appointmentDate || 'TBD'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md p-4 border-l-4 border-orange-500"
        >
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Days Remaining</p>
          <p className={`text-lg font-bold ${displayDays <= 7 ? 'text-red-600' : 'text-green-600'}`}>
            {displayDays} days
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500"
        >
          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Clinic Name</p>
          <p className="text-lg font-bold text-gray-900">{clinicName || 'Clinic'}</p>
        </motion.div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview(!showPreview)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
        >
          <span>👁️</span>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyToClipboard}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
        >
          <span>📋</span>
          Copy HTML
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadEmail}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
        >
          <span>⬇️</span>
          Download
        </motion.button>
      </div>

      {/* Email Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-100 rounded-xl p-4 mb-6 overflow-auto max-h-[800px]"
        >
          <iframe
            srcDoc={generateEmailHTML()}
            style={{
              width: '100%',
              height: '800px',
              border: 'none',
              borderRadius: '8px'
            }}
            title="Email Preview"
          />
        </motion.div>
      )}

      {/* Features List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Template Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Professional Design</h3>
              <p className="text-gray-600 text-sm">Clean, modern email layout with gradient styling</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Days Tracking</h3>
              <p className="text-gray-600 text-sm">Automatically calculates and displays days remaining</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Urgency Alerts</h3>
              <p className="text-gray-600 text-sm">Highlights when appointment is within 7 days</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Preparation Tips</h3>
              <p className="text-gray-600 text-sm">Includes helpful tips for appointment preparation</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Action Buttons</h3>
              <p className="text-gray-600 text-sm">Interactive buttons for confirming or calling clinic</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Responsive</h3>
              <p className="text-gray-600 text-sm">Works perfectly on all devices and email clients</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Usage Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-8 mt-6 border-l-4 border-orange-500"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 How to Use</h2>
        
        <ol className="space-y-4 text-gray-700">
          <li className="flex gap-4">
            <span className="font-bold text-orange-600 flex-shrink-0">1.</span>
            <span>Update the patient details (name, email, clinic info, appointment date) in the component props</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-orange-600 flex-shrink-0">2.</span>
            <span>Click "Show Preview" to see how the email will look in the patient's inbox</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-orange-600 flex-shrink-0">3.</span>
            <span>Click "Copy HTML" to copy the email template and paste it into your email service</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-orange-600 flex-shrink-0">4.</span>
            <span>Or click "Download" to save the email as an HTML file for sending later</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-orange-600 flex-shrink-0">5.</span>
            <span>The template automatically calculates days remaining and highlights urgent appointments (≤ 7 days)</span>
          </li>
        </ol>
      </motion.div>

      {/* Integration Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 rounded-xl shadow-lg p-8 mt-6 border-l-4 border-blue-500"
      >
        <h3 className="text-lg font-bold text-blue-900 mb-3">🔗 Integration with Backend</h3>
        <p className="text-blue-800 mb-4">
          To fully integrate this reminder system:
        </p>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex gap-2">
            <span>•</span>
            <span>Create a scheduled job that runs daily to check for due appointments</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Use a mail service (NodeMailer, SendGrid, AWS SES) to send these emails automatically</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Set up reminders for 7 days, 3 days, and 1 day before the appointment</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Track email delivery and patient confirmations in your database</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
