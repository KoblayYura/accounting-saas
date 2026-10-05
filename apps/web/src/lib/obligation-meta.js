// src/lib/obligation-meta.js
// Єдине джерело правди про візуалізацію зобов'язань на фронті:
//   - i18n-ключі підписів + Bootstrap-варіанти статусів (StatusBadge, StatusSelect);
//   - i18n-ключі підписів + варіанти рівнів терміновості (UrgencyBadge);
//   - тон усього рядка/картки за станом (rowVariant).
// Підписи локалізуються в компонентах через useTranslations('obligations').
// Тут — лише КЛЮЧІ та Bootstrap-варіанти, щоб не дублювати по компонентах (DRY).

import { urgencyLevel } from '@/lib/date';

/**
 * Статуси зобов'язання: i18n-ключ + варіант React Bootstrap Badge (bg="...").
 * labelKey — ключ у секції obligations.*
 */
export const OBLIGATION_STATUS = {
  pending: { labelKey: 'statusPending', bg: 'secondary' },
  collected: { labelKey: 'statusCollected', bg: 'info' },
  submitted: { labelKey: 'statusSubmitted', bg: 'success' },
  overdue: { labelKey: 'statusOverdue', bg: 'danger' },
};

/** Статуси, доступні для ручного вибору (без overdue — його ставить лише cron). */
export const MANUAL_STATUSES = ['pending', 'collected', 'submitted'];

/**
 * Рівні терміновості: i18n-ключ + варіант бейджа (палітра 00-README.md §6).
 * this_month і later — обидва нейтральні, розрізняються лише підписом.
 */
export const URGENCY_META = {
  overdue: { labelKey: 'urgencyOverdue', bg: 'danger' },
  urgent: { labelKey: 'urgencyUrgent', bg: 'warning' },
  soon: { labelKey: 'urgencySoon', bg: 'warning' },
  this_month: { labelKey: 'urgencyThisMonth', bg: 'secondary' },
  later: { labelKey: 'urgencyLater', bg: 'secondary' },
};

/**
 * Тон усього блоку-рядка зобов'язання — Bootstrap-класи (bg-*-subtle + border-*).
 * Пріоритет:
 *   1. submitted → зелений приглушений (подано, завершено).
 *   2. collected → зелений (документи зібрані).
 *   3. overdue   → червоний.
 *   4. urgent (≤3 дні) → помаранчевий (warning).
 *   5. soon (≤7 днів)  → жовтий (warning приглушений).
 *   6. решта → нейтральний.
 * @param {{status: string, due_date: string}} obligation
 * @returns {string} Bootstrap-класи для className картки/рядка
 */
export const rowVariantClass = (obligation) => {
  if (obligation.status === 'submitted') return 'bg-success-subtle border-success-subtle';
  if (obligation.status === 'collected') return 'bg-success-subtle border-success';

  const level = urgencyLevel(obligation.due_date, obligation.status === 'overdue');
  switch (level) {
    case 'overdue':
      return 'bg-danger-subtle border-danger';
    case 'urgent':
      return 'bg-warning-subtle border-warning';
    case 'soon':
      return 'bg-warning-subtle border-warning-subtle';
    default:
      return 'bg-white border-light-subtle';
  }
};
