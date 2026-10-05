// src/hooks/use-billing.js
// Запити домену billing через dataSender. Реалізовано частково (Module 06):
// лише перелік тарифів і поточна підписка — потрібні для банера ліміту клієнтів.

'use client';

import { dataSender } from '@/lib/data-sender';

export function useBilling() {
  /** Публічний перелік тарифів (без авторизації). */
  const getPlans = (onSuccess, onError) =>
    dataSender('/billing/plans', 'get', null, (res) => onSuccess?.(res.data.data), onError);

  /** Поточна підписка + used_clients — джерело "X з Y" для ClientLimitBanner. */
  const getSubscription = (onSuccess, onError) =>
    dataSender('/billing/subscription', 'get', null, (res) => onSuccess?.(res.data.data), onError);

  return { getPlans, getSubscription };
}
