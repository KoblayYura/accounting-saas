import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { LocaleSync } from "@/components/i18n/LocaleSync";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/config/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Accounting — облік клієнтів для бухгалтерів",
  description: "Дашборд для бухгалтерів-аутсорсерів: клієнти, дедлайни, нагадування",
};

// Застосунок керується клієнтською сесією (AuthContext + refresh-cookie),
// статичний пре-рендер не потрібен — уникаємо конфлікту провайдерів при білді.
export const dynamic = "force-dynamic";

/** Активна локаль з cookie NEXT_LOCALE (дефолт uk). Стійко до відсутності cookies(). */
async function resolveLocale() {
  try {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default async function RootLayout({ children }) {
  // Локаль з cookie NEXT_LOCALE (виставляє LocaleSync за geo-IP / вибором користувача),
  // словник вантажимо й передаємо явно в NextIntlClientProvider.
  const locale = await resolveLocale();
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="d-flex flex-column min-vh-100 bg-body-tertiary">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Синхронізує moment.locale з активною локаллю + geo-IP автовизначення. */}
          <LocaleSync locale={locale} />
          {/* Єдиний глобальний стан застосунку — AuthContext (user, accessToken, статус сесії).
              Redux/RTK Query прибрано 2026-07-18 після міграції всіх модулів на dataSender. */}
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
