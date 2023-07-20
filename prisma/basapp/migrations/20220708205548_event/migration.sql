-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(36) NOT NULL,
    `from` DATETIME(3) NULL,
    `to` DATETIME(3) NULL,
    `fullName` VARCHAR(512) NULL,
    `description` VARCHAR(512) NULL,
    `observations` VARCHAR(512) NULL,
    `lot` VARCHAR(512) NULL,
    `changeLog` TEXT NOT NULL,
    `eventStateId` VARCHAR(191) NULL,
    `eventTypeId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `customerId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `file` JSON NOT NULL,
    `dni` VARCHAR(512) NOT NULL,
    `isPermanent` BOOLEAN NOT NULL DEFAULT false,
    `isCopy` BOOLEAN NOT NULL DEFAULT false,
    `statesmanId` VARCHAR(191) NULL,
    `authorizedUserId` VARCHAR(191) NULL,
    `monitorId` VARCHAR(191) NULL,
    `firstName` VARCHAR(512) NULL,
    `lastName` VARCHAR(512) NULL,
    `patent` VARCHAR(512) NULL,
    `qrCode` TEXT NOT NULL,
    `token` VARCHAR(36) NOT NULL,
    `qrPending` BOOLEAN NOT NULL DEFAULT false,
    `externalId` VARCHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_statesmanId_fkey` FOREIGN KEY (`statesmanId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_monitorId_fkey` FOREIGN KEY (`monitorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_eventTypeId_fkey` FOREIGN KEY (`eventTypeId`) REFERENCES `EventType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_eventStateId_fkey` FOREIGN KEY (`eventStateId`) REFERENCES `EventState`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
