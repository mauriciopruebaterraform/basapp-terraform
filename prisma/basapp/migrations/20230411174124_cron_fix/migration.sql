/*
  Warnings:

  - You are about to drop the column `warnings` on the `Cron` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Cron` DROP COLUMN `warnings`,
    ADD COLUMN `message` VARCHAR(191) NULL;
