-- AlterTable
ALTER TABLE "Target" ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2026;

-- Drop the backfill default so future inserts must supply the year explicitly
ALTER TABLE "Target" ALTER COLUMN "year" DROP DEFAULT;
