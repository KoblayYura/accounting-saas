// src/app.ts
// Збірка Express-застосунку: middleware + монтування роутів + error-handler.
// Точка входу (app.listen) — в index.ts.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { prisma } from './db';
import { env } from './config/env';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { configureGooglePassport } from './modules/auth/auth.passport';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import obligationsRoutes from './modules/obligations/obligations.routes';
import geoRoutes from './modules/geo/geo.routes';
import billingRoutes from './modules/billing/billing.routes';

// Реєстрація Google-стратегії (no-op, якщо ключів немає).
configureGooglePassport();

export const app = express();

// За проксі (nginx/хостинг) — довіряти X-Forwarded-* , щоб req.ip був реальним IP клієнта
// (потрібно для geo-модуля визначення локалі).
app.set('trust proxy', true);

// Порядок: helmet → cors → json → cookies → logger → passport → routes → errorHandler.
app.use(helmet());
app.use(
  cors({
    origin: env.APP_BASE_URL, // конкретний origin — обовʼязково для cookie з credentials
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(passport.initialize());

// Health-check — перевіряє, що сервер і база даних живі.
app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', db: 'connected' } });
  } catch {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Database not reachable' } });
  }
});

// Модулі.
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/obligations', obligationsRoutes);
app.use('/api/v1/geo', geoRoutes);
app.use('/api/v1/billing', billingRoutes);

// Централізований обробник помилок — завжди останній.
app.use(errorHandler);
