// src/components/obligations/ObligationRow.jsx
// Картка зобов'язання у термінових секціях дашборду / картки клієнта (React Bootstrap Card).
// Весь блок підсвічується за станом (rowVariantClass): collected → зелений, термінові → свій колір.
// Ліва частина клікабельна (відкриває деталі), права — клієнт + urgency + швидка зміна статусу.
//
// Прогрес чеклісту в рядку не показуємо: GET /obligations його не повертає (він у деталях).

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from 'react-bootstrap';
import { formatDate } from '@/lib/date';
import { rowVariantClass } from '@/lib/obligation-meta';
import { useObligations } from '@/hooks/use-obligations';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusSelect } from './StatusSelect';

export function ObligationRow({ obligation, onOpen, hideClient, onChanged }) {
  const { updateObligationStatus } = useObligations();
  const [saving, setSaving] = useState(false);

  // overdue не редагується вручну — для select показуємо pending як базу вибору.
  const selectValue = obligation.status === 'overdue' ? 'pending' : obligation.status;

  const onStatusChange = (status) => {
    // submitted тут не форсуємо: якщо чекліст неповний, бек поверне 400 —
    // повноцінний force-flow доступний у деталях (ObligationDetailModal).
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

  return (
    <Card className={`mb-2 ${rowVariantClass(obligation)}`}>
      <Card.Body className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 py-2 px-3">
        <Button
          variant="link"
          onClick={() => onOpen(obligation.id)}
          className="text-decoration-none text-start p-0 flex-grow-1"
        >
          <span className="d-block fw-medium text-body">{obligation.name}</span>
          <small className="text-muted">
            {obligation.period_label} · {formatDate(obligation.due_date)}
          </small>
        </Button>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {!hideClient && (
            <Link href={`/clients/${obligation.client_id}`} className="small fw-medium">
              {obligation.client_name}
            </Link>
          )}
          <UrgencyBadge dueDate={obligation.due_date} status={obligation.status} />
          <StatusSelect value={selectValue} onChange={onStatusChange} disabled={saving} />
        </div>
      </Card.Body>
    </Card>
  );
}
