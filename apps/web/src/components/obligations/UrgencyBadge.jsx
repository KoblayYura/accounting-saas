// src/components/obligations/UrgencyBadge.jsx
// Бейдж терміновості зобов'язання (React Bootstrap Badge). Рівень обчислюється
// клієнтськи за due_date (lib/date.urgencyLevel), варіанти — з lib/obligation-meta.

'use client';

import { Badge } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { urgencyLevel } from '@/lib/date';
import { URGENCY_META } from '@/lib/obligation-meta';

export function UrgencyBadge({ dueDate, status }) {
  const t = useTranslations('obligations');
  const level = urgencyLevel(dueDate, status === 'overdue');
  const { labelKey, bg } = URGENCY_META[level];

  return (
    <Badge bg={bg} className="fw-normal">
      {t(labelKey)}
    </Badge>
  );
}
