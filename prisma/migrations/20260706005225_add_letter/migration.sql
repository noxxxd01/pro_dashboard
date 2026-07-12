-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "bureauOptionId" TEXT,
    "receivedDate" TIMESTAMP(3),
    "statusOptionId" TEXT,
    "response" TEXT,
    "noResponseNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_bureauOptionId_fkey" FOREIGN KEY ("bureauOptionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_statusOptionId_fkey" FOREIGN KEY ("statusOptionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
