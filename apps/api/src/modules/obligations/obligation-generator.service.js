// src/modules/obligations/obligation-generator.service.js
// ObligationGeneratorService — ключовий бізнес-компонент Module 03.
// Генерує зобов'язання (дедлайни) для клієнта на поточний і наступний період
// за типовими шаблонами obligation_templates, і одразу створює чекліст документів.
//
// НЕ імпортує clients.service (щоб уникнути циклу clients ↔ obligations):
// клієнта дістає напряму через Prisma.

const { prisma } = require('../../db');
const { computeDueDate, currentAndNextPeriods } = require('../../utils/date');

/**
 * Створює checklist_items для щойно згенерованого obligation з шаблону.
 * Викликається ТІЛЬКИ при створенні нового obligation (не при повторному upsert),
 * щоб не плодити дублі документів і не затирати вже зібрані позначки.
 */
const createChecklistItemsForObligation = async (obligationId, templateId) => {
  const docTemplates = await prisma.checklistTemplate.findMany({
    where: { obligationTemplateId: templateId },
    orderBy: { sortOrder: 'asc' },
  });

  if (docTemplates.length === 0) return;

  await prisma.checklistItem.createMany({
    data: docTemplates.map((t) => ({
      obligationId,
      docName: t.docName,
      sortOrder: t.sortOrder,
    })),
  });
};

/**
 * Створює (або пропускає, якщо вже є) одне зобов'язання для клієнта за шаблоном і періодом.
 * Ідемпотентність — через unique-ключ (client_id, template_id, period_label):
 * якщо запис уже існує, повторний виклик його НЕ чіпає (ручні правки due_date/notes
 * не затираються, чекліст не дублюється).
 *
 * @returns {Promise<object|null>} створений Obligation або null, якщо вже існував.
 */
const upsertObligationForPeriod = async (clientId, template, period) => {
  const existing = await prisma.obligation.findUnique({
    where: {
      clientId_templateId_periodLabel: {
        clientId,
        templateId: template.id,
        periodLabel: period.label,
      },
    },
  });

  if (existing) return null;

  const dueDate = computeDueDate(period, template.deadlineDay, template.deadlineMonthOffset);

  const created = await prisma.obligation.create({
    data: {
      clientId,
      templateId: template.id,
      name: template.name,
      periodLabel: period.label,
      dueDate,
      // status за замовчуванням pending (schema.prisma).
    },
  });

  await createChecklistItemsForObligation(created.id, template.id);
  return created;
};

/**
 * Генерує релевантні зобов'язання для клієнта на поточний і наступний період.
 *
 * Кроки (спека Module 03):
 *  1. Взяти client.client_type.
 *  2. Знайти активні шаблони цього типу.
 *  3. Для кожного шаблону — поточний і наступний період (annual → лише поточний).
 *  4. Обчислити due_date, upsert без дублів, за потреби створити чекліст.
 *
 * @param {string} clientId
 * @param {Date} [now] — «поточний момент» (за замовчуванням тепер); параметр для тестів.
 * @returns {Promise<object[]>} масив реально СТВОРЕНИХ зобов'язань (наявні пропускаються).
 */
const generateForClient = async (clientId, now) => {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return [];

  const templates = await prisma.obligationTemplate.findMany({
    where: { clientType: client.clientType, isActive: true },
  });

  const created = [];

  for (const template of templates) {
    const periods = currentAndNextPeriods(template.periodicity, now);
    for (const period of periods) {
      const obligation = await upsertObligationForPeriod(clientId, template, period);
      if (obligation) created.push(obligation);
    }
  }

  return created;
};

module.exports = { generateForClient };
