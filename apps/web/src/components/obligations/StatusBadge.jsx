// src/components/obligations/StatusBadge.jsx
// Бейдж поточного статусу зобов'язання (варіанти з lib/obligation-meta).

'use client';

import { Badge } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { OBLIGATION_STATUS } from '@/lib/obligation-meta';

export function StatusBadge({ status }) {
  const t = useTranslations('obligations');
  const meta = OBLIGATION_STATUS[status];
  if (!meta) return null;

  return (
    <Badge bg={meta.bg} className="fw-normal">
      {t(meta.labelKey)}
    </Badge>
  );
}
