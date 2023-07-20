-- CreateTable
CREATE TABLE `ICMService` (
    `id` VARCHAR(36) NOT NULL,
    `request` VARCHAR(191) NULL,
    `response` VARCHAR(191) NULL,
    `externalReference` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ICMService` ADD CONSTRAINT `ICMService_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
