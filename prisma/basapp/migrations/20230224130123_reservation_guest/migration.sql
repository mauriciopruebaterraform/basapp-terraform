-- CreateTable
CREATE TABLE `ReservationGuests` (
    `id` VARCHAR(36) NOT NULL,
    `fullName` VARCHAR(512) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `removed` BOOLEAN NOT NULL DEFAULT false,
    `authorizedUserId` VARCHAR(36) NOT NULL,
    `reservationId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReservationGuests` ADD CONSTRAINT `ReservationGuests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationGuests` ADD CONSTRAINT `ReservationGuests_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationGuests` ADD CONSTRAINT `ReservationGuests_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
