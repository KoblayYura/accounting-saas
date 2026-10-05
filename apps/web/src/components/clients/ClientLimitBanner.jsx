// src/components/clients/ClientLimitBanner.jsx
// Банер, коли бухгалтер наближається до ліміту тарифу (спека: used >= limit - 1)
// або вичерпав його. Дані — з GET /billing/subscription через use-billing.
// Веде на /settings/billing (сторінка зʼявиться в Module 06).
//
// React Bootstrap Alert + ProgressBar — власний CSS-модуль із --fill більше не потрібен.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, ProgressBar } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useBilling } from '@/hooks/use-billing';
import styles from './ClientLimitBanner.module.css';

/**
 * @param {number} refreshKey — змінюється після create/archive/restore,
 *   щоб банер перезапитав актуальні used_clients (без глобального кешу тегів).
 */
export function ClientLimitBanner({ refreshKey = 0 }) {
  const t = useTranslations('billing');
  const { getSubscription } = useBilling();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    getSubscription(setSubscription, () => setSubscription(null));
    // getSubscription стабільний за змістом; перезапит — лише за refreshKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Безлімітний план або дані ще не прийшли — банер не потрібен.
  if (!subscription || subscription.is_unlimited) return null;

  const { used_clients: used, client_limit: limit } = subscription;

  // Спека: показувати, коли залишився один слот або ліміт вичерпано.
  if (used < limit - 1) return null;

  const isReached = used >= limit;
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <Alert variant={isReached ? 'danger' : 'warning'} className="py-2">
      <div className="small">
        {isReached ? t('limitReached', { used, limit }) : t('limitNear', { used, limit })}{' '}
        <Link href="/settings/billing" className="fw-medium">
          {t('considerUpgrade')}
        </Link>
      </div>
      <ProgressBar
        now={percent}
        variant={isReached ? 'danger' : 'warning'}
        className={`mt-2 ${styles.thinBar}`}
      />
    </Alert>
  );
}
