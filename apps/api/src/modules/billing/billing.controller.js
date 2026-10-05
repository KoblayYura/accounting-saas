// src/modules/billing/billing.controller.js
// HTTP-шар billing-модуля (часткова реалізація — див. billing.service.js).

const { sendSuccess } = require('../../utils/api-response');
const billingService = require('./billing.service');

/** Публічний — використовується і на /pricing, і в модалці апгрейду. */
const plans = (_req, res, next) => {
  try {
    sendSuccess(res, billingService.getPlans());
  } catch (err) {
    next(err);
  }
};

const subscription = async (req, res, next) => {
  try {
    const data = await billingService.getSubscription(req.accountantId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { plans, subscription };
