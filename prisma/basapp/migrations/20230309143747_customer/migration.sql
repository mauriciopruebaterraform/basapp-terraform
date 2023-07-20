/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `verifyBySms` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_name_key` ON `Customer`(`name`);
