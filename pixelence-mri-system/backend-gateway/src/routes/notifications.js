/**
 * Email Notification Routes
 * Sends email alerts for clinical workflow events
 * Uses nodemailer with SMTP config from environment variables
 */

const express = require('express');
const nodemailer = require('nodemailer');
const winston = require('winston');

const router = express.Router();

// Build transporter from env — falls back to a no-op logger in development
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    winston.warn('Email not configured (missing SMTP_HOST / SMTP_USER / SMTP_PASS). Emails will be logged only.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || 'noreply@pixelenceai.com';
  const transporter = getTransporter();

  if (!transporter) {
    winston.info('Email (dry-run)', { to, subject });
    return;
  }

  await transporter.sendMail({ from, to, subject, html, text });
  winston.info('Email sent', { to, subject });
}

/**
 * POST /api/notifications/scan-ready
 * Notifies radiologist that DICOM scan is uploaded and ready for review.
 * Body: { radiologistEmail, radiologistName, patientName, jobId }
 */
router.post('/scan-ready', async (req, res, next) => {
  try {
    const { radiologistEmail, radiologistName, patientName, jobId } = req.body;
    if (!radiologistEmail) {
      return res.status(400).json({ error: 'radiologistEmail is required' });
    }

    await sendEmail({
      to: radiologistEmail,
      subject: `[Pixelence] Scan Ready for Review – ${patientName || 'Patient'}`,
      text: `Hello ${radiologistName || 'Doctor'},\n\nA new MRI scan is ready for your review.\n\nPatient: ${patientName}\nJob ID: ${jobId}\n\nPlease log in to Pixelence to review the images.\n\n– Pixelence MRI System`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#7c3aed">Pixelence – Scan Ready for Review</h2>
          <p>Hello ${radiologistName || 'Doctor'},</p>
          <p>A new MRI scan has been uploaded and is ready for your review.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:4px 8px;font-weight:bold">Patient:</td><td>${patientName || '—'}</td></tr>
            <tr><td style="padding:4px 8px;font-weight:bold">Job ID:</td><td>${jobId || '—'}</td></tr>
          </table>
          <p style="margin-top:16px"><a href="${process.env.APP_URL || 'http://localhost:3000'}/reports" style="background:#7c3aed;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px">Open Pixelence</a></p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">Pixelence MRI Analysis System</p>
        </div>`,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/report-submitted
 * Notifies doctor (and optionally hospital admin) that a radiologist has submitted a report.
 * Body: { doctorEmail, doctorName, adminEmails, patientName, reportId, approved }
 */
router.post('/report-submitted', async (req, res, next) => {
  try {
    const { doctorEmail, doctorName, adminEmails = [], patientName, reportId, approved } = req.body;

    const subject = `[Pixelence] Report ${approved ? 'Approved' : 'Submitted'} – ${patientName || 'Patient'}`;
    const buildHtml = (recipientName) => `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#7c3aed">Pixelence – MRI Report ${approved ? 'Approved' : 'Submitted'}</h2>
        <p>Hello ${recipientName || 'there'},</p>
        <p>The MRI report for <strong>${patientName || '—'}</strong> has been ${approved ? 'approved and submitted' : 'submitted with edits'} by the radiologist.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:4px 8px;font-weight:bold">Patient:</td><td>${patientName || '—'}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">Report ID:</td><td>${reportId || '—'}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">Status:</td><td>${approved ? 'Approved' : 'Submitted'}</td></tr>
        </table>
        <p style="margin-top:16px"><a href="${process.env.APP_URL || 'http://localhost:3000'}/reports/${reportId}" style="background:#7c3aed;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px">View Report</a></p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Pixelence MRI Analysis System</p>
      </div>`;

    const recipients = [];
    if (doctorEmail) recipients.push({ email: doctorEmail, name: doctorName });
    for (const email of adminEmails) {
      if (email) recipients.push({ email, name: 'Hospital Admin' });
    }

    await Promise.all(
      recipients.map((r) =>
        sendEmail({
          to: r.email,
          subject,
          html: buildHtml(r.name),
          text: `Hello ${r.name || 'there'},\n\nThe MRI report for ${patientName} has been ${approved ? 'approved' : 'submitted'} by the radiologist.\nReport ID: ${reportId}\n\nPlease log in to Pixelence to view the report.\n\n– Pixelence MRI System`,
        })
      )
    );

    res.json({ success: true, notified: recipients.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/license-expiring
 * Notifies super-admin and hospital admin that a license is expiring soon.
 * Body: { emails, hospitalName, expiryDate, daysLeft }
 */
router.post('/license-expiring', async (req, res, next) => {
  try {
    const { emails = [], hospitalName, expiryDate, daysLeft } = req.body;

    await Promise.all(
      emails.map((email) =>
        sendEmail({
          to: email,
          subject: `[Pixelence] License Expiring in ${daysLeft} Days – ${hospitalName}`,
          text: `The Pixelence license for ${hospitalName} will expire in ${daysLeft} days (${expiryDate}). Please renew to avoid service interruption.`,
          html: `<div style="font-family:sans-serif;max-width:520px;margin:auto">
            <h2 style="color:#d97706">Pixelence – License Expiring Soon</h2>
            <p>The Pixelence license for <strong>${hospitalName}</strong> will expire in <strong>${daysLeft} days</strong> (${expiryDate}).</p>
            <p>Please renew the license to avoid interruption of service for hospital staff.</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/super-admin/hospitals" style="background:#7c3aed;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px">Manage License</a></p>
          </div>`,
        })
      )
    );

    res.json({ success: true, notified: emails.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/user-created
 * Sends a welcome email to a newly created staff user with their login credentials.
 * Body: { email, firstName, lastName, role, password, hospitalName }
 */
router.post('/user-created', async (req, res, next) => {
  try {
    const { email, firstName, lastName, role, password, hospitalName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const roleLabel = {
      'hospital-admin': 'Hospital Admin',
      'it-admin': 'IT Admin',
      'doctor': 'Doctor',
      'radiologist': 'Radiologist',
      'radiographer': 'Radiographer',
      'finance-user': 'Finance User',
    }[role] || role;

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'there';

    await sendEmail({
      to: email,
      subject: `[Pixelence] Your account has been created`,
      text: `Hello ${fullName},\n\nYour Pixelence MRI System account has been created.\n\nLogin details:\n  Email: ${email}\n  Password: ${password}\n  Role: ${roleLabel}\n\nPlease log in and change your password as soon as possible.\n${appUrl}/login\n\n– Pixelence MRI System`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#7c3aed">Welcome to Pixelence MRI System</h2>
          <p>Hello ${fullName},</p>
          <p>Your account has been created${hospitalName ? ` for <strong>${hospitalName}</strong>` : ''}. Here are your login credentials:</p>
          <table style="border-collapse:collapse;width:100%;margin:12px 0;background:#f9fafb;border-radius:6px">
            <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Email</td><td style="padding:8px 12px;color:#111827">${email}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Password</td><td style="padding:8px 12px;color:#111827;font-family:monospace">${password}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Role</td><td style="padding:8px 12px;color:#111827">${roleLabel}</td></tr>
          </table>
          <p style="color:#dc2626;font-size:13px">Please change your password after your first login.</p>
          <p style="margin-top:16px">
            <a href="${appUrl}/login" style="background:#7c3aed;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;font-size:14px">Log in to Pixelence</a>
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">Pixelence MRI Analysis System</p>
        </div>`,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
