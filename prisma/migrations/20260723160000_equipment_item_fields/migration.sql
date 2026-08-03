ALTER TABLE "EquipmentItem" ADD COLUMN     "dateAcquired" TIMESTAMP(3),
ADD COLUMN     "estimatedUsefulLife" TEXT,
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "remarks" TEXT;
