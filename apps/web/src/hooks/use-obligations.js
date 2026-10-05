// src/hooks/use-obligations.js
// Запити домену obligations через dataSender (спека §6). Тонка обгортка: логіки axios/помилок тут
// немає, вона живе в data-sender.js. Компоненти тримають локальний стан і роблять рефетч після мутацій.

'use client';

import { dataSender } from '@/lib/data-sender';

/** Прибирає порожні значення з query, щоб не слати ?client_id=&status= */
const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export function useObligations() {
  /** GET /obligations — { items, total, page, limit }. */
  const getObligations = (params, onSuccess, onError) =>
    dataSender(
      `/obligations${buildQuery(params)}`,
      'get',
      null,
      (res) => onSuccess?.(res.data.data),
      onError,
    );

  /** GET /obligations/:id — зобов'язання + вкладений checklist_items. */
  const getObligationById = (id, onSuccess, onError) =>
    dataSender(`/obligations/${id}`, 'get', null, (res) => onSuccess?.(res.data.data), onError);

  /** POST /obligations — ручне зобов'язання (+ опційний checklist_items: string[]). */
  const createObligation = (payload, onSuccess, onError) =>
    dataSender('/obligations', 'post', payload, (res) => onSuccess?.(res.data.data), onError);

  /** PATCH /obligations/:id — name / due_date / notes. */
  const updateObligation = (id, payload, onSuccess, onError) =>
    dataSender(`/obligations/${id}`, 'patch', payload, (res) => onSuccess?.(res.data.data), onError);

  /**
   * PATCH /obligations/:id/status — pending | collected | submitted.
   * force=true форсує submitted при незібраному чеклісті (інакше 400 CHECKLIST_INCOMPLETE).
   */
  const updateObligationStatus = (id, status, force, onSuccess, onError) =>
    dataSender(
      `/obligations/${id}/status${force ? '?force=true' : ''}`,
      'patch',
      { status },
      (res) => onSuccess?.(res.data.data),
      onError,
    );

  /** DELETE /obligations/:id — 204 без тіла; 409, якщо є історія сповіщень. */
  const deleteObligation = (id, onSuccess, onError) =>
    dataSender(`/obligations/${id}`, 'delete', null, () => onSuccess?.(), onError);

  return {
    getObligations,
    getObligationById,
    createObligation,
    updateObligation,
    updateObligationStatus,
    deleteObligation,
  };
}
