-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClientType" ADD VALUE 'fop_general';
ALTER TYPE "ClientType" ADD VALUE 'tov_general';
ALTER TYPE "ClientType" ADD VALUE 'pp';
ALTER TYPE "ClientType" ADD VALUE 'self_employed';
ALTER TYPE "ClientType" ADD VALUE 'public_organization';
ALTER TYPE "ClientType" ADD VALUE 'charity_fund';
ALTER TYPE "ClientType" ADD VALUE 'osbb';

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "client_limit" SET DEFAULT 2;
