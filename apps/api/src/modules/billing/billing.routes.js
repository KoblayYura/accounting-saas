// src/modules/billing/billing.routes.js
// Маршрути billing-модуля. Монтуються в app під /api/v1/billing.
//
// ⚠️ Реалізовано частково, в межах Module 02: лише read-only ендпоінти,
// потрібні для ClientLimitBanner. Оплата — TODO Module 06:
//   POST /checkout, POST /webhook (перевірка підпису LiqPay!), GET /checkout/result.

const { Router } = require('express');
const { requireAuth } = require('../../middleware/require-auth');
const billingController = require('./billing.controller');

const router = Router();

// Публічний (без авторизації) — за спекою Module 06.
router.get('/plans', billingController.plans);

router.get('/subscription', requireAuth, billingController.subscription);

module.exports = router;
