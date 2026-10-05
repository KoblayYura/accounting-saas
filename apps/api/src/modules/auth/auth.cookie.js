// src/modules/auth/auth.cookie.js
// Єдине місце налаштування refresh-cookie (DRY): і login/register, і Google callback,
// і logout використовують ці хелпери, щоб опції cookie не розʼїхались.

const { isProduction } = require('../../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 днів

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction, // secure тільки в проді (HTTPS)
  sameSite: 'lax',
  path: '/api/v1/auth',
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions);
};

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie };
