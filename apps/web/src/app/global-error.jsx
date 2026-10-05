// global-error.jsx — власна глобальна error-сторінка (самодостатня, без Redux/провайдерів).
// Замінює вбудований _global-error, який конфліктував із client-провайдерами при білді.
//
// Тексти тут навмисно НЕ через next-intl: global-error рендериться поза деревом
// NextIntlClientProvider (фатальна помилка кореневого layout), тож i18n-контексту
// тут немає. Двомовний підпис хардкодимо мінімально — це аварійний екран.

'use client';

export default function GlobalError({ unstable_retry }) {
  return (
    <html lang="uk">
      <body className="d-flex min-vh-100 align-items-center justify-content-center bg-body-tertiary">
        <div className="text-center p-4">
          <h1 className="h4 fw-semibold">Щось пішло не так / Something went wrong</h1>
          <p className="mt-2 text-muted small">Спробуйте оновити сторінку. / Please try again.</p>
          <button type="button" onClick={() => unstable_retry()} className="btn btn-primary mt-3">
            Спробувати ще раз / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
