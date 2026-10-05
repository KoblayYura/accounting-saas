// src/modules/auth/auth.service.js
// Бізнес-логіка auth-модуля + доступ до даних через Prisma (db.js).
// Контролер викликає лише ці функції, з Prisma напряму не працює.

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../db');
const { env } = require('../../config/env');
const { DEFAULT_PLAN, FREE_PLAN_CLIENT_LIMIT } = require('../../config/plans');
const { AppError } = require('../../utils/api-response');
const { sendEmail } = require('../../utils/email');
const { passwordResetEmail, verifyEmailEmail } = require('./auth.emails');

const BCRYPT_COST = 12; // спека вимагає >=10
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 година
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 години

// ==================== Хелпери токенів ====================

const signAccessToken = (accountantId) =>
  jwt.sign({ sub: accountantId, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  });

const signRefreshToken = (accountantId) =>
  jwt.sign({ sub: accountantId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  });

const toUserDto = (a) => ({
  id: a.id,
  email: a.email,
  name: a.name,
  login: a.login,
  role: a.role,
  isVerified: a.isVerified,
});

const buildAuthResult = (a) => ({
  accessToken: signAccessToken(a.id),
  refreshToken: signRefreshToken(a.id),
  user: toUserDto(a),
});

// ==================== Rate limit для /login (in-memory) ====================
// Спека допускає просту in-memory реалізацію з TTL для MVP.
// Скидається при рестарті процесу — прийнятно на цьому етапі.

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

const assertLoginNotBlocked = (key) => {
  const entry = loginAttempts.get(key);
  if (!entry) return;
  if (Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    throw new AppError('TOO_MANY_ATTEMPTS', 'Забагато спроб входу. Спробуйте пізніше', 429);
  }
};

const registerFailedLogin = (key) => {
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
};

const clearLoginAttempts = (key) => {
  loginAttempts.delete(key);
};

// ==================== Спільне створення акаунту ====================

/** Створює accountant разом із subscription(free) в одній транзакції. */
const createAccountantWithSubscription = async (data) =>
  prisma.$transaction(async (tx) => {
    const accountant = await tx.accountant.create({
      data: {
        email: data.email,
        name: data.name,
        login: data.login ?? null,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
        googleId: data.googleId ?? null,
        isVerified: data.isVerified ?? false,
        // role за замовчуванням head_accountant (задається схемою Prisma)
      },
    });
    await tx.subscription.create({
      data: {
        accountantId: accountant.id,
        plan: DEFAULT_PLAN,
        clientLimit: FREE_PLAN_CLIENT_LIMIT,
        status: 'active',
      },
    });
    return accountant;
  });

/** Генерує токен верифікації email, зберігає ХЕШ і надсилає лист (DRY: register + resend). */
const issueEmailVerification = async (accountantId, email) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.emailVerificationToken.create({
    data: {
      accountantId,
      tokenHash,
      expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    },
  });

  const verifyLink = `${env.APP_BASE_URL}/verify-email?token=${rawToken}`;
  await sendEmail({ to: email, ...verifyEmailEmail(verifyLink) });
};

// ==================== Публічні операції ====================

/**
 * Реєстрація головного бухгалтера. Створює НЕверифікований акаунт і надсилає лист
 * підтвердження email. НЕ виконує автологін — доступ відкриється після /verify-email.
 */
const register = async (input) => {
  const email = input.email.toLowerCase();
  const login = input.login; // login case-sensitive, унікальний як введено

  const emailTaken = await prisma.accountant.findUnique({ where: { email } });
  if (emailTaken) {
    throw new AppError('EMAIL_TAKEN', 'Акаунт з таким email вже існує', 409);
  }

  const loginTaken = await prisma.accountant.findUnique({ where: { login } });
  if (loginTaken) {
    throw new AppError('LOGIN_TAKEN', 'Цей логін вже зайнятий', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const accountant = await createAccountantWithSubscription({
    email,
    login,
    phone: input.phone,
    name: login, // окремого поля "імʼя" на формі немає — ставимо логін
    passwordHash,
    isVerified: false, // доступ відкриється після підтвердження email
  });

  await issueEmailVerification(accountant.id, email);
};

const login = async (input) => {
  // identifier може бути email (case-insensitive) або login (case-sensitive).
  const identifier = input.identifier.trim();
  const rateLimitKey = identifier.toLowerCase();
  assertLoginNotBlocked(rateLimitKey);

  const accountant = await prisma.accountant.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { login: identifier }] },
  });

  const invalidCreds = () =>
    new AppError('INVALID_CREDENTIALS', 'Невірний email/логін або пароль', 401);

  if (!accountant) {
    registerFailedLogin(rateLimitKey);
    throw invalidCreds();
  }

  // Акаунт створений через Google — пароля немає.
  if (!accountant.passwordHash) {
    throw new AppError('GOOGLE_ACCOUNT', 'Цей акаунт зареєстрований через Google', 400);
  }

  const ok = await bcrypt.compare(input.password, accountant.passwordHash);
  if (!ok) {
    registerFailedLogin(rateLimitKey);
    throw invalidCreds();
  }

  // Блокуємо вхід до підтвердження email (захист від спам-реєстрацій).
  if (!accountant.isVerified) {
    throw new AppError('EMAIL_NOT_VERIFIED', 'Підтвердіть email, щоб увійти', 403);
  }

  clearLoginAttempts(rateLimitKey);
  return buildAuthResult(accountant);
};

