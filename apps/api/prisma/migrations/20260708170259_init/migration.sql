-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('fop_group_1', 'fop_group_2', 'fop_group_3', 'tov');

-- CreateEnum
CREATE TYPE "Periodicity" AS ENUM ('monthly', 'quarterly', 'annual');

-- CreateEnum
CREATE TYPE "ObligationStatus" AS ENUM ('pending', 'collected', 'submitted', 'overdue');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('telegram', 'telegram_overdue');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'pro', 'unlimited');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'past_due');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateTable
CREATE TABLE "accountants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "name" TEXT NOT NULL,
    "telegram_chat_id" TEXT,
    "telegram_link_code" TEXT,
    "reminder_days_before" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accountants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "edrpou_or_inn" TEXT,
    "client_type" "ClientType" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligation_templates" (
    "id" TEXT NOT NULL,
    "client_type" "ClientType" NOT NULL,
    "name" TEXT NOT NULL,
    "periodicity" "Periodicity" NOT NULL,
    "deadline_day" INTEGER NOT NULL,
    "deadline_month_offset" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "obligation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligations" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "ObligationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "obligation_template_id" TEXT NOT NULL,
    "doc_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "obligation_id" TEXT NOT NULL,
    "doc_name" TEXT NOT NULL,
    "is_collected" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications_log" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "obligation_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'telegram',
    "sent_at" TIMESTAMP(3) NOT NULL,
    "message_text" TEXT,

    CONSTRAINT "notifications_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "client_limit" INTEGER NOT NULL DEFAULT 3,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "liqpay_order_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "accountant_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "liqpay_order_id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accountants_email_key" ON "accountants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accountants_google_id_key" ON "accountants"("google_id");

-- CreateIndex
CREATE INDEX "clients_accountant_id_idx" ON "clients"("accountant_id");

-- CreateIndex
CREATE INDEX "clients_accountant_id_is_active_idx" ON "clients"("accountant_id", "is_active");

-- CreateIndex
CREATE INDEX "obligations_client_id_idx" ON "obligations"("client_id");

-- CreateIndex
CREATE INDEX "obligations_due_date_idx" ON "obligations"("due_date");

-- CreateIndex
CREATE INDEX "obligations_status_idx" ON "obligations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "obligations_client_id_template_id_period_label_key" ON "obligations"("client_id", "template_id", "period_label");

-- CreateIndex
CREATE INDEX "checklist_items_obligation_id_idx" ON "checklist_items"("obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_log_obligation_id_channel_key" ON "notifications_log"("obligation_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_accountant_id_key" ON "subscriptions"("accountant_id");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "accountants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "obligation_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_obligation_template_id_fkey" FOREIGN KEY ("obligation_template_id") REFERENCES "obligation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "accountants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications_log" ADD CONSTRAINT "notifications_log_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "accountants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_accountant_id_fkey" FOREIGN KEY ("accountant_id") REFERENCES "accountants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
