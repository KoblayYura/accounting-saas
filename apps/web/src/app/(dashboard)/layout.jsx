// (dashboard)/layout.jsx — client-side guard захищених маршрутів.
// Чекаємо завершення bootstrap-refresh; якщо не authenticated → редірект на /login.
// (У Next 16 middleware → proxy і не призначений для повноцінної авторизації,
//  тому надійний захист робимо тут, на клієнті — як допускає спека.)

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar, Nav, Container, Spinner } from 'react-bootstrap';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { UserMenu } from '@/components/auth/UserMenu';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';

/** Пункти головної навігації — рендеряться через .map() (i18n-ключ nav.*). */
const NAV_LINKS = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/clients', labelKey: 'clients' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const t = useTranslations('nav');
  // Відновлення сесії робить AuthProvider глобально; тут лише читаємо статус для guard.
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Поки сесія відновлюється — спінер.
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" role="status" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="white" className="border-bottom px-4 py-2">
        <Container fluid className="px-0">
          <Navbar.Brand as={Link} href="/dashboard" className="fw-bold text-primary me-4">
            Accounting
          </Navbar.Brand>
          <Nav className="me-auto">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Nav.Link key={href} as={Link} href={href}>
                {t(labelKey)}
              </Nav.Link>
            ))}
          </Nav>
          <div className="d-flex align-items-center gap-3">
            <LocaleSwitcher />
            <UserMenu />
          </div>
        </Container>
      </Navbar>
      <main className="flex-grow-1 p-4">{children}</main>
    </div>
  );
}
