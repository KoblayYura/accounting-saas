// src/utils/email.js
// Відправка email через SMTP (nodemailer). Усі налаштування — з env (SMTP_*).
// Якщо SMTP не налаштований (немає ключів) — fallback: лист логується в консоль,
// щоб розробка/тести не залежали від зовнішнього провайдера.

const nodemailer = require('nodemailer');
const { env, isEmailEnabled } = require('../config/env');

let transporter = null;

/** Лінива ініціалізація SMTP-транспорту (створюється один раз). */
const getTransporter = () => {
  if (!isEmailEnabled) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false, // true для 465, false для 587 (STARTTLS)
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
};

/**
 * Надіслати email. Не кидає помилку назовні (щоб не ламати бізнес-флоу),
 * а логує проблему — виклик forgot-password має завжди відповідати однаково.
 * @param {{ to: string, subject: string, html: string, text?: string }} params
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();

  // Fallback: SMTP не налаштований — лог у консоль (dev/MVP).
  if (!tx) {
    console.log(`[email:fallback] To: ${to} | Subject: ${subject}\n${text ?? html}`);
    return;
  }

  const from = env.EMAIL_FROM || env.SMTP_USER;
  try {
    await tx.sendMail({ from, to, subject, html, text });
    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error('[email] Failed to send:', err instanceof Error ? err.message : err);
  }
};

module.exports = { sendEmail };
