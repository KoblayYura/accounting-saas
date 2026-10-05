// src/modules/obligations/obligations.service.js
// Бізнес-логіка obligations-модуля + доступ до даних через Prisma (db.js).
// Контролер викликає лише ці функції, з Prisma напряму не працює.
//
// Ключова інваріанта модуля (як у clients): КОЖЕН запит ізолюється за accountantId.
// В obligations немає accountant_id напряму — ізоляція через зв'язок client:
//   where: { client: { accountantId } }.
// Зобов'язання іншого бухгалтера має бути невидимим навіть за відомим id → 404.

const moment = require('moment');
const { prisma } = require('../../db');
const { AppError } = require('../../utils/api-response');

// ==================== DTO ====================

/** Публічне представлення зобов'язання (snake_case — контракт API). */
const toObligationDto = (o) => ({
  id: o.id,
  client_id: o.clientId,
  client_name: o.client ? o.client.name : null,
  template_id: o.templateId,
  name: o.name,
  period_label: o.periodLabel,
  due_date: o.dueDate,
  status: o.status,
  notes: o.notes,
  created_at: o.createdAt,
  updated_at: o.updatedAt,
});

/** Елемент чекліста (snake_case). */
const toChecklistItemDto = (c) => ({
  id: c.id,
  doc_name: c.docName,
  is_collected: c.isCollected,
  sort_order: c.sortOrder,
});

// ==================== Спільні хелпери ====================

const notFound = () => new AppError('NOT_FOUND', 'Зобовʼязання не знайдено', 404);

/**
 * Знаходить зобов'язання в межах поточного бухгалтера або кидає 404.
 * Ізоляція — через client.accountantId (findFirst, бо фільтруємо і за id, і за власником).
 */
const findOwnedObligationOrThrow = async (accountantId, obligationId) => {
  const obligation = await prisma.obligation.findFirst({
    where: { id: obligationId, client: { accountantId } },
    include: { client: { select: { name: true } } },
  });
  if (!obligation) throw notFound();
  return obligation;
};

/**
 * Будує фрагмент where для обчислюваного фільтра urgency відносно `now`.
 * urgency — не поле в БД, а діапазон по due_date (усе через moment, UTC).
 *   overdue    — due_date < початок сьогодні
 *   this_week  — сьогодні .. +7 днів
 *   this_month — сьогодні .. кінець поточного місяця
 *   later      — після поточного місяця
 */
const urgencyWhere = (urgency, now = moment.utc()) => {
  const startOfToday = now.clone().startOf('day').toDate();

  switch (urgency) {
    case 'overdue':
      return { dueDate: { lt: startOfToday } };
    case 'this_week':
      return {
        dueDate: {
          gte: startOfToday,
          lte: now.clone().add(7, 'days').endOf('day').toDate(),
        },
      };
    case 'this_month':
      return {
        dueDate: {
          gte: startOfToday,
          lte: now.clone().endOf('month').toDate(),
        },
      };
    case 'later':
      return { dueDate: { gt: now.clone().endOf('month').toDate() } };
    default:
      return {};
  }
};

// ==================== Публічні операції ====================

/**
 * Список зобов'язань поточного бухгалтера з фільтрами й пагінацією.
 * Сортування за замовчуванням — due_date ASC (спека). client_name — з JOIN.
 */
const listObligations = async (accountantId, query) => {
  const { client_id, status, urgency, page, limit } = query;

  const where = {
    client: { accountantId }, // ізоляція орендаря — ніколи не прибирати
    ...(client_id ? { clientId: client_id } : {}),
    ...(status ? { status } : {}),
    ...(urgency ? urgencyWhere(urgency) : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.obligation.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { client: { select: { name: true } } },
    }),
    prisma.obligation.count({ where }),
  ]);

  return { items: items.map(toObligationDto), total, page, limit };
};

