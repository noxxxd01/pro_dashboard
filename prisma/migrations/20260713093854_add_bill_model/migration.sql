-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billName" TEXT NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'Electricity Bill',
    "fileUrl" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "disconnectionDate" TIMESTAMP(3),
    "status" BOOLEAN NOT NULL DEFAULT false,
    "datePaid" TIMESTAMP(3),
    "remarks" TEXT,
    "orLabel" TEXT,
    "orFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);
