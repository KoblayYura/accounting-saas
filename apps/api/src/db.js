// src/db.js
// Єдиний екземпляр Prisma Client на весь бекенд-застосунок.
// Імпортувати цей файл у контролерах/сервісах замість створення `new PrismaClient()` в кожному місці.

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };

// Приклад використання в іншому файлі:
//   const { prisma } = require('./db');
//   const clients = await prisma.client.findMany({ where: { accountantId, isActive: true } });
