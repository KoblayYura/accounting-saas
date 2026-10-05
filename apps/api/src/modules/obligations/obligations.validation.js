// src/modules/obligations/obligations.validation.js
// Ручна валідація вхідних даних obligations-модуля (без Zod). Виконується до бізнес-логіки.
// При помилках кидає ValidationError → error-handler віддає 422 Laravel-формат.

const moment = require('moment');
const { Validator } = require('../../utils/validation-error');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Статуси зобов'язання в БД (Prisma enum ObligationStatus). */
const STATUS_VALUES = ['pending', 'collected', 'submitted', 'overdue'];
/** Статуси, які можна виставити вручну (overdue — лише cron). */
const MANUAL_STATUS_VALUES = ['pending', 'collected', 'submitted'];

/**
 * Рівень терміновості — обчислюваний фільтр (не поле в БД).
 *   overdue    — due_date < сьогодні
 *   this_week  — найближчі 7 днів
 *   this_month — у межах поточного календарного місяця
 *   later      — усе інше
 */
const URGENCY_VALUES = ['overdue', 'this_week', 'this_month', 'later'];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v.trim());

/** Дата у форматі YYYY-MM-DD → нормалізований UTC-день (00:00Z). Strict-парсинг moment. */
const parseDateOnly = (value) => moment.utc(String(value).trim(), 'YYYY-MM-DD', true);

/** :id у шляху — завжди uuid; інакше 422, а не «дивний» пошук у БД. */
const validateObligationId = (params) => {
  const v = new Validator();
  const id = params && params.id;
  if (!isUuid(id)) v.add('id', 'Некоректний ідентифікатор зобовʼязання.');
  v.throwIfAny();
  return { id: id.trim() };
};

/** Query-параметри списку зобовʼязань (з дефолтами page=1, limit=20). */
const validateListQuery = (query) => {
  const v = new Validator();
  const q = query || {};

  if (q.client_id !== undefined && !isUuid(q.client_id)) {
    v.add('client_id', 'Некоректний ідентифікатор клієнта.');
  }
  if (q.status !== undefined && !STATUS_VALUES.includes(q.status)) {
    v.add('status', `Статус має бути одним із: ${STATUS_VALUES.join(', ')}.`);
  }
  if (q.urgency !== undefined && !URGENCY_VALUES.includes(q.urgency)) {
    v.add('urgency', `Терміновість має бути однією з: ${URGENCY_VALUES.join(', ')}.`);
  }

  // page / limit — цілі числа в межах.
  let page = 1;
  if (q.page !== undefined) {
    const n = Number(q.page);
    if (!Number.isInteger(n) || n < 1) v.add('page', 'Сторінка має бути цілим числом ≥ 1.');
    else page = n;
  }

  let limit = 20;
  if (q.limit !== undefined) {
    const n = Number(q.limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      v.add('limit', 'Ліміт має бути цілим числом від 1 до 100.');
    } else {
      limit = n;
    }
  }

  v.throwIfAny();

  return {
    client_id: q.client_id !== undefined ? String(q.client_id).trim() : undefined,
    status: q.status !== undefined ? q.status : undefined,
    urgency: q.urgency !== undefined ? q.urgency : undefined,
    page,
    limit,
  };
};

/** Спільна перевірка назви зобовʼязання. */
const validateName = (v, field, name) => {
  if (!isNonEmptyString(name)) {
    v.add(field, 'Вкажіть назву зобовʼязання.');
    return;
  }
  if (name.trim().length > 200) v.add(field, 'Назва занадто довга (макс. 200 символів).');
};

/** Спільна перевірка нотаток (опційні, порожній рядок = «не вказано»). */
const validateNotes = (v, notes) => {
  if (notes === undefined || notes === null) return;
  if (typeof notes !== 'string') {
    v.add('notes', 'Нотатка має бути рядком.');
    return;
  }
  if (notes.trim().length > 2000) v.add('notes', 'Нотатка занадто довга (макс. 2000 символів).');
};

/**
 * Опційний чекліст документів: масив назв. Порожні рядки відкидаються,
 * дублікати не забороняємо. Максимум 50 позицій, кожна до 200 символів.
 */
