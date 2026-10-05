// src/modules/auth/auth.validation.js
// Ручна валідація вхідних даних auth-модуля (без Zod). Виконується до бізнес-логіки.
// При помилках кидає ValidationError → error-handler віддає 422 Laravel-формат.

const { Validator } = require('../../utils/validation-error');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_RE = /^[a-zA-Z0-9._-]+$/;
const PHONE_RE = /^\+[1-9]\d{7,14}$/; // E.164: '+' і 8-15 цифр (будь-яка країна)
const HAS_LETTER = /[A-Za-zА-Яа-яЁёЇїІіЄєҐґ]/;
const HAS_DIGIT = /[0-9]/;

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/** Спільна перевірка складності пароля. */
const validatePassword = (v, field, password) => {
  if (!isNonEmptyString(password)) {
    v.add(field, 'Пароль обовʼязковий.');
    return;
  }
  if (password.length < 8) v.add(field, 'Пароль має містити щонайменше 8 символів.');
  if (!HAS_LETTER.test(password)) v.add(field, 'Пароль має містити щонайменше одну літеру.');
  if (!HAS_DIGIT.test(password)) v.add(field, 'Пароль має містити щонайменше одну цифру.');
};

const validateRegister = (body) => {
  const v = new Validator();
  const { login, email, phone, password } = body || {};

  // login
  if (!isNonEmptyString(login)) {
    v.add('login', 'Логін обовʼязковий.');
  } else {
    const l = login.trim();
    if (l.length < 3) v.add('login', 'Логін має містити щонайменше 3 символи.');
    if (l.length > 30) v.add('login', 'Логін занадто довгий (макс. 30 символів).');
    if (!LOGIN_RE.test(l))
      v.add('login', 'Логін може містити лише латинські літери, цифри та символи . _ -');
  }

  // email
  if (!isNonEmptyString(email)) v.add('email', 'Поле email обовʼязкове.');
  else if (!EMAIL_RE.test(email.trim())) v.add('email', 'Некоректний формат email.');

  // phone
  if (!isNonEmptyString(phone)) v.add('phone', 'Телефон обовʼязковий.');
  else if (!PHONE_RE.test(phone.trim())) v.add('phone', 'Некоректний номер телефону.');

  // password
  validatePassword(v, 'password', password);

  v.throwIfAny();
  return {
    login: login.trim(),
    email: email.trim(),
    phone: phone.trim(),
    password,
  };
};

const validateLogin = (body) => {
  const v = new Validator();
  const { identifier, password } = body || {};

  if (!isNonEmptyString(identifier)) v.add('identifier', 'Введіть email або логін.');
  if (!isNonEmptyString(password)) v.add('password', 'Введіть пароль.');

  v.throwIfAny();
  return { identifier: identifier.trim(), password };
};

const validateUpdateProfile = (body) => {
  const v = new Validator();
  const data = {};

  if (body && body.name !== undefined) {
    if (!isNonEmptyString(body.name)) v.add('name', 'Імʼя не може бути порожнім.');
    else data.name = body.name.trim();
  }

  if (body && body.reminder_days_before !== undefined) {
    const n = Number(body.reminder_days_before);
    if (!Number.isInteger(n) || n < 0 || n > 30) {
      v.add('reminder_days_before', 'Має бути цілим числом від 0 до 30.');
    } else {
      data.reminder_days_before = n;
    }
  }

  if (Object.keys(data).length === 0 && !v.hasErrors()) {
    v.add('name', 'Не передано жодного поля для оновлення.');
  }

  v.throwIfAny();
  return data;
};

const validateForgotPassword = (body) => {
  const v = new Validator();
  const { email } = body || {};
  if (!isNonEmptyString(email)) v.add('email', 'Поле email обовʼязкове.');
  else if (!EMAIL_RE.test(email.trim())) v.add('email', 'Некоректний формат email.');
  v.throwIfAny();
  return { email: email.trim() };
};

const validateResetPassword = (body) => {
  const v = new Validator();
  const { token, newPassword } = body || {};
  if (!isNonEmptyString(token)) v.add('token', 'Відсутній токен.');
  validatePassword(v, 'newPassword', newPassword);
  v.throwIfAny();
  return { token, newPassword };
};

const validateVerifyEmail = (body) => {
  const v = new Validator();
  const { token } = body || {};
  if (!isNonEmptyString(token)) v.add('token', 'Відсутній токен.');
  v.throwIfAny();
  return { token };
};

const validateResendVerification = (body) => {
  const v = new Validator();
  const { email } = body || {};
  if (!isNonEmptyString(email)) v.add('email', 'Поле email обовʼязкове.');
  else if (!EMAIL_RE.test(email.trim())) v.add('email', 'Некоректний формат email.');
  v.throwIfAny();
  return { email: email.trim() };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
};
