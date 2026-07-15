/*
  Warnings:

  - You are about to drop the column `value` on the `Target` table. All the data in the column will be lost.
  - Added the required column `target1stDistrict` to the `Target` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target2ndDistrict` to the `Target` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Target" DROP COLUMN "value",
ADD COLUMN     "target1stDistrict" INTEGER NOT NULL,
ADD COLUMN     "target2ndDistrict" INTEGER NOT NULL;
