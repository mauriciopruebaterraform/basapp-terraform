-- CreateTable
CREATE TABLE `ReservationType` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `days` INTEGER NULL,
    `display` VARCHAR(191) NOT NULL,
    `groupCode` VARCHAR(191) NOT NULL,
    `numberOfPending` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `minDays` INTEGER NULL,
    `maxPerMonth` INTEGER NULL,
    `minDaysBetweenReservation` INTEGER NULL,
    `termsAndConditions` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReservationType` ADD CONSTRAINT `ReservationType_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
