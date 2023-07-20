/*
  Warnings:

  - Made the column `customerId` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_customerId_fkey`;

-- AlterTable
ALTER TABLE `Event` MODIFY `customerId` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `eventId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
