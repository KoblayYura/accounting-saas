// src/components/auth/ResetPasswordForm.jsx
// Встановлення нового пароля за токеном із query. Успіх → редірект на /login.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Form, Button, Alert } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { applyServerErrors } from '@/lib/form-errors';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPassword } = useAuth();

  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { newPassword: '', confirmPassword: '' } });

  const onSubmit = (values) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('confirmPassword', { type: 'client', message: t('passwordsMismatch') });
      return;
    }
    setSubmitting(true);
    resetPassword(
      { token, newPassword: values.newPassword },
      () => {
        setSubmitting(false);
        setDone(true);
        setTimeout(() => router.push('/login'), 1500);
      },
      (payload, status) => {
        setSubmitting(false);
        if (status === 422 && payload?.errors) applyServerErrors(setError, payload.errors);
        else setError('newPassword', { type: 'server', message: payload?.error?.message ?? tc('error') });
      },
    );
  };

  if (!token) return <Alert variant="danger" className="small">{t('invalidToken')}</Alert>;
  if (done) return <Alert variant="success" className="small">{t('passwordChanged')}</Alert>;

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Form.Group className="mb-3" controlId="newPassword">
        <Form.Label>{t('newPassword')}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          isInvalid={!!errors.newPassword}
          {...register('newPassword')}
        />
        <Form.Control.Feedback type="invalid">{errors.newPassword?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="confirmPassword">
        <Form.Label>{t('confirmPassword')}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          isInvalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
        {submitting ? tc('wait') : t('changePassword')}
      </Button>

      <Link href="/login" className="d-block text-center small mt-3">{t('backToLogin')}</Link>
    </Form>
  );
}
