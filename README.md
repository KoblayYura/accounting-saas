# Accounting — SaaS для бухгалтерів-аутсорсерів

Вебплатформа для бухгалтерів, які ведуть багатьох клієнтів: облік клієнтів, календар податкових зобов'язань і дедлайнів, сповіщення, білінг і підписки.

> Статус: у розробці. Реалізовані модулі — автентифікація, управління клієнтами, календар зобов'язань.

## Можливості

- **Автентифікація**: реєстрація / вхід, JWT (access + refresh), Google OAuth, підтвердження email
- **Клієнти**: CRM-картка клієнта, пошук і фільтрація, щомісячна оплата, ліміти за тарифом
- **Календар зобов'язань**: автоматичне формування податкових дедлайнів, календарний і списковий вигляд, cron-задачі
- **Білінг**: тарифні плани та підписки (частково)
- **Мультимовність**: українська та англійська (next-intl)

## Технології

| Частина | Стек |
|---|---|
| Frontend (`apps/web`) | Next.js 16 (App Router), React 19, React Hook Form + Zod, React Bootstrap, react-big-calendar, next-intl, axios |
| Backend (`apps/api`) | Node.js, Express, TypeScript, Prisma 5, PostgreSQL 16, Passport (Google OAuth), JWT, node-cron, Nodemailer, Helmet |
| Інфраструктура | Docker Compose (PostgreSQL + pgAdmin), монорепо з npm-скриптами |
| Тестування | Playwright (e2e) |

## Структура

```
apps/
  api/   — REST API (Express + Prisma), модулі: auth, clients, obligations, billing, geo
  web/   — клієнтський застосунок (Next.js)
scripts/ — допоміжні скрипти
```

## Запуск локально

Потрібні Node.js 20+ і Docker.

```bash
npm run install:all
cp apps/api/.env.example apps/api/.env
cd apps/api && npx prisma migrate dev && cd ../..
npm start          # піднімає БД, API (порт 4000) і web (порт 3000)
```

Зупинка: `npm run stop`.
