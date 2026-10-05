// src/components/obligations/StatusSelect.jsx
// Select ручної зміни статусу зобов'язання (React Bootstrap Form.Select).
// overdue тут відсутній — його виставляє лише cron (спека). Опції — з obligation-meta.

'use client';

import { Form } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { MANUAL_STATUSES, OBLIGATION_STATUS } from '@/lib/obligation-meta';

export function StatusSelect({ value, onChange, disabled, label, size = 'sm', className }) {
  const t = useTranslations('obligations');

  return (
    <Form.Select
      aria-label={label || t('changeStatus')}
      size={size}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={{ width: 'auto' }}
    >
      {MANUAL_STATUSES.map((status) => (
        <option key={status} value={status}>
          {t(OBLIGATION_STATUS[status].labelKey)}
        </option>
      ))}
    </Form.Select>
  );
}