const validateChecklistItems = (v, items) => {
  if (items === undefined || items === null) return undefined;
  if (!Array.isArray(items)) {
    v.add('checklist_items', 'Чекліст має бути масивом назв документів.');
    return undefined;
  }
  if (items.length > 50) v.add('checklist_items', 'Забагато документів у чеклісті (макс. 50).');

  const cleaned = [];
  items.forEach((item, index) => {
    if (typeof item !== 'string') {
      v.add('checklist_items', `Документ №${index + 1}: назва має бути рядком.`);
      return;
    }
    const name = item.trim();
    if (name.length > 200) {
      v.add('checklist_items', `Документ №${index + 1}: назва занадто довга (макс. 200 символів).`);
      return;
    }
    if (name.length > 0) cleaned.push(name);
  });

  return cleaned;
};

/** POST /obligations — ручне (нешаблонне) зобовʼязання: template_id = null. */
const validateCreateObligation = (body) => {
  const v = new Validator();
  const { client_id, name, period_label, due_date, notes, checklist_items } = body || {};

  if (!isUuid(client_id)) v.add('client_id', 'Оберіть клієнта.');

  validateName(v, 'name', name);

  if (!isNonEmptyString(period_label)) {
    v.add('period_label', 'Вкажіть період.');
  } else if (period_label.trim().length > 50) {
    v.add('period_label', 'Підпис періоду занадто довгий (макс. 50 символів).');
  }

  let parsedDue = null;
  if (!isNonEmptyString(due_date)) {
    v.add('due_date', 'Вкажіть дедлайн.');
  } else {
    const m = parseDateOnly(due_date);
    if (!m.isValid()) v.add('due_date', 'Дата має бути коректною у форматі РРРР-ММ-ДД.');
    else parsedDue = m.startOf('day').toDate();
  }

  validateNotes(v, notes);
  const cleanedChecklist = validateChecklistItems(v, checklist_items);

  v.throwIfAny();

  return {
    client_id: client_id.trim(),
    name: name.trim(),
    period_label: period_label.trim(),
    due_date: parsedDue,
    notes: isNonEmptyString(notes) ? notes.trim() : null,
    checklist_items: cleanedChecklist && cleanedChecklist.length > 0 ? cleanedChecklist : undefined,
  };
};

/**
 * PATCH /obligations/:id — ручне редагування. Усі поля опційні, але хоча б одне
 * має бути передане. status тут НЕ змінюється (для нього окремий endpoint).
 */
const validateUpdateObligation = (body) => {
  const v = new Validator();
  const b = body || {};
  const dto = {};

  if (b.name !== undefined) {
    validateName(v, 'name', b.name);
    if (isNonEmptyString(b.name)) dto.name = b.name.trim();
  }

  if (b.due_date !== undefined) {
    if (!isNonEmptyString(b.due_date)) {
      v.add('due_date', 'Вкажіть дедлайн.');
    } else {
      const m = parseDateOnly(b.due_date);
      if (!m.isValid()) v.add('due_date', 'Дата має бути коректною у форматі РРРР-ММ-ДД.');
      else dto.due_date = m.startOf('day').toDate();
    }
  }

  if (b.notes !== undefined) {
    validateNotes(v, b.notes);
    dto.notes = isNonEmptyString(b.notes) ? b.notes.trim() : null;
  }

  if (Object.keys(dto).length === 0 && !v.hasErrors()) {
    v.add('name', 'Не передано жодного поля для оновлення.');
  }

  v.throwIfAny();
  return dto;
};

/**
 * PATCH /obligations/:id/status — зміна статусу.
 * overdue вручну не встановлюється (тільки cron) — тому не приймається.
 */
const validateStatus = (body) => {
  const v = new Validator();
  const status = body && body.status;

  if (!isNonEmptyString(status)) {
    v.add('status', 'Вкажіть статус.');
  } else if (!MANUAL_STATUS_VALUES.includes(status)) {
    v.add('status', `Статус має бути одним із: ${MANUAL_STATUS_VALUES.join(', ')}.`);
  }

  v.throwIfAny();
  return { status };
};

/** ?force=true у query — примусове переведення в submitted при незібраному чеклісті. */
const parseForce = (query) => String((query && query.force) || '') === 'true';

module.exports = {
  STATUS_VALUES,
  MANUAL_STATUS_VALUES,
  URGENCY_VALUES,
  validateObligationId,
  validateListQuery,
  validateCreateObligation,
  validateUpdateObligation,
  validateStatus,
  parseForce,
};
