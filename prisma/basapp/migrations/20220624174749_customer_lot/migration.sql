-- CreateTable
CREATE TABLE `CustomerLot` (
    `id` VARCHAR(36) NOT NULL,
    `lot` VARCHAR(191) NULL,
    `icmLot` VARCHAR(191) NULL,
    `icmUid` VARCHAR(36) NULL,
    `customerId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerLot` ADD CONSTRAINT `CustomerLot_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
