// src/config/i18n/request.ts
// Конфіг next-intl для App Router БЕЗ i18n-роутингу: локаль беремо з cookie
// (її виставляє клієнт за geo-IP/вибором користувача), а не з URL-сегмента.
// Шлях до цього файлу вказано в next.config через createNextIntlPlugin.

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';

const readCookieLocale = async (): Promise<Locale> => {
  try {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

export default getRequestConfig(async () => {
  const locale = await readCookieLocale();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
