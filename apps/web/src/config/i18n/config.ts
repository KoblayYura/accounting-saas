// src/config/i18n/config.ts
// Спільна конфігурація локалей i18n (використовується і на сервері, і на клієнті).

/** Підтримувані локалі інтерфейсу. Мають збігатися з файлами messages/<locale>.json. */
export const LOCALES = ['uk', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Дефолтна локаль (fallback, коли geo-IP/cookie/браузер не дали валідного значення). */
export const DEFAULT_LOCALE: Locale = 'uk';

/** Ім'я cookie, у якому зберігається активна локаль (вибір користувача або geo-IP). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Перевірка, що рядок — підтримувана локаль (type guard). */
export const isLocale = (value: string | undefined | null): value is Locale =>
  value != null && (LOCALES as readonly string[]).includes(value);
