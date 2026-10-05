// prisma/seed.js
// Заповнення довідника obligation_templates та checklist_templates orієнтовними
// даними для розробки/тестування Module 03.
//
// ⚠️ TODO: verify with accountant before production.
// Значення дедлайнів і періодичності — юридичні терміни звітності. Перед
// продакшн-релізом ОБОВ'ЯЗКОВО звірити з практикуючим бухгалтером / сайтом ДПС.
// Тут — лише правдоподібні значення, щоб генератор і UI мали з чим працювати.
//
// Ідемпотентність: safeReset видаляє лише ті шаблони, на які ще не посилаються
// реальні obligations, і наповнює заново — повторний запуск не плодить дублів
// і не осиротює дані клієнтів.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Джерело значень — orієнтовна таблиця зі спеки Module 03 (backend.md).
 * ⚠️ verify with accountant before production.
 * @type {Array<{clientTypes: string[], name: string, periodicity: string,
 *   deadlineDay: number, deadlineMonthOffset: number, description?: string, checklist?: string[]}>}
 */
const TEMPLATES = [
  {
    clientTypes: ['fop_group_1', 'fop_group_2'],
    name: 'Єдиний податок',
    periodicity: 'monthly',
    deadlineDay: 20,
    deadlineMonthOffset: 1,
    description: 'Сплата єдиного податку (ФОП груп 1–2).',
    checklist: ['Квитанція про сплату ЄП'],
  },
  {
    clientTypes: ['fop_group_1', 'fop_group_2', 'fop_group_3'],
    name: 'ЄСВ',
    periodicity: 'quarterly',
    deadlineDay: 20,
    deadlineMonthOffset: 1,
    description: 'Єдиний соціальний внесок (ФОП усіх груп).',
    checklist: ['Квитанція про сплату ЄСВ'],
  },
  {
    clientTypes: ['fop_group_3'],
    name: 'Єдиний податок (декларація)',
    periodicity: 'quarterly',
    deadlineDay: 9,
    deadlineMonthOffset: 1,
    description: 'Квартальна декларація платника єдиного податку (ФОП група 3).',
    checklist: ['Декларація платника ЄП', 'Книга обліку доходів'],
  },
  {
    clientTypes: ['tov'],
    name: 'Податок на прибуток',
    periodicity: 'quarterly',
    // ⚠️ TODO: verify with accountant. У ТЗ вказано «фактично ~40 днів після
    // кінця кварталу». deadlineDay — число місяця (не може бути 40), тому 40 днів
    // моделюємо як offset=1 міс. + день 9 (≈ кінець кварталу + 40 днів). Уточнити правило.
    deadlineDay: 9,
    deadlineMonthOffset: 1,
    description: 'Квартальна декларація з податку на прибуток (ТОВ). ⚠️ уточнити точний термін.',
    checklist: ['Декларація з податку на прибуток', 'Фінансова звітність'],
  },
  {
    clientTypes: ['tov'],
    name: 'ПДВ (якщо платник)',
    periodicity: 'monthly',
    deadlineDay: 20,
    deadlineMonthOffset: 1,
    description: 'Місячна декларація з ПДВ (для платників ПДВ).',
    checklist: ['Декларація з ПДВ', 'Реєстр отриманих та виданих податкових накладних'],
  },
];

/**
 * Безпечне очищення: видаляємо тільки ті шаблони, на які НЕ посилаються
 * реальні obligations (щоб не порушити FK і не осиротити дані клієнтів).
 * checklist_templates видаляються каскадно разом зі своїм шаблоном.
 */
const safeReset = async () => {
  const referencedTemplateIds = await prisma.obligation.findMany({
    where: { templateId: { not: null } },
    select: { templateId: true },
    distinct: ['templateId'],
  });
  const referenced = new Set(
    referencedTemplateIds.map((o) => o.templateId).filter((id) => id !== null),
  );

  const allTemplates = await prisma.obligationTemplate.findMany({ select: { id: true } });
  const deletable = allTemplates.map((t) => t.id).filter((id) => !referenced.has(id));

  // checklist_templates підуть каскадом (onDelete: Cascade у схемі).
  await prisma.obligationTemplate.deleteMany({ where: { id: { in: deletable } } });

  if (referenced.size > 0) {
    console.warn(
      `[seed] ${referenced.size} шаблон(и) залишено — на них уже посилаються зобов'язання. ` +
        'Нові шаблони буде додано поряд (можливі дублікати назв — почистити вручну за потреби).',
    );
  }
};

const main = async () => {
  await safeReset();

  for (const tpl of TEMPLATES) {
    // Один запис шаблону на КОЖЕН тип клієнта (client_type — скалярне поле, не масив).
    for (const clientType of tpl.clientTypes) {
      await prisma.obligationTemplate.create({
        data: {
          clientType,
          name: tpl.name,
          periodicity: tpl.periodicity,
          deadlineDay: tpl.deadlineDay,
          deadlineMonthOffset: tpl.deadlineMonthOffset,
          description: tpl.description || null,
          checklistTemplates: tpl.checklist
            ? {
                create: tpl.checklist.map((docName, index) => ({ docName, sortOrder: index })),
              }
            : undefined,
        },
      });
    }
  }

  const count = await prisma.obligationTemplate.count();
  console.log(`[seed] obligation_templates у базі: ${count}`);
  console.log('[seed] ⚠️ Значення дедлайнів orієнтовні — verify with accountant before production.');
};

main()
  .catch((err) => {
    console.error('[seed] Помилка:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
