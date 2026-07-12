/*
  Warnings:

  - You are about to drop the column `statusOptionId` on the `Letter` table. All the data in the column will be lost.
  - Made the column `response` on table `Letter` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Letter" DROP CONSTRAINT "Letter_statusOptionId_fkey";

-- AlterTable
ALTER TABLE "Letter" DROP COLUMN "statusOptionId",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'For Signature',
ALTER COLUMN "response" SET NOT NULL,
ALTER COLUMN "response" SET DEFAULT '-';
