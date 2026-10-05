// src/middleware/request-logger.js
// Простий лог кожного запиту: метод, шлях, статус, тривалість.
// PII (email/тіло запиту) свідомо не логуємо.

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
};

module.exports = { requestLogger };
