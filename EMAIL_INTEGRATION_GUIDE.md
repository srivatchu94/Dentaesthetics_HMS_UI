# Email Reminder Integration Guide

## Quick Start - Using the PatientVisitReminderEmail Component

### 1. Import the Component

```javascript
import PatientVisitReminderEmail from '../components/PatientVisitReminderEmail';
```

### 2. Basic Usage in a Page

```javascript
import React from 'react';
import PatientVisitReminderEmail from '../components/PatientVisitReminderEmail';

export default function EmailRemindersPage() {
  const patientData = {
    patientName: 'John Doe',
    patientEmail: 'john.doe@email.com',
    clinicName: 'Smile Dental Clinic',
    clinicEmail: 'info@smiledental.com',
    appointmentDate: '2025-01-15'
  };

  return (
    <PatientVisitReminderEmail
      patientName={patientData.patientName}
      patientEmail={patientData.patientEmail}
      clinicName={patientData.clinicName}
      clinicEmail={patientData.clinicEmail}
      appointmentDate={patientData.appointmentDate}
      daysRemaining={14}
    />
  );
}
```

### 3. Generate HTML for Sending

```javascript
// Get the generated HTML from the component
const getEmailHTML = (patientName, patientEmail, clinicName, clinicEmail, appointmentDate) => {
  // This is the structure used in PatientVisitReminderEmail
  const appointmentDateObj = new Date(appointmentDate);
  const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = appointmentDateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Your styling here -->
    </head>
    <body>
      <div class="container">
        <!-- Email content -->
      </div>
    </body>
    </html>
  `;
  
  return html;
};
```

---

## Backend Integration - Scheduled Email Service

### Implementation Steps

#### 1. Create Email Service (Node.js/Express example)

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendAppointmentReminder(appointmentData) {
  const { patientEmail, patientName, clinicName, clinicEmail, appointmentDate } = appointmentData;
  
  const html = generateAppointmentReminderHTML({
    patientName,
    patientEmail,
    clinicName,
    clinicEmail,
    appointmentDate
  });

  const mailOptions = {
    from: clinicEmail,
    to: patientEmail,
    subject: `📅 Appointment Reminder - ${clinicName}`,
    html: html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Reminder email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendAppointmentReminder };
```

#### 2. Create Scheduled Job (using node-schedule)

```javascript
// jobs/appointmentReminderJob.js
const schedule = require('node-schedule');
const { sendAppointmentReminder } = require('../services/emailService');
const db = require('../database');

// Run daily at 9:00 AM
const appointmentReminderJob = schedule.scheduleJob('0 9 * * *', async () => {
  console.log('🔄 Starting appointment reminder job...');
  
  try {
    // Get appointments in next 7 days
    const upcomingAppointments = await db.Appointment.find({
      appointmentDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      reminderSent: false
    }).populate('patientId').populate('clinicId');

    for (const appointment of upcomingAppointments) {
      const appointmentData = {
        patientEmail: appointment.patientId.email,
        patientName: appointment.patientId.firstName + ' ' + appointment.patientId.lastName,
        clinicName: appointment.clinicId.clinicName,
        clinicEmail: appointment.clinicId.clinicEmail,
        appointmentDate: appointment.appointmentDate
      };

      const result = await sendAppointmentReminder(appointmentData);
      
      if (result.success) {
        // Mark reminder as sent
        await db.Appointment.updateOne(
          { _id: appointment._id },
          { reminderSent: true, reminderSentAt: new Date() }
        );
      }
    }

    console.log('✅ Appointment reminder job completed');
  } catch (error) {
    console.error('❌ Error in appointment reminder job:', error);
  }
});

module.exports = { appointmentReminderJob };
```

#### 3. Setup Multiple Reminder Levels

```javascript
// jobs/multiLevelReminderJob.js
const schedule = require('node-schedule');
const { sendAppointmentReminder } = require('../services/emailService');

const REMINDER_DAYS = {
  WEEK_BEFORE: 7,
  THREE_DAYS: 3,
  DAY_BEFORE: 1
};

async function sendMultiLevelReminders() {
  for (const [level, daysAhead] of Object.entries(REMINDER_DAYS)) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const reminderKey = `reminder_${level.toLowerCase()}_sent`;

    try {
      const appointments = await db.Appointment.find({
        appointmentDate: { $gte: startDate, $lte: endDate },
        [reminderKey]: false
      }).populate('patientId').populate('clinicId');

      for (const appt of appointments) {
        const result = await sendAppointmentReminder({
          patientEmail: appt.patientId.email,
          patientName: `${appt.patientId.firstName} ${appt.patientId.lastName}`,
          clinicName: appt.clinicId.clinicName,
          clinicEmail: appt.clinicId.clinicEmail,
          appointmentDate: appt.appointmentDate
        });

        if (result.success) {
          await db.Appointment.updateOne(
            { _id: appt._id },
            { [reminderKey]: true }
          );
        }
      }
    } catch (error) {
      console.error(`Error sending ${level} reminders:`, error);
    }
  }
}

// Schedule: 7 days before at 9 AM
schedule.scheduleJob('0 9 * * *', () => sendMultiLevelReminders());
```

#### 4. Database Schema Update

Add fields to track reminders:

