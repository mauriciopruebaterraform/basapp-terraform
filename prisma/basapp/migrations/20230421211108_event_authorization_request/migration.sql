-- DropForeignKey
ALTER TABLE `EventAuthorizationRequest` DROP FOREIGN KEY `EventAuthorizationRequest_authorizedUserId_fkey`;

-- AlterTable
ALTER TABLE `EventAuthorizationRequest` MODIFY `authorizedUserId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
