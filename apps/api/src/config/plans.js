// src/config/plans.js
// Конфіг тарифних планів. Єдине джерело правди про ліміти клієнтів (DRY):
// імпортується auth.service (створення subscription при реєстрації),
// check-client-limit middleware і модулем billing.
//
// ⚠️ Ціни та пороги — orієнтовні, підлягають бізнес-рішенню перед релізом
// (див. 00-README.md §9). // TODO: verify with business before production

/** Конвенція зі спеки БД: -1 = безлімітна кількість клієнтів. */
const UNLIMITED_CLIENTS = -1;

// Значення — зі спеки module-06-billing/backend.md (таблиця тарифних планів).
// Назви планів для UI НЕ зберігаємо тут: усі тексти — через next-intl на фронті
// (ключі billing.plan.<plan>), див. 00-README.md §6.
const PLANS = {
  free: { clientLimit: 2, pricePerMonthUah: 0 },
  pro: { clientLimit: 20, pricePerMonthUah: 400 },
  unlimited: { clientLimit: UNLIMITED_CLIENTS, pricePerMonthUah: 700 },
};

/** Плани у вигляді масиву для GET /billing/plans (порядок = порядок показу в UI). */
const PLANS_LIST = Object.keys(PLANS).map((plan) => ({ plan, ...PLANS[plan] }));

/** План за замовчуванням для нового акаунта. */
const DEFAULT_PLAN = 'free';

/** Ліміт клієнтів для плану free — використовується при створенні subscription. */
const FREE_PLAN_CLIENT_LIMIT = PLANS.free.clientLimit;

/** Чи є ліміт безлімітним. Єдине місце, де перевіряється конвенція -1. */
const isUnlimited = (clientLimit) => clientLimit === UNLIMITED_CLIENTS;

module.exports = {
  UNLIMITED_CLIENTS,
  PLANS,
  PLANS_LIST,
  DEFAULT_PLAN,
  FREE_PLAN_CLIENT_LIMIT,
  isUnlimited,
};