/** Обмін refresh-токена на новий access (+ ротація refresh). */
const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('UNAUTHORIZED', 'Відсутній refresh-токен', 401);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('UNAUTHORIZED', 'Невалідний або прострочений refresh-токен', 401);
  }

  const accountant = await prisma.accountant.findUnique({ where: { id: payload.sub } });
  if (!accountant) {
    throw new AppError('UNAUTHORIZED', 'Акаунт не знайдено', 401);
  }

  return buildAuthResult(accountant);
};

/**
 * Обробка Google-профілю: звʼязати з існуючим акаунтом за email
 * або створити новий (passwordHash = null, isVerified = true) + subscription(free).
 */
const handleGoogleProfile = async (profile) => {
  const email = profile.email.toLowerCase();
  const existing = await prisma.accountant.findUnique({ where: { email } });

  if (existing) {
    const accountant = existing.googleId
      ? existing
      : await prisma.accountant.update({
          where: { id: existing.id },
          data: { googleId: profile.googleId },
        });
    return buildAuthResult(accountant);
  }

  const accountant = await createAccountantWithSubscription({
    email,
    name: profile.name,
    passwordHash: null,
    googleId: profile.googleId,
    isVerified: true, // Google гарантує реальність email
  });
  return buildAuthResult(accountant);
};

const getMe = async (accountantId) => {
  const a = await prisma.accountant.findUnique({ where: { id: accountantId } });
  if (!a) {
    throw new AppError('NOT_FOUND', 'Акаунт не знайдено', 404);
  }
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    login: a.login,
    role: a.role,
    isVerified: a.isVerified,
    phone: a.phone,
    telegram_chat_id: a.telegramChatId,
    reminder_days_before: a.reminderDaysBefore,
  };
};

const updateProfile = async (accountantId, input) => {
  const a = await prisma.accountant.update({
    where: { id: accountantId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.reminder_days_before !== undefined
        ? { reminderDaysBefore: input.reminder_days_before }
        : {}),
    },
  });
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    login: a.login,
    role: a.role,
    isVerified: a.isVerified,
    phone: a.phone,
    telegram_chat_id: a.telegramChatId,
    reminder_days_before: a.reminderDaysBefore,
  };
};

/**
 * Генерує токен скидання пароля, зберігає його ХЕШ, надсилає лист.
 * Завжди завершується тихо (не розкриває, чи існує email).
 */
const forgotPassword = async (input) => {
  const email = input.email.toLowerCase();
  const accountant = await prisma.accountant.findUnique({ where: { email } });

  // Google-only акаунт або відсутній — тихо виходимо.
  if (!accountant || !accountant.passwordHash) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      accountantId: accountant.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetLink = `${env.APP_BASE_URL}/reset-password?token=${rawToken}`;
  await sendEmail({ to: email, ...passwordResetEmail(resetLink) });
};

const resetPassword = async (input) => {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('INVALID_TOKEN', 'Токен недійсний або прострочений', 400);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);

  await prisma.$transaction([
    prisma.accountant.update({
      where: { id: record.accountantId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
};

/**
 * Підтвердження email за токеном → isVerified=true + автологін (повертає токени).
 */
const verifyEmail = async (input) => {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('INVALID_TOKEN', 'Посилання недійсне або прострочене', 400);
  }

  const [accountant] = await prisma.$transaction([
    prisma.accountant.update({
      where: { id: record.accountantId },
      data: { isVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return buildAuthResult(accountant);
};

/**
 * Повторна відправка листа підтвердження. Завжди тиха відповідь
 * (не розкриває існування email). Для вже верифікованих — нічого не робить.
 */
const resendVerification = async (input) => {
  const email = input.email.toLowerCase();
  const accountant = await prisma.accountant.findUnique({ where: { email } });

  if (!accountant || accountant.isVerified) return;

  await issueEmailVerification(accountant.id, email);
};

module.exports = {
  register,
  login,
  refresh,
  handleGoogleProfile,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
