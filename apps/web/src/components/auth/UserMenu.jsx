// src/components/auth/UserMenu.jsx
// Дропдаун у хедері (React Bootstrap): ім'я користувача, налаштування, "Вийти".

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dropdown } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';

export function UserMenu() {
  const router = useRouter();
  const t = useTranslations('nav');
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout(() => router.push('/login'));
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" size="sm" id="user-menu">
        {user.name}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item as={Link} href="/settings/notifications">
          {t('settings')}
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleLogout} className="text-danger">
          {t('logout')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
