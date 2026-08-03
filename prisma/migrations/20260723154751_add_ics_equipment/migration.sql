-- CreateTable
CREATE TABLE "InventoryCustodianSlip" (
    "id" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "poNumber" TEXT,
    "province" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCustodianSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "icsId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "description" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "unitCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_icsId_fkey" FOREIGN KEY ("icsId") REFERENCES "InventoryCustodianSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
