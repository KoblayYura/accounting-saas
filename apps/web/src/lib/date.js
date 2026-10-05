// src/lib/date.js
// Дата-хелпери фронтенду (конвенція ТЗ §6: усе через Moment.js, не нативний Date).
// Використовуються дашбордом і компонентами obligations для форматування дат,
// підрахунку днів до дедлайну та клієнтського кольорового кодування терміновості.

import moment from 'moment';
import 'moment/locale/uk';
import 'moment/locale/en-gb';

// Активна локаль moment встановлюється глобально в LocaleSync (за i18n-локаллю).
// Тут локаль не хардкодимо — формат дат слідує за вибором користувача / geo-IP.

/**
 * Мапінг i18n-локалі → локаль moment.
 *   uk → 'uk'    (перший день тижня — понеділок)
 *   en → 'en-gb' (Велика Британія: перший день тижня — понеділок, британський формат),
 *                а не дефолтна 'en' (США), де тиждень починається з неділі.
 * Перший день тижня в календарі береться саме з локалі moment.
 * @param {'uk'|'en'} locale
 * @returns {string}
 */
export const momentLocaleFor = (locale) => (locale === 'en' ? 'en-gb' : 'uk');

/** Застосувати активну локаль до глобального moment (формат дат + перший день тижня). */
export const applyMomentLocale = (locale) => {
  moment.locale(momentLocaleFor(locale));
};

/**
 * Клієнтський рівень терміновості за дедлайном (палітра з 00-README.md §6).
 * Значення: 'overdue' | 'urgent' | 'soon' | 'this_month' | 'later'.
 * this_month / later — обидва нейтральні за кольором, але розділені для групування
 * у списку (окремі секції «Цей місяць» і «Пізніше»).
 */

/** Формат дати для показу: "20 жовт. 2026". */
export const formatDate = (isoDate) => moment(isoDate).format('D MMM YYYY');

/**
 * Кількість повних днів від сьогодні до дедлайну (порівняння по днях, без часу).
 * Від'ємне — прострочено; 0 — сьогодні; додатне — попереду.
 */
export const daysUntil = (isoDate) =>
  moment(isoDate).startOf('day').diff(moment().startOf('day'), 'days');

/**
 * Клієнтське кольорове кодування (спека frontend.md) + групування у списку:
 *   status=overdue АБО due < today          → overdue (червоний)
 *   днів до дедлайну <= 3                    → urgent (помаранчевий)
 *   днів до дедлайну <= 7                    → soon (жовтий)
 *   до кінця поточного календарного місяця   → this_month (нейтральний)
 *   пізніше                                  → later (нейтральний)
 * submitted/collected трактуємо як звичайні — вони не «горять».
 * @returns {'overdue'|'urgent'|'soon'|'this_month'|'later'}
 */
export const urgencyLevel = (isoDate, isOverdueStatus = false) => {
  if (isOverdueStatus) return 'overdue';
  const days = daysUntil(isoDate);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  // Розділяємо решту на «цей місяць» і «пізніше» за кінцем поточного місяця.
  const endOfMonth = moment().endOf('month');
  return moment(isoDate).isSameOrBefore(endOfMonth, 'day') ? 'this_month' : 'later';
};

// Примітка: людський підпис «залишилось N днів» формується в компонентах через
// i18n-ключі (obligations.relative*), використовуючи daysUntil() — щоб текст був локалізованим.
