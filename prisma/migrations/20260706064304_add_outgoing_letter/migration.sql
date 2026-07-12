-- CreateTable
CREATE TABLE "OutGoingLetter" (
    "id" TEXT NOT NULL,
    "requestLetterId" TEXT NOT NULL,
    "responseLetterName" TEXT NOT NULL,
    "bureauOptionId" TEXT,
    "sentDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutGoingLetter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OutGoingLetter" ADD CONSTRAINT "OutGoingLetter_requestLetterId_fkey" FOREIGN KEY ("requestLetterId") REFERENCES "Letter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutGoingLetter" ADD CONSTRAINT "OutGoingLetter_bureauOptionId_fkey" FOREIGN KEY ("bureauOptionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
