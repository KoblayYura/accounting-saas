// src/lib/data-sender.js
// Єдиний axios-хелпер запитів до API (спека §6). Сигнатура:
//   dataSender(url, method, data, onSuccess, onError)
//   - onSuccess(response)      при 2xx
//   - onError(errorPayload, status) при помилці; для 422 Laravel errorPayload = { message, errors }
// Логіка 401 → одноразовий /auth/refresh → повтор оригінального запиту живе ТУТ (не в компонентах).
//
// Доступ до accessToken і оновлення його — через реєстр колбеків, які AuthProvider налаштовує
// при монтуванні (setAuthAccessors). Так уникаємо циклічної залежності context ↔ data-sender.

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true, // httpOnly refresh-cookie надсилається браузером
});

// --- Реєстр доступу до токена (налаштовує AuthProvider) ---
let getAccessToken = () => null;
let onTokenRefreshed = () => {};
let onAuthFailed = () => {};

export function setAuthAccessors({ getToken, onRefreshed, onFailed }) {
  if (getToken) getAccessToken = getToken;
  if (onRefreshed) onTokenRefreshed = onRefreshed;
  if (onFailed) onAuthFailed = onFailed;
}

// Bearer-заголовок з поточним access-токеном.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Спроба одноразового refresh; повертає новий accessToken або null. */
const tryRefresh = async () => {
  try {
    const res = await api.post('/auth/refresh');
    const token = res?.data?.data?.accessToken ?? null;
    const user = res?.data?.data?.user ?? null;
    if (token) onTokenRefreshed(token, user);
    return token;
  } catch {
    return null;
  }
};

/**
 * Головний хелпер. Не кидає — усе через колбеки.
 * @param {string} url — шлях від /api/v1 (напр. '/auth/login')
 * @param {string} method — 'get' | 'post' | 'patch' | 'delete' ...
 * @param {object|null} data — тіло запиту
 * @param {(response:any)=>void} [onSuccess]
 * @param {(errorPayload:any, status:number)=>void} [onError]
 */
export const dataSender = async (url, method = 'get', data = null, onSuccess, onError) => {
  const doRequest = () => api.request({ url, method, data });

  try {
    const response = await doRequest();
    onSuccess?.(response);
    return response;
  } catch (err) {
    const status = err?.response?.status;

    // 401 → одноразовий refresh → повтор оригінального запиту.
    if (status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
      const newToken = await tryRefresh();
      if (newToken) {
        try {
          const retry = await doRequest();
          onSuccess?.(retry);
          return retry;
        } catch (retryErr) {
          onError?.(retryErr?.response?.data, retryErr?.response?.status);
          return;
        }
      }
      // refresh не вдався — сесія недійсна.
      onAuthFailed();
    }

    onError?.(err?.response?.data, status);
  }
};

export { api };
