-- Module 02: тариф щомісячного обслуговування клієнта (monthly_fee).
-- Nullable — наявні клієнти лишаються без тарифу; задається при створенні,
-- змінюється лише head_accountant (див. module-02-clients/backend.md).
ALTER TABLE "clients" ADD COLUMN "monthly_fee" DECIMAL(10,2);
