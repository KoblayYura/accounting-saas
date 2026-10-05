// src/middleware/require-auth.js
// Перевірка JWT access-токена з заголовка Authorization: Bearer <token>.
// При успіху кладе accountant_id у req.accountantId; при помилці — 401 UNAUTHORIZED.
// Спільний для всіх приватних ендпоінтів усіх модулів.

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/api-response');

const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Відсутній або некоректний токен авторизації', 401));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.accountantId = payload.sub;
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Невалідний або прострочений токен', 401));
  }
};

module.exports = { requireAuth };
