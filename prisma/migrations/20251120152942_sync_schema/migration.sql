/*
  Warnings:

  - The values [MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `approved_by` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `rejected_by` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_by` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'PENDING_EDIT';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'OPERATOR');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
COMMIT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "proposed_changes" JSONB;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "approved_by",
DROP COLUMN "rejected_by",
DROP COLUMN "submitted_by",
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "edit_request_reason" TEXT,
ADD COLUMN     "original_data" JSONB,
ADD COLUMN     "proposed_changes" JSONB,
ADD COLUMN     "rejected_by_id" TEXT,
ADD COLUMN     "requested_at" TIMESTAMP(3),
ADD COLUMN     "requested_by_id" TEXT,
ADD COLUMN     "submitted_by_id" TEXT;

-- CreateIndex
CREATE INDEX "transactions_submitted_by_id_idx" ON "transactions"("submitted_by_id");

-- CreateIndex
CREATE INDEX "transactions_approved_by_id_idx" ON "transactions"("approved_by_id");

-- CreateIndex
CREATE INDEX "transactions_rejected_by_id_idx" ON "transactions"("rejected_by_id");

-- CreateIndex
CREATE INDEX "transactions_requested_by_id_idx" ON "transactions"("requested_by_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
