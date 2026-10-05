// src/modules/clients/clients.routes.js
// Маршрути clients-модуля. Монтуються в app під /api/v1/clients.
// Усі маршрути приватні: requireAuth встановлює req.accountantId,
// за яким service фільтрує дані (ізоляція орендаря).

const { Router } = require('express');
const { requireAuth } = require('../../middleware/require-auth');
const { checkClientLimit } = require('../../middleware/check-client-limit');
const clientsController = require('./clients.controller');

const router = Router();

// Один раз на весь роутер — замість повторення в кожному маршруті (DRY).
router.use(requireAuth);

router.get('/', clientsController.list);
router.post('/', checkClientLimit, clientsController.create);

router.get('/:id', clientsController.getById);
router.patch('/:id', clientsController.update);
router.delete('/:id', clientsController.archive);
router.post('/:id/restore', clientsController.restore);

module.exports = router;
