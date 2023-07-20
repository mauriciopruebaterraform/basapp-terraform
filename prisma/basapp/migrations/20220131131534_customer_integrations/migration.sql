-- CreateTable
CREATE TABLE `CustomerIntegration` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedById` VARCHAR(36) NOT NULL,
    `traccarUsername` VARCHAR(191) NULL,
    `traccarPassword` VARCHAR(191) NULL,
    `traccarUrl` VARCHAR(191) NULL,
    `icmUrl` VARCHAR(191) NULL,
    `icmToken` VARCHAR(191) NULL,
    `giroVisionId` VARCHAR(191) NULL,
    `neighborhoodAlarm` BOOLEAN NULL,
    `neighborhoodAlarmLink` VARCHAR(191) NULL,
    `neighborhoodAlarmKey` VARCHAR(191) NULL,

    UNIQUE INDEX `CustomerIntegration_customerId_key`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerIntegration` ADD CONSTRAINT `CustomerIntegration_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerIntegration` ADD CONSTRAINT `CustomerIntegration_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
