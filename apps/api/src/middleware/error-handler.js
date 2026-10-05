// src/middleware/error-handler.js
// Централізована обробка помилок (останній middleware у ланцюжку).
//  - ValidationError → 422 Laravel-формат { message, errors } (новий стандарт, без обгортки).
//  - AppError        → { success:false, error:{ code, message } } з відповідним статусом.
//  - інше            → 500.

const { AppError } = require('../utils/api-response');
const { ValidationError } = require('../utils/validation-error');
const { isProduction } = require('../config/env');

const errorHandler = (err, _req, res, _next) => {
  // 1. Валідація вхідних даних → 422 у чистому Laravel-форматі (без success/error обгортки).
  if (err instanceof ValidationError) {
    return res.status(422).json({ message: err.message, errors: err.errors });
  }

  // 1b. Legacy: ZodError з ще не мігрованих модулів (Module 02/03) — приводимо теж до 422 Laravel.
  //     (Прибрати після міграції всіх модулів на ручну валідацію.)
  if (err && err.name === 'ZodError' && Array.isArray(err.issues)) {
    const errors = {};
    for (const issue of err.issues) {
      const field = Array.isArray(issue.path) ? issue.path.join('.') : 'field';
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);
    }
    return res.status(422).json({ message: 'The given data was invalid.', errors });
  }

  // 2. Прикладні помилки з відомим кодом/статусом.
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // 3. Усе інше — 500. Логуємо stack trace (PII не виводимо).
  console.error('[error-handler] Unhandled error:', err instanceof Error ? err.stack : err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'Внутрішня помилка сервера'
        : String(err instanceof Error ? err.message : err),
    },
  });
};

module.exports = { errorHandler };
