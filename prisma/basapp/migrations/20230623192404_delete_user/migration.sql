-- AlterTable
ALTER TABLE `UserDeleted` ADD COLUMN `authorizedUserId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `UserDeleted` ADD CONSTRAINT `UserDeleted_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
