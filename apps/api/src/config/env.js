// src/config/env.js
// Читання і валідація змінних середовища (виконується один раз при старті).
// Без Zod — прості ручні перевірки (новий стек проєкту, JS). Секрети JWT обов'язкові;
// Google OAuth і SMTP опційні (без них відповідні функції коректно деградують).

require('dotenv/config');

const raw = process.env;
const errors = [];

const required = (name) => {
  const v = raw[name];
  if (!v || String(v).trim() === '') errors.push(`  - ${name}: is required`);
  return v;
};

const toInt = (name, fallback) => {
  const v = raw[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    errors.push(`  - ${name}: must be a number`);
    return fallback;
  }
  return n;
};

const NODE_ENV = ['development', 'test', 'production'].includes(raw.NODE_ENV)
  ? raw.NODE_ENV
  : 'development';

const env = {
  NODE_ENV,
  PORT: toInt('PORT', 4000),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),

  // Тривалість життя токенів (зі спеки: access 15хв, refresh 30 днів).
  JWT_ACCESS_TTL: raw.JWT_ACCESS_TTL || '15m',
  JWT_REFRESH_TTL: raw.JWT_REFRESH_TTL || '30d',

  // Базовий URL фронтенду — куди редіректить Google callback.
  APP_BASE_URL: raw.APP_BASE_URL || 'http://localhost:3000',

  // Google OAuth — опційно.
  GOOGLE_CLIENT_ID: raw.GOOGLE_CLIENT_ID || undefined,
  GOOGLE_CLIENT_SECRET: raw.GOOGLE_CLIENT_SECRET || undefined,
  GOOGLE_CALLBACK_URL: raw.GOOGLE_CALLBACK_URL || undefined,

  // SMTP (email) — опційно. Якщо не задано — листи логуються в консоль (fallback).
  SMTP_HOST: raw.SMTP_HOST || undefined,
  SMTP_PORT: toInt('SMTP_PORT', undefined),
  SMTP_SECURE: raw.SMTP_SECURE === 'true',
  SMTP_USER: raw.SMTP_USER || undefined,
  SMTP_PASS: raw.SMTP_PASS || undefined,
  // Адреса відправника, напр. "Accounting <you@gmail.com>". Дефолт — SMTP_USER.
  EMAIL_FROM: raw.EMAIL_FROM || undefined,
};

if (errors.length > 0) {
  // Фейлимось голосно при старті, щоб не ловити runtime-помилки глибше.
  throw new Error(`Invalid environment variables:\n${errors.join('\n')}`);
}

/** Чи налаштований Google OAuth (усі три ключі присутні). */
const isGoogleOAuthEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

/** Чи налаштований SMTP (мінімум host + user + pass). */
const isEmailEnabled = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const isProduction = env.NODE_ENV === 'production';

module.exports = { env, isGoogleOAuthEnabled, isEmailEnabled, isProduction };
