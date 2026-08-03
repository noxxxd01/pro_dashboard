ALTER TABLE "ReleasedSupply" DROP COLUMN "unit",
ADD COLUMN     "office" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "province" TEXT;
