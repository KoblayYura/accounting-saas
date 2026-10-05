// src/components/auth/GoogleAuthButton.jsx
// Кнопка входу через Google — редірект на backend /api/v1/auth/google.

'use client';

import { Button } from 'react-bootstrap';
import { useTranslations } from 'next-intl';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function GoogleAuthButton({ label }) {
  const t = useTranslations('auth');
  const text = label ?? t('googleSignIn');

  const handleClick = () => {
    window.location.href = `${API_BASE}/api/v1/auth/google`;
  };

  return (
    <Button
      type="button"
      variant="outline-secondary"
      className="w-100 d-flex align-items-center justify-content-center gap-2"
      onClick={handleClick}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
      </svg>
      {text}
    </Button>
  );
}
