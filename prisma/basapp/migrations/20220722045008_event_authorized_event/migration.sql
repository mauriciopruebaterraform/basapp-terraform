-- CreateTable
CREATE TABLE `EventAuthorizationRequest` (
    `id` VARCHAR(36) NOT NULL,
    `sentBySms` BOOLEAN NOT NULL DEFAULT false,
    `text` VARCHAR(512) NULL,
    `authorized` VARCHAR(512) NULL,
    `lot` VARCHAR(512) NULL,
    `confirmed` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(36) NULL,
    `monitorId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `eventTypeId` VARCHAR(36) NOT NULL,
    `authorizedUserId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_monitorId_fkey` FOREIGN KEY (`monitorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_eventTypeId_fkey` FOREIGN KEY (`eventTypeId`) REFERENCES `EventType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAuthorizationRequest` ADD CONSTRAINT `EventAuthorizationRequest_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
