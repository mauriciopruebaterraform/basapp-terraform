/*
  Warnings:

  - You are about to alter the column `gvEntryTypeId` on the `EventType` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - You are about to alter the column `gvGuestTypeId` on the `EventType` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `Int`.
  - Made the column `title` on table `EventType` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customerId` on table `EventType` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `EventType` DROP FOREIGN KEY `EventType_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `EventType` DROP FOREIGN KEY `EventType_eventCategoryId_fkey`;

-- AlterTable
ALTER TABLE `EventType` MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `customerId` VARCHAR(36) NOT NULL,
    MODIFY `gvEntryTypeId` INTEGER NULL,
    MODIFY `gvGuestTypeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `EventType` ADD CONSTRAINT `EventType_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventType` ADD CONSTRAINT `EventType_eventCategoryId_fkey` FOREIGN KEY (`eventCategoryId`) REFERENCES `CustomerEventCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
