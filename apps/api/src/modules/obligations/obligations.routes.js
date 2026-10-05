// src/modules/obligations/obligations.routes.js
// Маршрути obligations-модуля. Монтуються в app під /api/v1/obligations.
// Усі маршрути приватні: requireAuth встановлює req.accountantId,
// за яким service ізолює дані (через client.accountantId).

const { Router } = require('express');
const { requireAuth } = require('../../middleware/require-auth');
const obligationsController = require('./obligations.controller');

const router = Router();

// Один раз на весь роутер — замість повторення в кожному маршруті (DRY).
router.use(requireAuth);

router.get('/', obligationsController.list);
router.post('/', obligationsController.create);

router.get('/:id', obligationsController.getById);
router.patch('/:id', obligationsController.update);
router.patch('/:id/status', obligationsController.updateStatus);
router.delete('/:id', obligationsController.remove);

module.exports = router;
