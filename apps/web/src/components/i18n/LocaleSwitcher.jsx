// src/components/i18n/LocaleSwitcher.jsx
// Перемикач мови інтерфейсу. Записує вибір у cookie NEXT_LOCALE (найвищий пріоритет
// над geo-IP) і оновлює серверні компоненти через router.refresh, щоб підтягнути
// нові словники без повного перезавантаження сторінки.

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Form } from 'react-bootstrap';
import { LOCALES, LOCALE_COOKIE } from '@/config/i18n/config';

export function LocaleSwitcher() {
  const active = useLocale();
  const t = useTranslations('language');
  const router = useRouter();

  const onChange = (next) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };

  return (
    <Form.Select
      size="sm"
      aria-label={t('label')}
      value={active}
      onChange={(e) => onChange(e.target.value)}
      className="w-auto"
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {t(code)}
        </option>
      ))}
    </Form.Select>
  );
}
