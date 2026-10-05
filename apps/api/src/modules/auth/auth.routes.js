// src/modules/auth/auth.routes.js
// Маршрути auth-модуля. Монтуються в app.js під /api/v1/auth.

const { Router } = require('express');
const passport = require('passport');
const { requireAuth } = require('../../middleware/require-auth');
const { isGoogleOAuthEnabled } = require('../../config/env');
const { sendError } = require('../../utils/api-response');
const authController = require('./auth.controller');

const router = Router();

// --- Email + пароль ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// --- Підтвердження email ---
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// --- Профіль (потребує auth) ---
router.get('/me', requireAuth, authController.me);
router.patch('/me', requireAuth, authController.updateMe);

// --- Відновлення пароля ---
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// --- Google OAuth2 ---
if (isGoogleOAuthEnabled) {
  router.get(
    '/google',
    passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),
  );
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/api/v1/auth/google/failure',
    }),
    authController.googleCallback,
  );
} else {
  // Заглушки, щоб маршрути існували й давали зрозумілу помилку, коли Google не налаштований.
  const notConfigured = (_req, res) =>
    sendError(res, 'OAUTH_NOT_CONFIGURED', 'Google OAuth не налаштований на сервері', 501);
  router.get('/google', notConfigured);
  router.get('/google/callback', notConfigured);
}

router.get('/google/failure', (_req, res) =>
  sendError(res, 'OAUTH_FAILED', 'Не вдалося авторизуватись через Google', 401),
);

module.exports = router;
