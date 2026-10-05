// src/components/clients/ClientTypeBadge.jsx
// Кольоровий бейдж типу клієнта (React Bootstrap Badge).
// Підписи (i18n-ключі) і кольори — з lib/client-types.js (єдине джерело).

'use client';

import { Badge } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { CLIENT_TYPES } from '@/lib/client-types';

export function ClientTypeBadge({ type }) {
  const t = useTranslations('clients');
  const meta = CLIENT_TYPES[type];
  if (!meta) return null;

  return <Badge bg={meta.bg}>{t(meta.shortLabelKey)}</Badge>;
}
