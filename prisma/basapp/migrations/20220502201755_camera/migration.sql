-- CreateTable
CREATE TABLE `Camera` (
    `id` VARCHAR(36) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `geolocation` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedById` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `url` VARCHAR(191) NULL,

    UNIQUE INDEX `Camera_code_customerId_key`(`code`, `customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Camera` ADD CONSTRAINT `Camera_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Camera` ADD CONSTRAINT `Camera_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
