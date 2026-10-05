// src/modules/auth/auth.controller.js
// HTTP-шар auth-модуля: ручна валідація → виклик service → { success, data }.
// Помилки прокидаються в next() → централізований error-handler.

const { sendSuccess, AppError } = require('../../utils/api-response');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } = require('./auth.cookie');
const { env } = require('../../config/env');
const authService = require('./auth.service');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
} = require('./auth.validation');

const register = async (req, res, next) => {
  try {
    const dto = validateRegister(req.body);
    await authService.register(dto);
    // Без автологіну: доступ відкриється після підтвердження email.
    sendSuccess(
      res,
      { message: 'Реєстрація майже завершена. Перевірте пошту для підтвердження email' },
      201,
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const dto = validateLogin(req.body);
    const { accessToken, refreshToken, user } = await authService.login(dto);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    const { accessToken, refreshToken, user } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken); // ротація
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
};

const logout = async (_req, res, next) => {
  try {
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const profile = await authService.getMe(req.accountantId);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const dto = validateUpdateProfile(req.body);
    const profile = await authService.updateProfile(req.accountantId, dto);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const dto = validateForgotPassword(req.body);
    await authService.forgotPassword(dto);
    // Завжди однакова відповідь — не розкриваємо існування email.
    sendSuccess(res, { message: 'Якщо акаунт існує, лист із інструкціями надіслано' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const dto = validateResetPassword(req.body);
    await authService.resetPassword(dto);
    sendSuccess(res, { message: 'Пароль успішно змінено' });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const dto = validateVerifyEmail(req.body);
    const { accessToken, refreshToken, user } = await authService.verifyEmail(dto);
    setRefreshCookie(res, refreshToken); // автологін після підтвердження
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const dto = validateResendVerification(req.body);
    await authService.resendVerification(dto);
    sendSuccess(res, { message: 'Якщо акаунт існує і не підтверджений, лист надіслано' });
  } catch (err) {
    next(err);
  }
};

// ==================== Google OAuth callback ====================

/**
 * Викликається після успішної Google-автентифікації (passport).
 * Ставить refresh-cookie на бекенді й редіректить на фронт БЕЗ токена в URL —
 * фронт далі викличе /auth/refresh для access-токена.
 */
const googleCallback = async (req, res, next) => {
  try {
    const authResult = req.user; // passport кладе результат handleGoogleProfile
    if (!authResult?.refreshToken) {
      throw new AppError('OAUTH_FAILED', 'Не вдалося авторизуватись через Google', 401);
    }
    setRefreshCookie(res, authResult.refreshToken);
    res.redirect(`${env.APP_BASE_URL}/auth/callback`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleCallback,
};
