-- CreateTable
CREATE TABLE `UsefulInformation` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `attachment` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `isCategory` BOOLEAN NOT NULL DEFAULT false,
    `categoryId` VARCHAR(36) NULL,
    `link` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `updatedById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UsefulInformation` ADD CONSTRAINT `UsefulInformation_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsefulInformation` ADD CONSTRAINT `UsefulInformation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsefulInformation` ADD CONSTRAINT `UsefulInformation_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `UsefulInformation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
