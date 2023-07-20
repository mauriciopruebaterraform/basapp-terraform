-- CreateTable
CREATE TABLE `AlertType` (
    `id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerAlertType` (
    `customerId` VARCHAR(36) NOT NULL,
    `alertTypeId` VARCHAR(36) NOT NULL,
    `order` INTEGER NOT NULL,

    PRIMARY KEY (`customerId`, `alertTypeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerAlertType` ADD CONSTRAINT `CustomerAlertType_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerAlertType` ADD CONSTRAINT `CustomerAlertType_alertTypeId_fkey` FOREIGN KEY (`alertTypeId`) REFERENCES `AlertType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
