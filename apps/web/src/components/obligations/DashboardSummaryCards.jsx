// src/components/obligations/DashboardSummaryCards.jsx
// Верхні лічильники дашборду (React Bootstrap Card): прострочено / цього тижня / активних клієнтів.
// Лічильники — окремими запитами з limit=1 (беремо total), щоб не залежати від сторінки списку.

'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useObligations } from '@/hooks/use-obligations';
import { useClients } from '@/hooks/use-clients';

export function DashboardSummaryCards({ refreshKey }) {
  const t = useTranslations('obligations');
  const { getObligations } = useObligations();
  const { getClients } = useClients();

  const [overdue, setOverdue] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [activeClients, setActiveClients] = useState(0);

  useEffect(() => {
    getObligations({ urgency: 'overdue', limit: 1 }, (data) => setOverdue(data.total || 0));
    getObligations({ urgency: 'this_week', limit: 1 }, (data) => setThisWeek(data.total || 0));
    getClients({ is_active: true, limit: 1 }, (data) => setActiveClients(data.total || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const cards = [
    { key: 'overdue', label: t('summaryOverdue'), value: overdue, variant: 'danger' },
    { key: 'week', label: t('summaryThisWeek'), value: thisWeek, variant: 'warning' },
    { key: 'clients', label: t('summaryActiveClients'), value: activeClients, variant: 'secondary' },
  ];

  return (
    <Row className="g-3 mb-4">
      {cards.map(({ key, label, value, variant }) => (
        <Col key={key} xs={12} sm={4}>
          <Card className={`bg-${variant}-subtle border-${variant}-subtle h-100`}>
            <Card.Body className="py-3">
              <div className={`h3 mb-0 text-${variant}-emphasis`}>{value}</div>
              <small className="text-muted">{label}</small>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
