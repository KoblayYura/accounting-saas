// src/modules/clients/clients.service.js
// Бізнес-логіка clients-модуля + доступ до даних через Prisma (db.js).
// Контролер викликає лише ці функції, з Prisma напряму не працює.
//
// Ключова інваріанта модуля: КОЖЕН запит фільтрується за accountantId.
// Клієнт іншого бухгалтера має бути невидимим навіть при відомому id → 404, не 403.

const { prisma } = require('../../db');
const { AppError } = require('../../utils/api-response');

// ==================== monthly_fee: рольовий доступ ====================
// Спека module-02-clients/backend.md (доповнення 2026-07-18):
//   - задати можна при створенні (будь-яка роль);
//   - змінити через PATCH — лише head_accountant (для accountant поле МОВЧКИ ігнорується);
//   - у відповідях присутнє лише для head_accountant (виключаємо на рівні сервісу, не на фронті).
// Роль читаємо з БД (не з JWT) — щоб зміна ролі підхоплювалась одразу, як у require-role.js.

const FEE_VISIBLE_ROLES = ['head_accountant', 'super_admin'];

const getAccountantRole = async (accountantId) => {
  const accountant = await prisma.accountant.findUnique({
    where: { id: accountantId },
    select: { role: true },
  });
  return accountant?.role ?? null;
};

const canSeeMonthlyFee = (role) => FEE_VISIBLE_ROLES.includes(role);

// ==================== DTO ====================

/**
 * Публічне представлення клієнта (snake_case — контракт API зі спеки БД).
 * monthly_fee включається лише якщо includeFee=true (head_accountant).
 * Prisma Decimal → Number, щоб JSON не віддавав об'єкт Decimal.
 */
