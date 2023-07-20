-- AlterTable
ALTER TABLE `User` ADD COLUMN `removed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `removedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `UserDeleted` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `deletionRequestedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserDeleted` ADD CONSTRAINT `UserDeleted_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDeleted` ADD CONSTRAINT `UserDeleted_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
