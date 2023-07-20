-- AlterTable
ALTER TABLE `User` ADD COLUMN `authorizedUserId` VARCHAR(36) NULL,
    ADD COLUMN `comment` TEXT NULL,
    ADD COLUMN `emergencyNumber` VARCHAR(191) NULL,
    ADD COLUMN `homeAddress` JSON NULL,
    ADD COLUMN `idCard` VARCHAR(191) NULL,
    ADD COLUMN `lastAccessToMenu` DATETIME(3) NULL,
    ADD COLUMN `lastStateUpdatedTime` DATETIME(3) NULL,
    ADD COLUMN `pushId` VARCHAR(191) NULL,
    ADD COLUMN `stateUpdatedUserId` VARCHAR(36) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL,
    ADD COLUMN `workAddress` JSON NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_stateUpdatedUserId_fkey` FOREIGN KEY (`stateUpdatedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
