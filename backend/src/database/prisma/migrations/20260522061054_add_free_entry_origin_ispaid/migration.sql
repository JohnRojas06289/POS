-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "wompiReference" TEXT;

-- AlterTable
ALTER TABLE "tenant"."Expense" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tenant"."Order" ADD COLUMN     "isFreeEntry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'counter';
