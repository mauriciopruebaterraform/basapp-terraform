-- CreateTable
CREATE TABLE `Cron` (
    `id` VARCHAR(36) NOT NULL,
    `modifiedRecords` INTEGER NULL,
    `warnings` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
