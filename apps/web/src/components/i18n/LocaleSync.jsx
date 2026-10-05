// src/components/i18n/LocaleSync.jsx
// Клієнтський синхронізатор локалі. Дві задачі:
//  1. Тримати moment.locale у відповідності до активної i18n-локалі (для дат).
//  2. При першому візиті (немає cookie NEXT_LOCALE) — визначити локаль за geo-IP
//     (бекенд GET /geo/locale) і, якщо вона відрізняється від дефолтної, застосувати
//     (записати cookie + перезавантажити серверні компоненти через router.refresh).
//
// Пріоритет вибору локалі (спека 00-README): вибір користувача (cookie) → geo-IP →
// navigator.language → дефолт. Тут покриваємо geo-IP-крок; вибір користувача робить
// LocaleSwitcher, а navigator.language — резервний fallback нижче.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applyMomentLocale } from '@/lib/date';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from '@/config/i18n/config';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/** Чи є вже збережений вибір локалі в cookie. */
const hasLocaleCookie = () =>
  document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`));

/** Записати локаль у cookie (рік життя, доступна всьому сайту). */
const setLocaleCookie = (locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
};

/** Локаль із браузера (перші 2 літери), якщо підтримується. */
const browserLocale = () => {
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  return isLocale(lang) ? lang : null;
};

export function LocaleSync({ locale }) {
  const router = useRouter();

  // moment завжди слідує за активною локаллю (формат дат + перший день тижня).
  useEffect(() => {
    applyMomentLocale(locale);
  }, [locale]);

  // Автовизначення при першому візиті (cookie ще немає).
  useEffect(() => {
    if (hasLocaleCookie()) return;

    let cancelled = false;

    const detect = async () => {
      let detected = null;

      // 1. geo-IP з бекенду.
      try {
        const res = await fetch(`${API_BASE}/api/v1/geo/locale`);
        if (res.ok) {
          const json = await res.json();
          if (isLocale(json.data?.locale)) detected = json.data.locale;
        }
      } catch {
        // мережа недоступна — підемо на browser fallback
      }

      // 2. Резерв — мова браузера.
      if (!detected) detected = browserLocale();

      const finalLocale = detected ?? DEFAULT_LOCALE;
      if (cancelled) return;

      setLocaleCookie(finalLocale);
      // Якщо визначена локаль відрізняється від тієї, з якою відрендерився сервер —
      // оновити RSC, щоб підтягнулись правильні словники.
      if (finalLocale !== locale) router.refresh();
    };

    void detect();

    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  return null;
}
