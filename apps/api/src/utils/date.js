// src/utils/date.js
// Чиста логіка обчислення періодів звітності, дедлайнів (due_date) і людських
// підписів періоду (period_label) для ObligationGeneratorService (Module 03).
//
// Конвенція проєкту (00-README.md §5): уся робота з датами — через Moment.js,
// не через нативний Date. Україномовні підписи — через локаль moment/locale/uk.
//
// Тут НЕМАЄ доступу до БД — лише детерміновані функції над датами, щоб їх
// можна було покрити unit-тестами (tests/unit/obligation-generator.test.js).
//
// Домовленості:
//  - Рахуємо в UTC (moment.utc), щоб уникнути зсувів через часовий пояс сервера.
//    due_date у БД — календарний день (Prisma DateTime), час = 00:00:00.000Z.
//  - Публічний API (periodContaining, currentAndNextPeriods, computeDueDate)
//    приймає/повертає нативні Date на межах — зручно для Prisma; всередині — moment.

const moment = require('moment');
require('moment/locale/uk');

/**
 * @typedef {Object} Period
 * @property {Date} start — перший день періоду (UTC, 00:00)
 * @property {Date} end   — останній день періоду (UTC, 00:00), база для розрахунку дедлайну
 * @property {string} label — людський підпис: "Вересень 2026" / "Q3 2026" / "2026"
 */

/** moment у UTC, нормалізований на початок дня (час обнулено). */
const utcDay = (input) => moment.utc(input).startOf('day');

/** Робить першу літеру великою ("вересень 2026" → "Вересень 2026"). */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Кількість днів у місяці для moment-дати. */
const daysInMonth = (m) => m.daysInMonth();

// ==================== Побудова періоду за типом ====================

/** Підпис періоду за типом (moment уже у UTC). */
const periodLabel = (periodicity, m) => {
  switch (periodicity) {
    case 'monthly':
      // Локаль uk: "вересень 2026" → капіталізуємо першу літеру.
      return capitalize(m.clone().locale('uk').format('MMMM YYYY'));
    case 'quarterly':
      return `Q${m.quarter()} ${m.year()}`;
    case 'annual':
      return `${m.year()}`;
    default:
      return m.format('YYYY-MM-DD');
  }
};

/** moment-одиниця для startOf/endOf за типом періоду. */
const unitOf = (periodicity) => {
  switch (periodicity) {
    case 'monthly':
      return 'month';
    case 'quarterly':
      return 'quarter';
    case 'annual':
      return 'year';
    default:
      return 'month';
  }
};

/**
 * Період заданого типу, що містить дату `d` (за замовчуванням — зараз).
 * @param {'monthly'|'quarterly'|'annual'} periodicity
 * @param {Date|import('moment').Moment} [d]
 * @returns {Period}
 */
const periodContaining = (periodicity, d) => {
  const m = utcDay(d);
  const unit = unitOf(periodicity);
  return {
    start: m.clone().startOf(unit).toDate(),
    end: m.clone().endOf(unit).startOf('day').toDate(),
    label: periodLabel(periodicity, m),
  };
};

/**
 * Поточний і наступний періоди заданого типу відносно дати `now`.
 * Для annual повертає лише поточний рік (спека: annual → поточний рік).
 * @returns {Period[]}
 */
const currentAndNextPeriods = (periodicity, now) => {
  const current = periodContaining(periodicity, now);
  if (periodicity === 'annual') return [current];
  // Наступний період = перший день після кінця поточного.
  const nextStart = moment.utc(current.end).add(1, 'day');
  return [current, periodContaining(periodicity, nextStart)];
};

// ==================== Розрахунок дедлайну ====================

/**
 * due_date = кінець періоду + `deadlineMonthOffset` місяців, день = `deadlineDay`.
 * Якщо `deadlineDay` більший за кількість днів у цільовому місяці — беремо
 * останній день місяця (спека). moment.add('months') сам коректно нормалізує рік.
 * @param {Period} period
 * @returns {Date}
 */
const computeDueDate = (period, deadlineDay, deadlineMonthOffset) => {
  // Стаємо на 1-ше число цільового місяця, щоб add(months) не «переповнив» день.
  const target = moment.utc(period.end).startOf('month').add(deadlineMonthOffset, 'months');

  const clampedDay = Math.min(deadlineDay, target.daysInMonth());
  return target.date(clampedDay).startOf('day').toDate();
};

module.exports = {
  daysInMonth,
  periodContaining,
  currentAndNextPeriods,
  computeDueDate,
};
