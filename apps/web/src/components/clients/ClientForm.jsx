// src/components/clients/ClientForm.jsx
// Форма клієнта (React Bootstrap + React Hook Form) — переюзається для створення
// (/clients/new) і редагування (/clients/[id]).
//
// Валідація — ТІЛЬКИ на бекенді (спека §6): тут немає JS-схеми. При 422 сторінка
// викликає applyServerErrors(setError, errors) і помилки зʼявляються під полями.
// Текстові поля рендеряться через .map() з масиву опису (DRY).

'use client';

import { Form, Button, Alert, Stack } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { ClientTypeSelect } from './ClientTypeSelect';
import styles from './ClientForm.module.css';

/** Ролі, яким бекенд дозволяє бачити і редагувати monthly_fee. */
const FEE_ROLES = ['head_accountant', 'super_admin'];

export const EMPTY_CLIENT_FORM = {
  name: '',
  client_type: '',
  edrpou_or_inn: '',
  phone: '',
  email: '',
  notes: '',
  monthly_fee: '',
};

/** Опис текстових полів — щоб не копіювати <Form.Group> вручну чотири рази. */
const TEXT_FIELDS = [
  { name: 'name', labelKey: 'fieldName', type: 'text', autoComplete: 'organization', required: true },
  { name: 'edrpou_or_inn', labelKey: 'fieldCode', type: 'text', autoComplete: 'off', placeholderKey: 'fieldCodePlaceholder' },
  { name: 'phone', labelKey: 'fieldPhone', type: 'tel', autoComplete: 'tel' },
  { name: 'email', labelKey: 'fieldEmail', type: 'email', autoComplete: 'email' },
];

export function ClientForm({
  defaultValues = EMPTY_CLIENT_FORM,
  onSubmit,
  isSubmitting,
  serverError,
  submitLabel,
  onCancel,
  formRef,
}) {
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const { user } = useAuth();
  const canEditFee = FEE_ROLES.includes(user?.role);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ defaultValues });

  // Сторінка отримує setError, щоб застосувати помилки з 422.
  if (formRef) formRef.current = { setError };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
      {serverError && (
        <Alert variant="danger" className="py-2 small">
          {serverError}
        </Alert>
      )}

      {TEXT_FIELDS.map(({ name, labelKey, type, autoComplete, placeholderKey, required }) => (
        <Form.Group className="mb-3" controlId={name} key={name}>
          <Form.Label>
            {t(labelKey)}
            {required && ' *'}
          </Form.Label>
          <Form.Control
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholderKey ? t(placeholderKey) : undefined}
            isInvalid={!!errors[name]}
            {...register(name)}
          />
          <Form.Control.Feedback type="invalid">{errors[name]?.message}</Form.Control.Feedback>
        </Form.Group>
      ))}

      <ClientTypeSelect
        label={`${t('type')} *`}
        error={errors.client_type?.message}
        {...register('client_type')}
      />

      {/* monthly_fee — лише для head_accountant (бек ігнорує поле від інших ролей). */}
      {canEditFee && (
        <Form.Group className="mb-3" controlId="monthly_fee">
          <Form.Label>{t('fieldMonthlyFee')}</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            placeholder={t('fieldMonthlyFeePlaceholder')}
            isInvalid={!!errors.monthly_fee}
            {...register('monthly_fee')}
          />
          <Form.Control.Feedback type="invalid">{errors.monthly_fee?.message}</Form.Control.Feedback>
        </Form.Group>
      )}

      <Form.Group className="mb-3" controlId="notes">
        <Form.Label>{t('fieldNotes')}</Form.Label>
        <Form.Control as="textarea" rows={3} isInvalid={!!errors.notes} {...register('notes')} />
        <Form.Control.Feedback type="invalid">{errors.notes?.message}</Form.Control.Feedback>
      </Form.Group>

      <Stack direction="horizontal" gap={2}>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? tc('wait') : submitLabel}
        </Button>
        <Button type="button" variant="outline-secondary" onClick={onCancel}>
          {tc('cancel')}
        </Button>
      </Stack>
    </Form>
  );
}
