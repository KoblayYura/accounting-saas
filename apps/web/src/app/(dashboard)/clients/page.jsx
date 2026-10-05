// /clients — список клієнтів: пошук (debounce 300мс), фільтр за типом,
// перемикач архівних, пагінація, empty state, банер ліміту тарифу.
//
// Стан — локальний useState + рефетч після зміни фільтрів (спека §6: без глобального
// кешу тегів). Запити — через use-clients (dataSender). UI — React Bootstrap.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Form, Row, Col, Button, Alert, Spinner, Pagination, Card } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useClients } from '@/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { CLIENT_TYPES, CLIENT_TYPE_ORDER } from '@/lib/client-types';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientLimitBanner } from '@/components/clients/ClientLimitBanner';
import styles from './page.module.css';

const PAGE_SIZE = 20;

export default function ClientsPage() {
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const { getClients } = useClients();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Зміна фільтрів скидає сторінку — інакше можна опинитись на порожній 3-й сторінці.
  const filtersKey = `${debouncedSearch}|${type}|${showArchived}`;
  const prevFiltersKey = useRef(filtersKey);
  if (prevFiltersKey.current !== filtersKey && page !== 1) {
    prevFiltersKey.current = filtersKey;
    setPage(1);
  } else {
    prevFiltersKey.current = filtersKey;
  }

  const fetchClients = useCallback(() => {
    setLoading(true);
    setError(null);
    getClients(
      {
        search: debouncedSearch,
        type,
        is_active: showArchived ? 'false' : 'true',
        page,
        limit: PAGE_SIZE,
      },
      (data) => {
        setResult(data);
        setLoading(false);
      },
      (payload) => {
        setError(payload?.error?.message ?? tc('error'));
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, type, showArchived, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clients = result?.items ?? [];
  const hasFilters = Boolean(debouncedSearch || type || showArchived);
  const totalPages = result ? Math.ceil(result.total / result.limit) : 0;
  // Спінер — лише поки даних не було жодного разу (щоб список не блимав при пошуку).
  const isInitialLoad = loading && !result;

  return (
    <div className="d-flex flex-column gap-4">
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <h1 className="h3 mb-0">{t('title')}</h1>
        <Link href="/clients/new" className="btn btn-primary">
          {t('add')}
        </Link>
      </header>

      <ClientLimitBanner refreshKey={result?.total ?? 0} />

      {/* Панель фільтрів */}
      <Row className="g-3 align-items-end">
        <Col xs={12} md>
          <Form.Group controlId="client-search">
            <Form.Label className="small fw-medium">{t('search')}</Form.Label>
            <Form.Control
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </Form.Group>
        </Col>

        <Col xs={12} md="auto">
          <Form.Group controlId="client-type-filter">
            <Form.Label className="small fw-medium">{t('type')}</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={styles.typeFilter}
            >
              <option value="">{t('allTypes')}</option>
              {CLIENT_TYPE_ORDER.map((value) => (
                <option key={value} value={value}>
                  {t(CLIENT_TYPES[value].labelKey)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} md="auto">
          <Form.Check
            type="checkbox"
            id="show-archived"
            label={t('showArchived')}
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="py-2 small">
          {error}
        </Alert>
      )}

      {isInitialLoad ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="sm" /> <span className="text-muted small">{tc('loading')}</span>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className={loading ? styles.fetching : undefined}>
          <ClientsTable clients={clients} />
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="justify-content-center mb-0">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {tc('back')}
          </Pagination.Prev>
          <Pagination.Item disabled>
            {page} / {totalPages}
          </Pagination.Item>
          <Pagination.Next disabled={page >= totalPages} onClick={() => setPage(page + 1)} />
        </Pagination>
      )}
    </div>
  );
}

/** Порожній стан: різний текст, коли список порожній через фільтри або взагалі. */
function EmptyState({ hasFilters }) {
  const t = useTranslations('clients');

  if (hasFilters) {
    return (
      <Card body className="text-center text-muted border-dashed py-5">
        {t('emptyFiltered')}
      </Card>
    );
  }

  return (
    <Card body className="text-center py-5">
      <div className={styles.emptyIcon} aria-hidden="true">
        📋
      </div>
      <p className="fw-medium mb-1">{t('emptyTitle')}</p>
      <p className="text-muted small mb-3">{t('emptyHint')}</p>
      <div>
        <Link href="/clients/new" className="btn btn-primary">
          {t('addFirst')}
        </Link>
      </div>
    </Card>
  );
}
