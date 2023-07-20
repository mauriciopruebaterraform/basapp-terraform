-- CreateTable
CREATE TABLE `AuthorizedUser` (
    `id` VARCHAR(36) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `lot` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `sendEvents` BOOLEAN NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `customerId` VARCHAR(36) NOT NULL,
    `updatedById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expireDate` DATETIME(3) NULL,
    `isOwner` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthorizedUserReservationType` (
    `id` VARCHAR(36) NOT NULL,
    `authorizedUserId` VARCHAR(191) NOT NULL,
    `reservationTypeId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuthorizedUser` ADD CONSTRAINT `AuthorizedUser_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthorizedUser` ADD CONSTRAINT `AuthorizedUser_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthorizedUserReservationType` ADD CONSTRAINT `AuthorizedUserReservationType_reservationTypeId_fkey` FOREIGN KEY (`reservationTypeId`) REFERENCES `ReservationType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthorizedUserReservationType` ADD CONSTRAINT `AuthorizedUserReservationType_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
