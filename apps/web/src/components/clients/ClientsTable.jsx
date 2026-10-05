// src/components/clients/ClientsTable.jsx
// Responsive-список клієнтів: Bootstrap Table на десктопі (d-none d-md-table),
// картки на мобільному (d-md-none). Обидві розмітки рендеряться з одного масиву
// через .map() — дані не дублюються.
//
// Колонка «Тариф» (monthly_fee) показується лише якщо бекенд віддав це поле —
// він виключає його з DTO для звичайного accountant (рольове правило зі спеки),
// тому фронту достатньо перевірити наявність ключа.
//
// ⚠️ Бейдж прострочених зобовʼязань: frontend.md вимагає його у списку, але backend.md
// віддає лічильники лише в GET /clients/:id. Компонент готовий показати число
// (props.overdueCounts). TODO: узгодити контракт після реалізації Module 03.

'use client';

import Link from 'next/link';
import { Table, Card, Badge, Stack } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { ClientTypeBadge } from './ClientTypeBadge';

function OverdueBadge({ count }) {
  const t = useTranslations('clients');
  if (!count) return null;
  return <Badge bg="danger">{t('overdueCount', { count })}</Badge>;
}

function DetailsLink({ id }) {
  const tc = useTranslations('common');
  return (
    <Link href={`/clients/${id}`} className="small fw-medium">
      {tc('details')}
    </Link>
  );
}

export function ClientsTable({ clients, overdueCounts = {} }) {
  const t = useTranslations('clients');
  const tc = useTranslations('common');

  // Бек віддає monthly_fee лише head_accountant — орієнтуємось на наявність поля.
  const showFee = clients.some((c) => 'monthly_fee' in c);
  const fee = (value) => (value === null || value === undefined ? tc('dash') : value);

  return (
    <>
      {/* Десктоп: таблиця */}
      <Table hover responsive className="d-none d-md-table align-middle">
        <thead>
          <tr className="text-muted small">
            <th>{t('colName')}</th>
            <th>{t('colType')}</th>
            <th>{t('colCode')}</th>
            {showFee && <th>{t('colFee')}</th>}
            <th>{t('colStatus')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="fw-medium">{client.name}</td>
              <td>
                <ClientTypeBadge type={client.client_type} />
              </td>
              <td className="text-muted">{client.edrpou_or_inn ?? tc('dash')}</td>
              {showFee && <td className="text-muted">{fee(client.monthly_fee)}</td>}
              <td>
                <OverdueBadge count={overdueCounts[client.id] ?? 0} />
              </td>
              <td className="text-end">
                <DetailsLink id={client.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Мобільний: картки */}
      <Stack gap={3} className="d-md-none">
        {clients.map((client) => (
          <Card key={client.id}>
            <Card.Body className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <span className="fw-medium">{client.name}</span>
                <ClientTypeBadge type={client.client_type} />
              </div>
              <span className="text-muted small">{client.edrpou_or_inn ?? tc('dash')}</span>
              {showFee && (
                <span className="text-muted small">
                  {t('colFee')}: {fee(client.monthly_fee)}
                </span>
              )}
              <div className="d-flex justify-content-between align-items-center">
                <OverdueBadge count={overdueCounts[client.id] ?? 0} />
                <DetailsLink id={client.id} />
              </div>
            </Card.Body>
          </Card>
        ))}
      </Stack>
    </>
  );
}
