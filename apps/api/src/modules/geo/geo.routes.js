// src/modules/geo/geo.routes.js
// Маршрути geo-модуля. Монтуються в app під /api/v1/geo.
// Публічні (без requireAuth) — локаль потрібна ще до автентифікації.

const { Router } = require('express');
const geoController = require('./geo.controller');

const router = Router();

router.get('/locale', geoController.getLocale);

module.exports = router;
