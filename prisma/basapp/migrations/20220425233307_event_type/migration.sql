/*
  Warnings:

  - Added the required column `updatedById` to the `EventType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EventType` ADD COLUMN `addToStatistics` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `additionalNotifications` VARCHAR(191) NULL,
    ADD COLUMN `allowsMultipleAuthorized` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `attachment` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `autoCancelAfterExpired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `customerId` VARCHAR(36) NULL,
    ADD COLUMN `description` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emergency` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `eventCategoryId` VARCHAR(36) NULL,
    ADD COLUMN `generateQr` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `gvEntryTypeId` VARCHAR(36) NULL,
    ADD COLUMN `gvGuestTypeId` VARCHAR(36) NULL,
    ADD COLUMN `isPermanent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lotFrom` VARCHAR(191) NULL,
    ADD COLUMN `lotTo` VARCHAR(191) NULL,
    ADD COLUMN `monitor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifyGiroVision` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifySecurityChief` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifySecurityGuard` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifyUser` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `qrFormat` INTEGER NULL,
    ADD COLUMN `requiresDni` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `requiresPatent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reservation` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedById` VARCHAR(36) NOT NULL,
    MODIFY `title` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `EventType` ADD CONSTRAINT `EventType_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventType` ADD CONSTRAINT `EventType_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventType` ADD CONSTRAINT `EventType_eventCategoryId_fkey` FOREIGN KEY (`eventCategoryId`) REFERENCES `EventCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
