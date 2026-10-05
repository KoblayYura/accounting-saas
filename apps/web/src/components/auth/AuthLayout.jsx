// src/components/auth/AuthLayout.jsx
// Обгортка сторінок авторизації: центрована картка з логотипом і заголовком (React Bootstrap).

import { Card } from 'react-bootstrap';
import styles from './AuthLayout.module.css';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <span className={styles.logo}>Accounting</span>
            <h1 className="h5 fw-semibold mt-3 mb-1">{title}</h1>
            {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
          </div>
          {children}
        </Card.Body>
      </Card>
    </div>
  );
}
