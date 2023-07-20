-- CreateTable
CREATE TABLE `NeighborhoodAlarm` (
    `id` VARCHAR(36) NOT NULL,
    `urgencyNumber` VARCHAR(191) NULL,
    `approximateAddress` VARCHAR(191) NULL,
    `geolocation` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NeighborhoodAlarmUsers` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `neighborhoodAlarmId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NeighborhoodAlarm` ADD CONSTRAINT `NeighborhoodAlarm_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeighborhoodAlarm` ADD CONSTRAINT `NeighborhoodAlarm_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeighborhoodAlarmUsers` ADD CONSTRAINT `NeighborhoodAlarmUsers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NeighborhoodAlarmUsers` ADD CONSTRAINT `NeighborhoodAlarmUsers_neighborhoodAlarmId_fkey` FOREIGN KEY (`neighborhoodAlarmId`) REFERENCES `NeighborhoodAlarm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
