// src/modules/obligations/obligations.cron.js
// Планові задачі Module 03 (node-cron). Реєструються один раз при старті (index).
//
// Функції runMonthlyGeneration / markOverdueObligations експортуються окремо —
// щоб їх можна було викликати вручну (адмін-скрипт) чи покрити тестами,
// не залежачи від планувальника.

const cron = require('node-cron');
const moment = require('moment');
const { prisma } = require('../../db');
const { generateForClient } = require('./obligation-generator.service');

/**
 * Нічна генерація: для кожного активного клієнта забезпечити наявність
 * зобов'язань на найближчі 2 періоди наперед (спека — щодня о 03:00).
 * Помилка по одному клієнту не має зупиняти решту.
 */
const runMonthlyGeneration = async () => {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const client of clients) {
    try {
      await generateForClient(client.id);
    } catch (err) {
      console.error(`[cron:generation] Помилка генерації для клієнта ${client.id}:`, err);
    }
  }
};

/**
 * Позначення прострочених: pending із due_date < сьогодні → overdue.
 * Спека — щодня о 00:05. Порівняння за початком поточного дня (UTC).
 */
const markOverdueObligations = async () => {
  const startOfToday = moment.utc().startOf('day').toDate();

  const result = await prisma.obligation.updateMany({
    where: { status: 'pending', dueDate: { lt: startOfToday } },
    data: { status: 'overdue' },
  });

  if (result.count > 0) {
    console.log(`[cron:overdue] Позначено прострочених зобовʼязань: ${result.count}`);
  }
};

/**
 * Реєструє cron-задачі. Викликається один раз при старті сервера (index).
 * Timezone фіксуємо UTC, щоб збігалося з UTC-логікою дат у модулі.
 */
const registerObligationCrons = () => {
  // Щодня о 00:05 — позначити прострочені.
  cron.schedule(
    '5 0 * * *',
    () => {
      markOverdueObligations().catch((err) =>
        console.error('[cron:overdue] Необроблена помилка:', err),
      );
    },
    { timezone: 'UTC' },
  );

  // Щодня о 03:00 — згенерувати зобов'язання наперед.
  cron.schedule(
    '0 3 * * *',
    () => {
      runMonthlyGeneration().catch((err) =>
        console.error('[cron:generation] Необроблена помилка:', err),
      );
    },
    { timezone: 'UTC' },
  );

  console.log('[cron] Obligation cron jobs registered (overdue 00:05, generation 03:00 UTC)');
};

module.exports = { runMonthlyGeneration, markOverdueObligations, registerObligationCrons };
