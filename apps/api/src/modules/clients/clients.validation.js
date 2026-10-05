// src/modules/clients/clients.validation.js
// Ручна валідація вхідних даних clients-модуля (без Zod). Виконується до бізнес-логіки.
// При помилках кидає ValidationError → error-handler віддає 422 Laravel-формат.

const { Validator } = require('../../utils/validation-error');

const CLIENT_TYPES = [
  'fop_group_1',
  'fop_group_2',
  'fop_group_3',
  'fop_general',
  'tov',
  'tov_general',
  'pp',
  'self_employed',
  'public_organization',
  'charity_fund',
  'osbb',
];
const SORT_FIELDS = ['name', 'created_at'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s-]{5,20}$/;
const EDRPOU_RE = /^\d{8}$|^\d{10}$/; // 8 цифр (ЄДРПОУ) або 10 (ІПН)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isString = (v) => typeof v === 'string';
const isNonEmptyString = (v) => isString(v) && v.trim().length > 0;

/**
 * Опційне текстове поле: порожній рядок трактуємо як «не вказано» (null).
 * Повертає { provided, value } — щоб PATCH відрізняв «не передали» від «очистили».
 */
const optionalText = (v, field, raw, { max, pattern, patternMessage }) => {
  if (raw === undefined) return { provided: false };
  if (raw === null) return { provided: true, value: null };

  if (!isString(raw)) {
    v.add(field, 'Має бути рядком.');
    return { provided: false };
  }

  const trimmed = raw.trim();
  if (trimmed === '') return { provided: true, value: null };

  if (max && trimmed.length > max) {
    v.add(field, `Занадто довге значення (макс. ${max} символів).`);
    return { provided: false };
  }
  if (pattern && !pattern.test(trimmed)) {
    v.add(field, patternMessage);
    return { provided: false };
  }
  return { provided: true, value: trimmed };
};

/** monthly_fee: число ≥ 0, максимум 2 знаки після коми. Порожнє → null. */
const optionalMonthlyFee = (v, raw) => {
  if (raw === undefined) return { provided: false };
  if (raw === null || raw === '') return { provided: true, value: null };

  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n)) {
    v.add('monthly_fee', 'Має бути числом.');
    return { provided: false };
  }
  if (n < 0) {
    v.add('monthly_fee', 'Не може бути відʼємним.');
    return { provided: false };
  }
  if (Math.round(n * 100) !== n * 100) {
    v.add('monthly_fee', 'Максимум 2 знаки після коми.');
    return { provided: false };
  }
  return { provided: true, value: n };
};

/** Спільні правила для create/update. Заповнює dto лише переданими полями. */
const collectClientFields = (v, body, dto) => {
  const b = body || {};

  const edrpou = optionalText(v, 'edrpou_or_inn', b.edrpou_or_inn, {
    pattern: EDRPOU_RE,
    patternMessage: 'Код має містити 8 цифр (ЄДРПОУ) або 10 цифр (ІПН).',
  });
  if (edrpou.provided) dto.edrpou_or_inn = edrpou.value;

  const phone = optionalText(v, 'phone', b.phone, {
    pattern: PHONE_RE,
    patternMessage: 'Некоректний формат телефону.',
  });
  if (phone.provided) dto.phone = phone.value;

  const email = optionalText(v, 'email', b.email, {
    pattern: EMAIL_RE,
    patternMessage: 'Некоректний формат email.',
  });
  if (email.provided) dto.email = email.value;

  const notes = optionalText(v, 'notes', b.notes, { max: 2000 });
  if (notes.provided) dto.notes = notes.value;

  const fee = optionalMonthlyFee(v, b.monthly_fee);
  if (fee.provided) dto.monthly_fee = fee.value;
};

const validateCreateClient = (body) => {
  const v = new Validator();
  const b = body || {};
  const dto = {};

  // name — обовʼязкове
  if (!isNonEmptyString(b.name)) {
    v.add('name', 'Вкажіть назву або ПІБ клієнта.');
  } else if (b.name.trim().length > 200) {
    v.add('name', 'Назва занадто довга (макс. 200 символів).');
  } else {
    dto.name = b.name.trim();
  }

  // client_type — обовʼязкове, з переліку
  if (!isNonEmptyString(b.client_type)) {
    v.add('client_type', 'Оберіть тип клієнта.');
  } else if (!CLIENT_TYPES.includes(b.client_type)) {
    v.add('client_type', 'Некоректний тип клієнта.');
  } else {
    dto.client_type = b.client_type;
  }

  collectClientFields(v, b, dto);

  v.throwIfAny();
  return dto;
};

const validateUpdateClient = (body) => {
  const v = new Validator();
  const b = body || {};
  const dto = {};

  if (b.name !== undefined) {
    if (!isNonEmptyString(b.name)) v.add('name', 'Назва не може бути порожньою.');
    else if (b.name.trim().length > 200)
      v.add('name', 'Назва занадто довга (макс. 200 символів).');
    else dto.name = b.name.trim();
  }

  if (b.client_type !== undefined) {
    if (!CLIENT_TYPES.includes(b.client_type)) v.add('client_type', 'Некоректний тип клієнта.');
    else dto.client_type = b.client_type;
  }

  collectClientFields(v, b, dto);

  if (Object.keys(dto).length === 0 && !v.hasErrors()) {
    v.add('name', 'Не передано жодного поля для оновлення.');
  }

  v.throwIfAny();
  return dto;
};

/** :id у шляху — завжди uuid, інакше 422 (а не «дивний» пошук у БД). */
const validateClientId = (params) => {
  const v = new Validator();
  const id = params?.id;
  if (!isNonEmptyString(id) || !UUID_RE.test(id)) {
    v.add('id', 'Некоректний ідентифікатор клієнта.');
  }
  v.throwIfAny();
  return id;
};

/** Query-параметри списку. is_active за замовчуванням true (спека frontend). */
const validateListQuery = (query) => {
  const v = new Validator();
  const q = query || {};
  const dto = { page: 1, limit: 20, sort: 'name', is_active: true };

  if (q.search !== undefined && q.search !== '') {
    if (!isString(q.search)) v.add('search', 'Має бути рядком.');
    else if (q.search.length > 200) v.add('search', 'Занадто довгий пошуковий запит.');
    else dto.search = q.search.trim();
  }

  if (q.type !== undefined && q.type !== '') {
    if (!CLIENT_TYPES.includes(q.type)) v.add('type', 'Некоректний тип клієнта.');
    else dto.type = q.type;
  }

  if (q.is_active !== undefined && q.is_active !== '') {
    if (q.is_active !== 'true' && q.is_active !== 'false') {
      v.add('is_active', "Має бути 'true' або 'false'.");
    } else {
      dto.is_active = q.is_active === 'true';
    }
  }

  if (q.page !== undefined && q.page !== '') {
    const n = Number(q.page);
    if (!Number.isInteger(n) || n < 1) v.add('page', 'Має бути цілим числом ≥ 1.');
    else dto.page = n;
  }

  if (q.limit !== undefined && q.limit !== '') {
    const n = Number(q.limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) v.add('limit', 'Має бути цілим числом 1..100.');
    else dto.limit = n;
  }

  if (q.sort !== undefined && q.sort !== '') {
    if (!SORT_FIELDS.includes(q.sort)) v.add('sort', "Допустимі значення: 'name', 'created_at'.");
    else dto.sort = q.sort;
  }

  v.throwIfAny();
  return dto;
};

module.exports = {
  CLIENT_TYPES,
  validateCreateClient,
  validateUpdateClient,
  validateClientId,
  validateListQuery,
};
