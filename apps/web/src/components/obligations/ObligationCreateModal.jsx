// src/components/obligations/ObligationCreateModal.jsx
// Модалка ручного створення нетипового зобов'язання (POST /obligations, template_id=null).
// Відкривається кнопкою «+ Додати» або кліком по слоту дати в календарі (initialDate).
//
// Новий стек: React Bootstrap + React Hook Form БЕЗ Zod-резолвера.
// Валідація — виключно на бекенді: 422 → applyServerErrors(setError, errors).

'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useObligations } from '@/hooks/use-obligations';
import { useClients } from '@/hooks/use-clients';
import { applyServerErrors } from '@/lib/form-errors';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { ChecklistEditor } from './ChecklistEditor';

/** Порожні значення форми (due_date — опційно передана дата з календаря, YYYY-MM-DD). */
const emptyForm = (dueDate = '', clientId = '') => ({
  client_id: clientId,
  name: '',
  period_label: '',
  due_date: dueDate,
  notes: '',
  checklist_items: [],
});

export function ObligationCreateModal({ show, onHide, initialDate, fixedClientId, onCreated }) {
  const t = useTranslations('obligations');
  const tc = useTranslations('common');
  const { createObligation } = useObligations();
  const { getClients } = useClients();

  const [clients, setClients] = useState([]);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: emptyForm(initialDate, fixedClientId) });

  // Скидаємо форму під нову дату/клієнта при кожному відкритті.
  useEffect(() => {
    if (show) {
      reset(emptyForm(initialDate || '', fixedClientId || ''));
      setFormError(null);
    }
  }, [show, initialDate, fixedClientId, reset]);

  // Список клієнтів для select (лише коли модалка відкрита і клієнт не фіксований).
  useEffect(() => {
    if (!show || fixedClientId) return;
    getClients({ is_active: true, limit: 100 }, (data) => setClients(data.items || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, fixedClientId]);

  const onSubmit = (values) => {
    setFormError(null);
    setSubmitting(true);

    // Чекліст: { value }[] → string[], порожні відкидаємо (бек також фільтрує).
    const docs = (values.checklist_items || [])
      .map((d) => (d.value || '').trim())
      .filter((s) => s.length > 0);

    const payload = {
      client_id: values.client_id,
      name: values.name,
      period_label: values.period_label,
      due_date: values.due_date,
      ...(values.notes && values.notes.trim() ? { notes: values.notes } : {}),
      ...(docs.length > 0 ? { checklist_items: docs } : {}),
    };

    createObligation(
      payload,
      () => {
        setSubmitting(false);
        reset(emptyForm());
        onCreated?.();
        onHide();
      },
      (errorPayload, status) => {
        setSubmitting(false);
        if (status === 422 && errorPayload?.errors) {
          applyServerErrors(setError, errorPayload.errors);
        } else {
          setFormError(errorPayload?.error?.message || tc('error'));
        }
      },
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">{t('createTitle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Пояснення: більшість дедлайнів створюються автоматично; ця форма — для нетипових. */}
        <Alert variant="info" className="py-2 small">
          {t('createHint')}
        </Alert>

        {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          {!fixedClientId && (
            <Form.Group className="mb-3" controlId="client_id">
              <Form.Label>{t('colClient')}</Form.Label>
              <Form.Select isInvalid={!!errors.client_id} {...register('client_id')}>
                <option value="">{t('selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.client_id?.message}</Form.Control.Feedback>
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="name">
            <Form.Label>{t('colObligation')}</Form.Label>
            <Form.Control type="text" isInvalid={!!errors.name} {...register('name')} />
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="period_label">
            <Form.Label>{t('period')}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('periodPlaceholder')}
              isInvalid={!!errors.period_label}
              {...register('period_label')}
            />
            <Form.Control.Feedback type="invalid">{errors.period_label?.message}</Form.Control.Feedback>
          </Form.Group>

          {/* Дедлайн: react-datepicker з форматом dd.MM.yyyy (нативний type="date"
              показував би дату у форматі локалі ОС). Значення всередині — YYYY-MM-DD. */}
          <Controller
            control={control}
            name="due_date"
            render={({ field }) => (
              <DatePickerField
                label={t('colDeadline')}
                value={field.value}
                onChange={field.onChange}
                error={errors.due_date?.message}
              />
            )}
          />

          <Form.Group className="mb-3" controlId="notes">
            <Form.Label>{t('notes')}</Form.Label>
            <Form.Control as="textarea" rows={2} isInvalid={!!errors.notes} {...register('notes')} />
            <Form.Control.Feedback type="invalid">{errors.notes?.message}</Form.Control.Feedback>
          </Form.Group>

          {/* Опційний чекліст документів — динамічний список (додати/видалити). */}
          <ChecklistEditor control={control} register={register} />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          {tc('cancel')}
        </Button>
        <Button variant="primary" disabled={submitting} onClick={handleSubmit(onSubmit)}>
          {submitting ? tc('wait') : t('createAction')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
