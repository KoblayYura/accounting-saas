// /dashboard — головна «що горить»: лічильники, фільтр за клієнтом,
// перемикач Список / Календар, згруповані по терміновості зобов'язання.
//
// Стан — локальний useState (спека §6: без Redux). Запити — через use-obligations
// (dataSender). UI — React Bootstrap.

'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Form, ButtonGroup, Button } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { DashboardSummaryCards } from '@/components/obligations/DashboardSummaryCards';
import { ObligationsList } from '@/components/obligations/ObligationsList';
import { ObligationsCalendar } from '@/components/obligations/ObligationsCalendar';

export default function DashboardPage() {
  const t = useTranslations('obligations');
  const { user } = useAuth();
  const { getClients } = useClients();

  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);

  // Список клієнтів для фільтра (лише активні).
  useEffect(() => {
    getClients({ is_active: true, limit: 100 }, (data) => setClients(data.items || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { key: 'list', label: t('viewList') },
    { key: 'calendar', label: t('viewCalendar') },
  ];

  return (
    <div>
      <header className="mb-4">
        <h1 className="h3 mb-1">{t('welcome', { name: user?.name || user?.login || '' })}</h1>
        <p className="text-muted small mb-0">{t('dashboardSubtitle')}</p>
      </header>

      <DashboardSummaryCards refreshKey={clientId} />

      {/* Панель керування: вкладки + фільтр за клієнтом */}
      <Row className="align-items-end g-2 mb-3">
        <Col xs={12} md="auto">
          <ButtonGroup size="sm">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={view === tab.key ? 'primary' : 'outline-secondary'}
                onClick={() => setView(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </ButtonGroup>
        </Col>

        <Col xs={12} md={4} className="ms-md-auto">
          <Form.Label htmlFor="dashboard-client" className="small text-muted mb-1">
            {t('filterByClient')}
          </Form.Label>
          <Form.Select
            id="dashboard-client"
            size="sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">{t('allClients')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {view === 'list' ? (
        <ObligationsList clientId={clientId || undefined} />
      ) : (
        <ObligationsCalendar clientId={clientId || undefined} />
      )}
    </div>
  );
}
