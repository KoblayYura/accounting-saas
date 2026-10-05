// src/components/auth/ForgotPasswordForm.jsx
// Запит скидання пароля. Після відправки — нейтральне повідомлення (не розкриваємо існування email).

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Form, Button, Alert } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { applyServerErrors } from '@/lib/form-errors';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { forgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = (values) => {
    setSubmitting(true);
    forgotPassword(
      values.email,
      () => {
        setSubmitting(false);
        setSent(true);
      },
      (payload, status) => {
        setSubmitting(false);
        if (status === 422 && payload?.errors) applyServerErrors(setError, payload.errors);
        else setSent(true); // не розкриваємо помилки — нейтрально
      },
    );
  };

  if (sent) {
    return (
      <div>
        <Alert variant="success" className="small">{t('resetSent')}</Alert>
        <Link href="/login" className="d-block text-center small">{t('backToLogin')}</Link>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Form.Group className="mb-3" controlId="email">
        <Form.Label>{t('email')}</Form.Label>
        <Form.Control type="email" autoComplete="email" isInvalid={!!errors.email} {...register('email')} />
        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
        {submitting ? tc('wait') : t('sendResetLink')}
      </Button>

      <Link href="/login" className="d-block text-center small mt-3">{t('backToLogin')}</Link>
    </Form>
  );
}
