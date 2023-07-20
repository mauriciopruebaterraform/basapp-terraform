-- DropForeignKey
ALTER TABLE `Reservation` DROP FOREIGN KEY `Reservation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ReservationGuests` DROP FOREIGN KEY `ReservationGuests_authorizedUserId_fkey`;

-- DropForeignKey
ALTER TABLE `ReservationGuests` DROP FOREIGN KEY `ReservationGuests_userId_fkey`;

-- AlterTable
ALTER TABLE `Reservation` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ReservationGuests` MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `authorizedUserId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationGuests` ADD CONSTRAINT `ReservationGuests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationGuests` ADD CONSTRAINT `ReservationGuests_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