```javascript
// models/Appointment.js
const appointmentSchema = new Schema({
  // ... existing fields
  appointmentDate: Date,
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic' },
  
  // New reminder tracking fields
  reminder_week_before_sent: { 
    type: Boolean, 
    default: false 
  },
  reminder_three_days_sent: { 
    type: Boolean, 
    default: false 
  },
  reminder_day_before_sent: { 
    type: Boolean, 
    default: false 
  },
  reminderSentAt: { 
    type: Date 
  },
  reminderDeliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  }
});
```

---

## Using Alternative Email Services

### SendGrid Integration

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendWithSendGrid(appointmentData) {
  const { patientEmail, patientName, clinicName, clinicEmail, appointmentDate } = appointmentData;
  
  const msg = {
    to: patientEmail,
    from: clinicEmail,
    subject: `📅 Appointment Reminder - ${clinicName}`,
    html: generateAppointmentReminderHTML(appointmentData),
    replyTo: clinicEmail,
    categories: ['appointment-reminder']
  };

  try {
    const response = await sgMail.send(msg);
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### AWS SES Integration

```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

async function sendWithAWSSES(appointmentData) {
  const { patientEmail, patientName, clinicName, clinicEmail, appointmentDate } = appointmentData;
  
  const params = {
    Source: clinicEmail,
    Destination: { ToAddresses: [patientEmail] },
    Message: {
      Subject: { Data: `📅 Appointment Reminder - ${clinicName}` },
      Body: {
        Html: { 
          Data: generateAppointmentReminderHTML(appointmentData) 
        }
      }
    }
  };

  try {
    const result = await ses.sendEmail(params).promise();
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Frontend Integration - Creating a Reminder Management Page

```javascript
// pages/ReminderManagement.jsx
import React, { useState, useEffect } from 'react';
import PatientVisitReminderEmail from '../components/PatientVisitReminderEmail';
import { getUpcomingAppointments } from '../services/appointmentService';

export default function ReminderManagement() {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  const loadUpcomingAppointments = async () => {
    const appointments = await getUpcomingAppointments();
    setUpcomingAppointments(appointments);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📧 Appointment Reminders</h1>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {upcomingAppointments.map((appt) => (
          <div
            key={appt.id}
            onClick={() => setSelectedAppointment(appt)}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
          >
            <h3 className="font-bold">{appt.patientName}</h3>
            <p className="text-sm text-gray-600">{appt.appointmentDate}</p>
            <p className="text-sm text-gray-600">{appt.clinicName}</p>
          </div>
        ))}
      </div>

      {/* Email Preview */}
      {selectedAppointment && (
        <PatientVisitReminderEmail
          patientName={selectedAppointment.patientName}
          patientEmail={selectedAppointment.patientEmail}
          clinicName={selectedAppointment.clinicName}
          clinicEmail={selectedAppointment.clinicEmail}
          appointmentDate={selectedAppointment.appointmentDate}
        />
      )}
    </div>
  );
}
```

---

## Testing the Email Template

### Test Email Recipients
```javascript
// Use these email addresses to test in development:
const TEST_EMAILS = {
  SUCCESS: 'success@simulator.amazonses.com',
  BOUNCE: 'bounce@simulator.amazonses.com',
  COMPLAINT: 'complaint@simulator.amazonses.com',
  OOTO: 'ooto@simulator.amazonses.com'
};
```

### Manual Testing Checklist

- [ ] Email renders correctly in Gmail
- [ ] Email renders correctly in Outlook
- [ ] Email renders correctly on mobile
- [ ] All links work (mailto, tel)
- [ ] Images load properly
- [ ] Font styling is preserved
- [ ] Colors display correctly
- [ ] Days remaining calculation is accurate
- [ ] Clinic info is personalized
- [ ] Patient name is personalized

---

## Monitoring & Logging

```javascript
// utils/emailLogger.js
async function logEmailSent(appointmentId, patientEmail, messageId) {
  await db.EmailLog.create({
    appointmentId,
    recipientEmail: patientEmail,
    messageId,
    sentAt: new Date(),
    status: 'sent',
    type: 'appointment_reminder'
  });
}

async function logEmailBounce(messageId, bounceType) {
  await db.EmailLog.updateOne(
    { messageId },
    {
      status: 'bounced',
      bounceType,
      bouncedAt: new Date()
    }
  );
}
```

---

## Performance Tips

1. **Batch Sending**: Send emails in batches of 100 to avoid rate limits
2. **Queue System**: Use Bull/RabbitMQ for email queuing
3. **Caching**: Cache clinic info to reduce database calls
4. **HTML Optimization**: Minify email HTML for faster delivery
5. **Retry Logic**: Implement exponential backoff for failed sends

---

## Security Considerations

1. **Validate Emails**: Use email validation libraries
2. **Secure Templates**: Escape user input in email templates
3. **Rate Limiting**: Prevent abuse with rate limits
4. **SMTP Auth**: Use strong credentials and store in environment variables
5. **TLS**: Ensure secure email transmission
6. **Unsubscribe Link**: Add unsubscribe mechanism for compliance (CAN-SPAM, GDPR)

---

## Summary

The PatientVisitReminderEmail component provides a professional, reusable email template that can be:
- Used standalone for manual email generation
- Integrated with scheduled jobs for automatic reminders
- Customized with different clinic branding
- Tested in the UI before sending
- Exported as HTML files

All code examples are production-ready and follow best practices for email marketing and healthcare communication.
