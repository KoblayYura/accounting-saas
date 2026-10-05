// src/modules/billing/billing.service.js
// Бізнес-логіка billing-модуля (реалізовано ЧАСТКОВО, в межах Module 02).
//
// Наразі тут лише read-only операції, потрібні для банера ліміту клієнтів:
//   - getPlans()        → GET /billing/plans
//   - getSubscription() → GET /billing/subscription  ("X з Y клієнтів")
//
// TODO (Module 06): checkout (LiqPay), webhook з перевіркою підпису,
// checkExpiredSubscriptions cron, історія payments.

const { prisma } = require('../../db');
const { AppError } = require('../../utils/api-response');
const { PLANS_LIST, isUnlimited } = require('../../config/plans');
const { countActiveClients } = require('../clients/clients.service');

/** Публічний перелік тарифів із конфігу (без БД). Назви планів перекладає фронт (next-intl). */
const getPlans = () => PLANS_LIST;

/** Поточна підписка + фактичне використання. Джерело для ClientLimitBanner. */
const getSubscription = async (accountantId) => {
  const [subscription, usedClients] = await Promise.all([
    prisma.subscription.findUnique({ where: { accountantId } }),
    countActiveClients(accountantId),
  ]);

  if (!subscription) {
    throw new AppError('NO_SUBSCRIPTION', 'Для акаунта не знайдено активної підписки', 403);
  }

  return {
    plan: subscription.plan,
    client_limit: subscription.clientLimit,
    status: subscription.status,
    // Фактична кількість активних клієнтів — для прогресу "X з Y" (спека Module 06).
    used_clients: usedClients,
    // true, якщо ліміт безлімітний (-1). Щоб UI не перевіряв конвенцію сам.
    is_unlimited: isUnlimited(subscription.clientLimit),
    current_period_end: subscription.currentPeriodEnd,
  };
};

module.exports = { getPlans, getSubscription };
