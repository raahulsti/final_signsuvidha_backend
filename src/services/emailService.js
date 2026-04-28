const nodemailer = require('nodemailer');

let transporter;

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (transporter) return transporter;
  if (!hasSmtpConfig()) {
    const err = new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
    err.statusCode = 500;
    throw err;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const tx = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  return tx.sendMail({ from, to, subject, html, attachments });
};

module.exports = { sendMail };
