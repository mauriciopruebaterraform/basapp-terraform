/*
  Warnings:

  - Added the required column `doubleConfirmMessage` to the `CustomerSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CustomerSettings` ADD COLUMN `doubleConfirmMessage` VARCHAR(521) NOT NULL,
    ADD COLUMN `doubleConfirmRequired` BOOLEAN NOT NULL DEFAULT false;
