// src/components/obligations/ObligationsTable.jsx
// Табличне представлення НЕтермінових зобов'язань (секції «Цей місяць», «Пізніше»).
// Колонки: Зобов'язання / Період / Клієнт / Терміновість / Статус. Клік по рядку — деталі.
// Заголовки колонок мають tooltip-підказку (що саме в колонці).
// Термінові зобов'язання показуються не тут, а картками (ObligationRow) — вони мають виділятись.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/date';
import { useObligations } from '@/hooks/use-obligations';
import { Tooltip } from '@/components/ui/Tooltip';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusSelect } from './StatusSelect';

/** Комірка зміни статусу (локальний стан збереження). */
function StatusCell({ obligation, onChanged }) {
  const { updateObligationStatus } = useObligations();
  const [saving, setSaving] = useState(false);
  const selectValue = obligation.status === 'overdue' ? 'pending' : obligation.status;

  const handleChange = (status) => {
    setSaving(true);
    updateObligationStatus(
      obligation.id,
      status,
      false,
      () => {
        setSaving(false);
        onChanged?.();
      },
      () => setSaving(false),
    );
  };

  return <StatusSelect value={selectValue} onChange={handleChange} disabled={saving} />;
}

/** Заголовок колонки з підказкою (спільний ui/Tooltip на radix — ARIA + клавіатура). */
function ColumnHeader({ titleKey, hintKey }) {
  const t = useTranslations('obligations');
  return (
    <Tooltip content={t(hintKey)}>
      <span className="border-bottom border-secondary border-1" style={{ cursor: 'help' }}>
        {t(titleKey)}
      </span>
    </Tooltip>
  );
}

export function ObligationsTable({ obligations, onOpen, hideClient, onChanged }) {
  // Колонки з підписом + описом (тултип). Клієнт ховається в контексті одного клієнта.
  const columns = [
    { titleKey: 'colObligation', hintKey: 'colObligationHint' },
    { titleKey: 'period', hintKey: 'colPeriodHint' },
    ...(!hideClient ? [{ titleKey: 'colClient', hintKey: 'colClientHint' }] : []),
    { titleKey: 'colUrgency', hintKey: 'colUrgencyHint' },
    { titleKey: 'colStatus', hintKey: 'colStatusHint' },
  ];

  return (
    <Table hover responsive size="sm" className="align-middle mb-0">
      <thead>
        <tr className="text-muted small">
          {columns.map(({ titleKey, hintKey }) => (
            <th key={titleKey} scope="col" className="fw-medium">
              <ColumnHeader titleKey={titleKey} hintKey={hintKey} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {obligations.map((o) => (
          <tr key={o.id} onClick={() => onOpen(o.id)} style={{ cursor: 'pointer' }}>
            <td className="fw-medium">{o.name}</td>
            <td className="text-muted">
              {o.period_label} · {formatDate(o.due_date)}
            </td>
            {!hideClient && (
              <td onClick={(e) => e.stopPropagation()}>
                <Link href={`/clients/${o.client_id}`} className="small fw-medium">
                  {o.client_name}
                </Link>
              </td>
            )}
            <td>
              <UrgencyBadge dueDate={o.due_date} status={o.status} />
            </td>
            <td onClick={(e) => e.stopPropagation()}>
              <StatusCell obligation={o} onChanged={onChanged} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
