/*
  Warnings:

  - Made the column `from` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `to` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `from` DATETIME(3) NOT NULL,
    MODIFY `to` DATETIME(3) NOT NULL,
    MODIFY `file` JSON NULL,
    MODIFY `dni` VARCHAR(512) NULL,
    MODIFY `qrCode` TEXT NULL,
    MODIFY `token` VARCHAR(36) NULL;
