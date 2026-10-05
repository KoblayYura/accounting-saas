// src/utils/api-response.js
// Хелпери для уніфікованого формату відповідей API.
//   Успіх:  { success: true, data: {...} }
//   Помилка: { success: false, error: { code, message } }
// (Валідаційні помилки — окремий Laravel-формат 422, див. utils/validation-error.js.)

/** Успішна відповідь. status за замовчуванням 200. */
const sendSuccess = (res, data, status = 200) => res.status(status).json({ success: true, data });

/** Відповідь-помилка. Використовується error-handler; напряму в контролерах — рідко. */
const sendError = (res, code, message, status = 400) =>
  res.status(status).json({ success: false, error: { code, message } });

/**
 * Прикладна помилка з HTTP-статусом і машинним кодом.
 * Кидається в service-шарі, обробляється централізовано в error-handler.
 */
class AppError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

module.exports = { sendSuccess, sendError, AppError };