const toClientDto = (c, includeFee) => {
  const dto = {
    id: c.id,
    name: c.name,
    edrpou_or_inn: c.edrpouOrInn,
    client_type: c.clientType,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    is_active: c.isActive,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
  if (includeFee) {
    dto.monthly_fee = c.monthlyFee === null || c.monthlyFee === undefined ? null : Number(c.monthlyFee);
  }
  return dto;
};

// ==================== Спільні хелпери ====================

const notFound = () => new AppError('NOT_FOUND', 'Клієнта не знайдено', 404);

/**
 * Знаходить клієнта в межах поточного бухгалтера або кидає 404.
 * findFirst (не findUnique) — бо фільтруємо одразу і за id, і за accountantId.
 */
const findOwnedClientOrThrow = async (accountantId, clientId) => {
  const client = await prisma.client.findFirst({ where: { id: clientId, accountantId } });
  if (!client) throw notFound();
  return client;
};

/** Мапить вхідні snake_case-поля DTO у camelCase-поля Prisma. Пропускає undefined. */
const toPrismaData = (input) => ({
  ...(input.name !== undefined ? { name: input.name } : {}),
  ...(input.edrpou_or_inn !== undefined ? { edrpouOrInn: input.edrpou_or_inn } : {}),
  ...(input.client_type !== undefined ? { clientType: input.client_type } : {}),
  ...(input.phone !== undefined ? { phone: input.phone } : {}),
  ...(input.email !== undefined ? { email: input.email } : {}),
  ...(input.notes !== undefined ? { notes: input.notes } : {}),
  ...(input.monthly_fee !== undefined ? { monthlyFee: input.monthly_fee } : {}),
});

/** Перемикає is_active. Спільна основа для archive/restore (DRY). */
const setActiveFlag = async (accountantId, clientId, isActive) => {
  await findOwnedClientOrThrow(accountantId, clientId);
  const updated = await prisma.client.update({ where: { id: clientId }, data: { isActive } });
  const role = await getAccountantRole(accountantId);
  return toClientDto(updated, canSeeMonthlyFee(role));
};

// ==================== Публічні операції ====================

/** Кількість активних клієнтів — використовує check-client-limit middleware і billing. */
const countActiveClients = (accountantId) =>
  prisma.client.count({ where: { accountantId, isActive: true } });

const listClients = async (accountantId, query) => {
  const { search, type, is_active, page, limit, sort } = query;

  const where = {
    accountantId, // ізоляція орендаря — ніколи не прибирати
    isActive: is_active,
    ...(type ? { clientType: type } : {}),
    ...(search
      ? {
          // ILIKE (case-insensitive) по назві та коду — спека.
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { edrpouOrInn: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const orderBy = sort === 'created_at' ? { createdAt: 'desc' } : { name: 'asc' };

  const [items, total, role] = await Promise.all([
    prisma.client.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.client.count({ where }),
    getAccountantRole(accountantId),
  ]);

  const includeFee = canSeeMonthlyFee(role);
  return { items: items.map((c) => toClientDto(c, includeFee)), total, page, limit };
};

const getClientById = async (accountantId, clientId) => {
  const client = await findOwnedClientOrThrow(accountantId, clientId);

  // Агрегат по зобовʼязаннях (Module 03).
  const [activeCount, overdueCount, role] = await Promise.all([
    prisma.obligation.count({ where: { clientId, status: { in: ['pending', 'collected'] } } }),
    prisma.obligation.count({ where: { clientId, status: 'overdue' } }),
    getAccountantRole(accountantId),
  ]);

  return {
    ...toClientDto(client, canSeeMonthlyFee(role)),
    active_obligations_count: activeCount,
    overdue_obligations_count: overdueCount,
  };
};

const createClient = async (accountantId, input) => {
  const client = await prisma.client.create({
    data: {
      accountantId,
      name: input.name,
      edrpouOrInn: input.edrpou_or_inn ?? null,
      clientType: input.client_type,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      // monthly_fee можна задати при створенні будь-якою роллю (спека).
      monthlyFee: input.monthly_fee ?? null,
    },
  });

  // Генерація зобовʼязань на поточний і наступний період за шаблонами obligation_templates
  // (Module 03). Створення клієнта НЕ має падати, якщо генерація зафейлилась.
  try {
    // require усередині функції: Module 03 ще на .ts, лінивий імпорт уникає
    // проблем із порядком завантаження модулів. Прибрати після міграції Module 03.
    const { generateForClient } = require('../obligations/obligation-generator.service');
    await generateForClient(client.id);
  } catch (err) {
    console.error(`[clients] Помилка генерації зобовʼязань для клієнта ${client.id}:`, err);
  }

  const role = await getAccountantRole(accountantId);
  return toClientDto(client, canSeeMonthlyFee(role));
};

/**
 * Часткове оновлення. Зміна client_type — свідомо НЕ перегенеровує наявні
 * зобовʼязання (спека): старі лишаються, нові підуть з наступного циклу генерації.
 *
 * monthly_fee: якщо роль не head_accountant — поле МОВЧКИ відкидається (не 422),
 * як інші недозволені для ролі зміни (спека).
 */
const updateClient = async (accountantId, clientId, input) => {
  await findOwnedClientOrThrow(accountantId, clientId);

  const role = await getAccountantRole(accountantId);
  const includeFee = canSeeMonthlyFee(role);

  const data = { ...input };
  if (data.monthly_fee !== undefined && !includeFee) {
    delete data.monthly_fee; // мовчки ігноруємо для звичайного accountant
  }

  // Могло лишитись порожньо, якщо єдиним полем був заборонений monthly_fee.
  if (Object.keys(data).length === 0) {
    const current = await findOwnedClientOrThrow(accountantId, clientId);
    return toClientDto(current, includeFee);
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: toPrismaData(data),
  });
  return toClientDto(updated, includeFee);
};

/**
 * Soft-delete: is_active = false. Фізично нічого не видаляється —
 * історія зобовʼязань зберігається.
 *
 * Рішення щодо повʼязаних obligations (спека дозволяє на вибір):
 * НЕ чіпаємо жодного зобовʼязання, зокрема pending. Причина — клієнта можна
 * відновити через /restore, і втрачені pending-зобовʼязання довелося б
 * генерувати заново. Прострочені/подані лишаються як історія в будь-якому разі.
 */
const archiveClient = (accountantId, clientId) => setActiveFlag(accountantId, clientId, false);

/** Відновлення випадково архівованого клієнта. */
const restoreClient = (accountantId, clientId) => setActiveFlag(accountantId, clientId, true);

module.exports = {
  countActiveClients,
  listClients,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  canSeeMonthlyFee,
  getAccountantRole,
};
