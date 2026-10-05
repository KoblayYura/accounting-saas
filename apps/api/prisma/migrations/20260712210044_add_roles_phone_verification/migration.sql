-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'head_accountant', 'accountant', 'client');

-- AlterTable: add role, phone, is_verified
ALTER TABLE "accountants" ADD COLUMN "phone" TEXT;
ALTER TABLE "accountants" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'head_accountant';
ALTER TABLE "accountants" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: наявні акаунти вважаємо верифікованими (щоб не блокувати вхід)
UPDATE "accountants" SET "is_verified" = true;

-- Акаунт "admin" → super_admin (бачить усе)
UPDATE "accountants" SET "role" = 'super_admin' WHERE "login" = 'admin';

-- CreateTable: email_verification_tokens
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");
CREATE INDEX "email_verification_tokens_accountant_id_idx" ON "email_verification_tokens"("accountant_id");

ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_accountant_id_fkey"
  FOREIGN KEY ("accountant_id") REFERENCES "accountants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
