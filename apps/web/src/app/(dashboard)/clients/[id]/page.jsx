// /clients/[id] — деталі клієнта: редагована форма, архівація/відновлення,
// секція зобовʼязань (заглушка до Module 03).
// Валідація — на бекенді: 422 → applyServerErrors.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Button, Card, Modal, Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useClients } from '@/hooks/use-clients';
import { applyServerErrors } from '@/lib/form-errors';
import { ClientForm } from '@/components/clients/ClientForm';

/** Клієнт з API → значення форми (null з API → '' у полях). */
const toFormValues = (client) => ({
  name: client.name ?? '',
  client_type: client.client_type ?? '',
  edrpou_or_inn: client.edrpou_or_inn ?? '',
  phone: client.phone ?? '',
  email: client.email ?? '',
  notes: client.notes ?? '',
  // monthly_fee бек віддає лише head_accountant; для інших ключа немає.
  monthly_fee: client.monthly_fee ?? '',
});

export default function ClientDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const { getClientById, updateClient, archiveClient, restoreClient } = useClients();

  const formRef = useRef(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getClientById(
      id,
      (data) => {
        setClient(data);
        setLoading(false);
      },
      (payload) => {
        setLoadError(payload?.error?.message ?? t('notFound'));
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = (values) => {
    setServerError(null);
    setSavedMessage(null);
    setSaving(true);

    updateClient(
      id,
      values,
      (data) => {
        setSaving(false);
        setClient(data);
        setSavedMessage(t('changesSaved'));
      },
      (payload, status) => {
        setSaving(false);
        if (status === 422 && payload?.errors) {
          applyServerErrors(formRef.current?.setError, payload.errors);
          return;
        }
        setServerError(payload?.error?.message ?? tc('error'));
      },
    );
  };

  const handleArchive = () => {
    setBusyAction(true);
    archiveClient(
      id,
      () => {
        setBusyAction(false);
        setArchiveModalOpen(false);
        router.push('/clients');
      },
      (payload) => {
        setBusyAction(false);
        setArchiveModalOpen(false);
        setServerError(payload?.error?.message ?? tc('error'));
      },
    );
  };

  const handleRestore = () => {
    setBusyAction(true);
    setServerError(null);
    restoreClient(
      id,
      (data) => {
        setBusyAction(false);
        setClient(data);
      },
      (payload) => {
        setBusyAction(false);
        setServerError(payload?.error?.message ?? tc('error'));
      },
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" size="sm" />{' '}
        <span className="text-muted small">{tc('loading')}</span>
      </div>
    );
  }

  if (loadError || !client) {
    return (
      <div className="d-flex flex-column gap-3">
        <Alert variant="danger" className="py-2 small mb-0">
          {loadError ?? t('notFound')}
        </Alert>
        <Link href="/clients" className="small">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <header className="d-flex flex-column gap-1">
        <Link href="/clients" className="small">
          {t('backToList')}
        </Link>
        <h1 className="h3 mb-0">{client.name}</h1>
      </header>

      {!client.is_active && (
        <Alert variant="secondary" className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
          <span className="small">{t('archivedNotice')}</span>
          <Button variant="outline-secondary" size="sm" onClick={handleRestore} disabled={busyAction}>
            {busyAction ? tc('wait') : t('restoreClient')}
          </Button>
        </Alert>
      )}

      {savedMessage && (
        <Alert variant="success" className="py-2 small mb-0">
          {savedMessage}
        </Alert>
      )}

      <ClientForm
        formRef={formRef}
        defaultValues={toFormValues(client)}
        onSubmit={handleSubmit}
        isSubmitting={saving}
        serverError={serverError}
        submitLabel={t('saveChanges')}
        onCancel={() => router.push('/clients')}
      />

      {/* Зобовʼязання клієнта — повний список зʼявиться з Module 03 (ObligationsList by clientId). */}
      <section className="d-flex flex-column gap-2">
        <h2 className="h5 mb-0">{t('clientObligations')}</h2>
        <Card body className="text-center text-muted small">
          {t('obligationsSummary', {
            active: client.active_obligations_count,
            overdue: client.overdue_obligations_count,
          })}
          <div className="mt-1 text-muted">{t('obligationsPlaceholder')}</div>
        </Card>
      </section>

      {client.is_active && (
        <section className="d-flex flex-column align-items-start gap-2 border-top pt-4">
          <h2 className="h5 mb-0">{t('archiving')}</h2>
          <p className="text-muted small mb-1">{t('archiveHint')}</p>
          <Button variant="outline-danger" onClick={() => setArchiveModalOpen(true)}>
            {t('archiveClient')}
          </Button>
        </section>
      )}

      <Modal show={isArchiveModalOpen} onHide={() => setArchiveModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{t('archiveConfirmTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          {t('archiveConfirmBody', { name: client.name })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setArchiveModalOpen(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="danger" onClick={handleArchive} disabled={busyAction}>
            {busyAction ? tc('wait') : t('archiveConfirmYes')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
