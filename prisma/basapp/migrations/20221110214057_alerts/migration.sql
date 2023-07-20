-- AlterTable
ALTER TABLE `Alert` ADD COLUMN `attachment` JSON NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `dragged` BOOLEAN NULL,
    ADD COLUMN `manual` BOOLEAN NULL,
    ADD COLUMN `neighborhoodId` VARCHAR(36) NULL,
    ADD COLUMN `originalGeolocation` JSON NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    MODIFY `geolocations` JSON NULL;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_neighborhoodId_fkey` FOREIGN KEY (`neighborhoodId`) REFERENCES `Location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
