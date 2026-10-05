// src/hooks/use-clients.js
// Запити домену clients через dataSender (спека §6). Тонка обгортка: логіки axios/помилок тут немає,
// вона живе в data-sender.js. Компоненти самі тримають локальний стан і роблять рефетч після мутацій
// (без глобального кешу тегів — простий рефетч поточного запиту).

'use client';

import { dataSender } from '@/lib/data-sender';

/** Прибирає порожні значення з query, щоб не слати ?search=&type= */
const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export function useClients() {
  const getClients = (params, onSuccess, onError) =>
    dataSender(`/clients${buildQuery(params)}`, 'get', null, (res) => onSuccess?.(res.data.data), onError);

  const getClientById = (id, onSuccess, onError) =>
    dataSender(`/clients/${id}`, 'get', null, (res) => onSuccess?.(res.data.data), onError);

  const createClient = (payload, onSuccess, onError) =>
    dataSender('/clients', 'post', payload, (res) => onSuccess?.(res.data.data), onError);

  const updateClient = (id, payload, onSuccess, onError) =>
    dataSender(`/clients/${id}`, 'patch', payload, (res) => onSuccess?.(res.data.data), onError);

  // DELETE віддає 204 без тіла — onSuccess без даних.
  const archiveClient = (id, onSuccess, onError) =>
    dataSender(`/clients/${id}`, 'delete', null, () => onSuccess?.(), onError);

  const restoreClient = (id, onSuccess, onError) =>
    dataSender(`/clients/${id}/restore`, 'post', null, (res) => onSuccess?.(res.data.data), onError);

  return { getClients, getClientById, createClient, updateClient, archiveClient, restoreClient };
}
