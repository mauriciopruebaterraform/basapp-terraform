-- CreateTable
CREATE TABLE `ExternalService` (
    `id` VARCHAR(36) NOT NULL,
    `attributes` JSON NULL,
    `geolocation` JSON NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `removed` BOOLEAN NOT NULL DEFAULT false,
    `uniqueId` VARCHAR(36) NULL,
    `alertId` VARCHAR(36) NOT NULL,
    `service` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExternalService` ADD CONSTRAINT `ExternalService_alertId_fkey` FOREIGN KEY (`alertId`) REFERENCES `Alert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
