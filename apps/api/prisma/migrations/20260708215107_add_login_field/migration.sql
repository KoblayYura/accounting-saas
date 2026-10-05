-- AlterTable: add nullable unique login to accountants
ALTER TABLE "accountants" ADD COLUMN "login" TEXT;

-- CreateIndex: unique constraint (nullable — multiple NULLs allowed in Postgres)
CREATE UNIQUE INDEX "accountants_login_key" ON "accountants"("login");
