-- AlterTable
ALTER TABLE `Event` ADD COLUMN `reservationId` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `Reservation` (
    `id` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `inactiveToDate` DATETIME(3) NULL,
    `cancelDate` DATETIME(3) NULL,
    `numberOfGuests` INTEGER NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(512) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `authorizedUserId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `reservationTypeId` VARCHAR(191) NOT NULL,
    `reservationModeId` VARCHAR(191) NOT NULL,
    `reservationSpaceId` VARCHAR(191) NOT NULL,
    `eventStateId` VARCHAR(191) NOT NULL,
    `file` JSON NULL,
    `noUser` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_reservationTypeId_fkey` FOREIGN KEY (`reservationTypeId`) REFERENCES `ReservationType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_eventStateId_fkey` FOREIGN KEY (`eventStateId`) REFERENCES `EventState`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_reservationSpaceId_fkey` FOREIGN KEY (`reservationSpaceId`) REFERENCES `ReservationSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_reservationModeId_fkey` FOREIGN KEY (`reservationModeId`) REFERENCES `ReservationMode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_authorizedUserId_fkey` FOREIGN KEY (`authorizedUserId`) REFERENCES `AuthorizedUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
