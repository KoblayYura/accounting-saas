// src/components/obligations/ObligationDetailModal.jsx
// Деталі зобов'язання (React Bootstrap Modal): клієнт, період, дедлайн, статус (select),
// нотатки, вбудований чекліст (read-only — редагування прапорців у Module 05, ще немає endpoint),
// кнопка «Позначити подано» з force-flow при неповному чеклісті (400 CHECKLIST_INCOMPLETE).

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/date';
import { useObligations } from '@/hooks/use-obligations';
import { StatusSelect } from './StatusSelect';
import { StatusBadge } from './StatusBadge';

export function ObligationDetailModal({ obligationId, show, onHide, onChanged }) {
  const t = useTranslations('obligations');
  const tc = useTranslations('common');
  const { getObligationById, updateObligationStatus } = useObligations();

  const [obligation, setObligation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmForce, setConfirmForce] = useState(false);

  const load = useCallback(() => {
    if (!obligationId) return;
    setLoading(true);
    setErrorMsg(null);
    setConfirmForce(false);
    getObligationById(
      obligationId,
      (data) => {
        setObligation(data);
        setLoading(false);
      },
      (payload) => {
        setErrorMsg(payload?.error?.message || tc('error'));
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obligationId]);

  // Вантажимо деталі при відкритті / зміні зобов'язання.
  useEffect(() => {
    if (show && obligationId) load();
    if (!show) setObligation(null);
  }, [show, obligationId, load]);

  const changeStatus = (status, force = false) => {
    if (!obligation) return;
    setErrorMsg(null);
    setSaving(true);
    updateObligationStatus(
      obligation.id,
      status,
      force,
      () => {
        setSaving(false);
        setConfirmForce(false);
        load();
        onChanged?.();
      },
      (payload) => {
        setSaving(false);
        // Неповний чекліст → пропонуємо форсувати (спека).
        if (payload?.error?.code === 'CHECKLIST_INCOMPLETE') {
          setConfirmForce(true);
          return;
        }
        setErrorMsg(payload?.error?.message || tc('error'));
      },
    );
  };

  const checklist = obligation?.checklist_items || [];
  const collected = checklist.filter((i) => i.is_collected).length;
  const totalDocs = checklist.length;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">{t('detailsTitle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading && !obligation ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted small">{tc('loading')}</span>
          </div>
        ) : !obligation ? (
          <p className="text-muted text-center py-3 mb-0">{errorMsg || tc('error')}</p>
        ) : (
          <>
            {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}

            {/* Метадані */}
            <dl className="row mb-3 small">
              <dt className="col-5 text-muted fw-normal">{t('colClient')}</dt>
              <dd className="col-7 text-end fw-medium mb-1">{obligation.client_name}</dd>

              <dt className="col-5 text-muted fw-normal">{t('period')}</dt>
              <dd className="col-7 text-end mb-1">{obligation.period_label}</dd>

              <dt className="col-5 text-muted fw-normal">{t('colDeadline')}</dt>
              <dd className="col-7 text-end mb-1">{formatDate(obligation.due_date)}</dd>

              <dt className="col-5 text-muted fw-normal">{t('colStatus')}</dt>
              <dd className="col-7 text-end mb-0">
                <StatusBadge status={obligation.status} />
              </dd>
            </dl>

            {obligation.notes && (
              <div className="mb-3">
                <div className="text-muted small">{t('notes')}</div>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                  {obligation.notes}
                </div>
              </div>
            )}

            {/* Чекліст (read-only до Module 05) */}
            <div className="mb-3">
              <div className="fw-medium small mb-1">
                {t('checklist')} {totalDocs > 0 && `(${collected}/${totalDocs})`}
              </div>
              {totalDocs === 0 ? (
                <p className="text-muted small mb-0">{t('checklistEmpty')}</p>
              ) : (
                <>
                  {checklist.map((item) => (
                    <Form.Check
                      key={item.id}
                      type="checkbox"
                      id={`doc-${item.id}`}
                      checked={item.is_collected}
                      readOnly
                      disabled
                      label={
                        <span className={item.is_collected ? 'text-decoration-line-through text-muted' : ''}>
                          {item.doc_name}
                        </span>
                      }
                    />
                  ))}
                  <small className="text-muted d-block mt-1">{t('checklistReadonly')}</small>
                </>
              )}
            </div>

            {/* Зміна статусу */}
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">{t('changeStatus')}</Form.Label>
              <StatusSelect
                value={obligation.status === 'overdue' ? 'pending' : obligation.status}
                onChange={(status) => changeStatus(status)}
                disabled={saving}
                size={undefined}
              />
            </Form.Group>

            {/* Підтвердження форсування при неповному чеклісті (спека) */}
            {confirmForce && (
              <Alert variant="warning" className="py-2">
                <div className="fw-medium small">{t('incompleteTitle')}</div>
                <div className="small mb-2">{t('incompleteBody')}</div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setConfirmForce(false)}>
                    {tc('cancel')}
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    disabled={saving}
                    onClick={() => changeStatus('submitted', true)}
                  >
                    {t('incompleteConfirm')}
                  </Button>
                </div>
              </Alert>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          {tc('close')}
        </Button>
        {obligation && obligation.status !== 'submitted' && (
          <Button variant="primary" disabled={saving} onClick={() => changeStatus('submitted')}>
            {saving ? tc('wait') : t('markSubmitted')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
