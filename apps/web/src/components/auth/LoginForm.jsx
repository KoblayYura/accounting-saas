// src/components/auth/LoginForm.jsx
// Форма входу (React Bootstrap + React Hook Form). Валідація — на бекенді:
// 422 → мапимо errors на поля через setError; 401/403 — загальне повідомлення над формою.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Form, Button, Alert } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { applyServerErrors } from '@/lib/form-errors';
import { GoogleAuthButton } from './GoogleAuthButton';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { login, resendVerification } = useAuth();

  const [formError, setFormError] = useState(null); // { code, message } загальна помилка
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { identifier: '', password: '' } });

  const onSubmit = (values) => {
    setFormError(null);
    setSubmitting(true);
    login(
      values,
      () => {
        setSubmitting(false);
        router.push('/dashboard');
      },
      (payload, status) => {
        setSubmitting(false);
        if (status === 422 && payload?.errors) {
          applyServerErrors(setError, payload.errors);
        } else {
          setFormError({ code: payload?.error?.code, message: payload?.error?.message });
        }
      },
    );
  };

  const notVerified = formError?.code === 'EMAIL_NOT_VERIFIED';

  const handleResend = () => {
    const identifier = getValues('identifier');
    if (identifier.includes('@')) resendVerification(identifier, () => setResent(true));
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError && !notVerified && (
        <Alert variant="danger" className="py-2 small">
          {formError.message}
        </Alert>
      )}

      {notVerified && (
        <Alert variant="danger" className="py-2 small">
          {t('emailNotVerified')}
          {resent ? (
            <div className="text-success mt-1">{t('resendSent')}</div>
          ) : (
            <Button variant="link" size="sm" className="p-0 mt-1 d-block" onClick={handleResend}>
              {t('resendVerification')}
            </Button>
          )}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="identifier">
        <Form.Label>{t('emailOrLogin')}</Form.Label>
        <Form.Control
          type="text"
          autoComplete="username"
          isInvalid={!!errors.identifier}
          {...register('identifier')}
        />
        <Form.Control.Feedback type="invalid">{errors.identifier?.message}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-2" controlId="password">
        <Form.Label>{t('password')}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="current-password"
          isInvalid={!!errors.password}
          {...register('password')}
        />
        <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
      </Form.Group>

      <div className="text-end mb-3">
        <Link href="/forgot-password" className="small">
          {t('forgotPassword')}
        </Link>
      </div>

      <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
        {submitting ? tc('wait') : t('signIn')}
      </Button>

      <div className="text-center text-muted small my-2">{tc('or')}</div>

      <GoogleAuthButton />

      <p className="text-center text-muted small mt-3 mb-0">
        {t('noAccount')}{' '}
        <Link href="/register">{t('signUp')}</Link>
      </p>
    </Form>
  );
}
