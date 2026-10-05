// src/middleware/check-client-limit.js
// Перевірка ліміту тарифного плану перед створенням клієнта.
// Ставиться ПІСЛЯ requireAuth (потрібен req.accountantId) і ПЕРЕД контролером.
//
// Ліміт читається з реальної таблиці subscriptions (запис створюється при реєстрації,
// див. auth.service.createAccountantWithSubscription).
// TODO: integrate with Module 06 — там зʼявиться зміна плану/поновлення підписки;
// поки що ліміт лише зчитується, апгрейд не реалізований.

const { prisma } = require('../db');
const { AppError } = require('../utils/api-response');
const { isUnlimited } = require('../config/plans');
const { countActiveClients } = require('../modules/clients/clients.service');

const checkClientLimit = async (req, _res, next) => {
  try {
    const accountantId = req.accountantId; // гарантовано requireAuth

    const subscription = await prisma.subscription.findUnique({
      where: { accountantId },
      select: { clientLimit: true },
    });

    if (!subscription) {
      throw new AppError('NO_SUBSCRIPTION', 'Для акаунта не знайдено активної підписки', 403);
    }

    // Конвенція зі спеки БД: clientLimit = -1 → без обмежень.
    if (isUnlimited(subscription.clientLimit)) return next();

    const activeClients = await countActiveClients(accountantId);

    if (activeClients >= subscription.clientLimit) {
      throw new AppError(
        'CLIENT_LIMIT_REACHED',
        `Досягнуто ліміт тарифу: ${subscription.clientLimit} активних клієнтів. Оновіть план, щоб додати більше`,
        403,
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkClientLimit };
