// Сторінка підтвердження email. force-dynamic: суто клієнтська (query + Context).

import { Suspense } from 'react';
import { VerifyEmail } from '@/components/auth/VerifyEmail';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
