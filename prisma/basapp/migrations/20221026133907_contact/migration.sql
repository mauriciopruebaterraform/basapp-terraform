-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(36) NOT NULL,
    `phoneNumber` VARCHAR(32) NOT NULL,
    `deviceContact` JSON NULL,
    `contactUserId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Contact_phoneNumber_userId_key`(`phoneNumber`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactAlertType` (
    `id` VARCHAR(36) NOT NULL,
    `contactId` VARCHAR(36) NOT NULL,
    `alertTypeId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_contactUserId_fkey` FOREIGN KEY (`contactUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactAlertType` ADD CONSTRAINT `ContactAlertType_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactAlertType` ADD CONSTRAINT `ContactAlertType_alertTypeId_fkey` FOREIGN KEY (`alertTypeId`) REFERENCES `AlertType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
