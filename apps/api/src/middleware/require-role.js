// src/middleware/require-role.js
// Обмеження доступу за роллю. Використовувати ПІСЛЯ requireAuth (потрібен req.accountantId).
// Роль читається з БД (не з JWT) — щоб зміна ролі підхоплювалась одразу.

const { prisma } = require('../db');
const { AppError } = require('../utils/api-response');

const requireRole = (...roles) => {
  return async (req, _res, next) => {
    try {
      if (!req.accountantId) {
        return next(new AppError('UNAUTHORIZED', 'Потрібна авторизація', 401));
      }
      const accountant = await prisma.accountant.findUnique({
        where: { id: req.accountantId },
        select: { role: true },
      });
      if (!accountant || !roles.includes(accountant.role)) {
        return next(new AppError('FORBIDDEN', 'Недостатньо прав для цієї дії', 403));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requireRole };
