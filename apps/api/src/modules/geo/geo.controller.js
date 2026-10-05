// src/modules/geo/geo.controller.js
// HTTP-шар geo-модуля: визначення рекомендованої локалі інтерфейсу за IP запиту.
// Публічний endpoint (без requireAuth) — потрібен ще до логіну, щоб застосувати мову.
//
// Логіка навмисно проста (KISS): країна UA → 'uk', решта → 'en'. Розширити мапу
// країна→локаль легко, коли додасться більше мов.

const geoip = require('geoip-lite');
const { sendSuccess } = require('../../utils/api-response');

/** Підтримувані локалі інтерфейсу (мають збігатися з messages/*.json на фронті). */
const DEFAULT_LOCALE = 'uk';

/** Країни, для яких дефолтимо українську. Решта світу → англійська. */
const UK_COUNTRIES = new Set(['UA']);

/**
 * Дістає «реальний» IP клієнта. За наявності проксі (nginx) — перший у X-Forwarded-For.
 * req.ip коректний, лише якщо в Express увімкнено trust proxy; тому підстраховуємось.
 */
const resolveClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
};

/** GET /api/v1/geo/locale → { locale }. Ніколи не кидає — при будь-якій невдачі дефолт. */
const getLocale = (req, res, next) => {
  try {
    const ip = resolveClientIp(req);
    // Приватні/локальні IP (dev, ::1, 127.0.0.1) geoip не розпізнає → null → дефолт.
    const geo = ip ? geoip.lookup(ip) : null;
    const locale = geo && UK_COUNTRIES.has(geo.country) ? 'uk' : geo ? 'en' : DEFAULT_LOCALE;

    sendSuccess(res, { locale });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLocale };
