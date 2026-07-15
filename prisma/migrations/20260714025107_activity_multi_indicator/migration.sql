-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "indicator";

-- AlterTable
ALTER TABLE "Target" ADD COLUMN     "measurementType" TEXT NOT NULL DEFAULT 'activities';

-- CreateTable
CREATE TABLE "ActivityIndicator" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ActivityIndicator_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActivityIndicator" ADD CONSTRAINT "ActivityIndicator_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