/** Повний об'єкт зобов'язання + вкладений чекліст, відсортований за sort_order. */
const getObligationById = async (accountantId, obligationId) => {
  const obligation = await findOwnedObligationOrThrow(accountantId, obligationId);

  const checklistItems = await prisma.checklistItem.findMany({
    where: { obligationId },
    orderBy: { sortOrder: 'asc' },
  });

  return {
    ...toObligationDto(obligation),
    checklist_items: checklistItems.map(toChecklistItemDto),
  };
};

/**
 * Ручне створення нетипового зобов'язання (template_id = null).
 * Клієнт має належати поточному бухгалтеру — інакше 404 (не даємо створювати чужому).
 * Опційний чекліст документів створюється разом (nested create).
 */
const createManualObligation = async (accountantId, input) => {
  const client = await prisma.client.findFirst({
    where: { id: input.client_id, accountantId },
    select: { id: true },
  });
  if (!client) throw new AppError('NOT_FOUND', 'Клієнта не знайдено', 404);

  const created = await prisma.obligation.create({
    data: {
      clientId: input.client_id,
      templateId: null,
      name: input.name,
      periodLabel: input.period_label,
      dueDate: input.due_date,
      notes: input.notes || null,
      // sortOrder = позиція у введеному списку. Порожні рядки вже відфільтровані валідацією.
      ...(input.checklist_items && input.checklist_items.length > 0
        ? {
            checklistItems: {
              create: input.checklist_items.map((docName, index) => ({
                docName,
                sortOrder: index,
              })),
            },
          }
        : {}),
    },
    include: { client: { select: { name: true } } },
  });

  return toObligationDto(created);
};

/** Мапить вхідні snake_case-поля у camelCase Prisma. Пропускає undefined. */
const toUpdateData = (input) => ({
  ...(input.name !== undefined ? { name: input.name } : {}),
  ...(input.due_date !== undefined ? { dueDate: input.due_date } : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
});

/**
 * Ручне редагування due_date / notes / name (напр. бухгалтер знає точнішу дату).
 * status тут не змінюється — для нього окремий endpoint.
 */
const updateObligation = async (accountantId, obligationId, input) => {
  await findOwnedObligationOrThrow(accountantId, obligationId);
  const updated = await prisma.obligation.update({
    where: { id: obligationId },
    data: toUpdateData(input),
    include: { client: { select: { name: true } } },
  });
  return toObligationDto(updated);
};

/**
 * Зміна статусу (pending | collected | submitted; overdue — тільки cron).
 * Правило спеки: не можна ставити `submitted`, якщо не всі checklist_items зібрані,
 * АЛЕ дозволяється форсувати через force=true (бухгалтер знає краще за систему).
 */
const updateObligationStatus = async (accountantId, obligationId, input, force) => {
  await findOwnedObligationOrThrow(accountantId, obligationId);

  if (input.status === 'submitted' && !force) {
    const pendingDocs = await prisma.checklistItem.count({
      where: { obligationId, isCollected: false },
    });
    if (pendingDocs > 0) {
      throw new AppError(
        'CHECKLIST_INCOMPLETE',
        'Не всі документи зібрано. Додайте ?force=true, щоб подати попри це.',
        400,
      );
    }
  }

  const updated = await prisma.obligation.update({
    where: { id: obligationId },
    data: { status: input.status },
    include: { client: { select: { name: true } } },
  });
  return toObligationDto(updated);
};

/**
 * Hard delete. Дозволений тільки якщо немає пов'язаних notifications_log
 * (щоб не губити історію сповіщень) — інакше 409. checklist_items видаляються
 * каскадом (onDelete: Cascade у схемі).
 */
const removeObligation = async (accountantId, obligationId) => {
  await findOwnedObligationOrThrow(accountantId, obligationId);

  const notificationsCount = await prisma.notificationLog.count({ where: { obligationId } });
  if (notificationsCount > 0) {
    throw new AppError(
      'HAS_NOTIFICATIONS',
      'Зобовʼязання має історію сповіщень і не може бути видалене',
      409,
    );
  }

  await prisma.obligation.delete({ where: { id: obligationId } });
};

module.exports = {
  listObligations,
  getObligationById,
  createManualObligation,
  updateObligation,
  updateObligationStatus,
  removeObligation,
};
