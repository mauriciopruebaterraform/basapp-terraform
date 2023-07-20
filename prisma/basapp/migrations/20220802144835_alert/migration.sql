-- CreateTable
CREATE TABLE `Alert` (
    `id` VARCHAR(36) NOT NULL,
    `alertTypeId` VARCHAR(36) NOT NULL,
    `geolocation` JSON NOT NULL,
    `approximateAddress` VARCHAR(512) NULL,
    `alertStateId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `alertStateUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` VARCHAR(36) NOT NULL,
    `geolocations` JSON NOT NULL,
    `observations` VARCHAR(512) NULL,
    `parentId` VARCHAR(36) NULL,
    `trialPeriod` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_alertStateId_fkey` FOREIGN KEY (`alertStateId`) REFERENCES `AlertState`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_alertTypeId_fkey` FOREIGN KEY (`alertTypeId`) REFERENCES `AlertType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
