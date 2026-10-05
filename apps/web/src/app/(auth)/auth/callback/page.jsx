// Технічна сторінка після Google OAuth редіректу. force-dynamic: суто клієнтська (Context).

import { AuthCallback } from '@/components/auth/AuthCallback';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return <AuthCallback />;
}
