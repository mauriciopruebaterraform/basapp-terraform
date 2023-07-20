-- CreateTable
CREATE TABLE `ReservationMode` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maxDuration` INTEGER NULL,
    `maxPeople` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `attachList` BOOLEAN NOT NULL DEFAULT false,
    `allowGuests` BOOLEAN NOT NULL DEFAULT false,
    `allParticipantsRequired` BOOLEAN NOT NULL DEFAULT false,
    `inactivityTime` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `maxPerMonth` INTEGER NULL,
    `email` VARCHAR(191) NULL,
    `reservationTypeId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `updatedById` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReservationSpaceReservationMode` (
    `reservationModeId` VARCHAR(36) NOT NULL,
    `reservationSpaceId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`reservationModeId`, `reservationSpaceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReservationMode` ADD CONSTRAINT `ReservationMode_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationMode` ADD CONSTRAINT `ReservationMode_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationMode` ADD CONSTRAINT `ReservationMode_reservationTypeId_fkey` FOREIGN KEY (`reservationTypeId`) REFERENCES `ReservationType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationSpaceReservationMode` ADD CONSTRAINT `ReservationSpaceReservationMode_reservationSpaceId_fkey` FOREIGN KEY (`reservationSpaceId`) REFERENCES `ReservationSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationSpaceReservationMode` ADD CONSTRAINT `ReservationSpaceReservationMode_reservationModeId_fkey` FOREIGN KEY (`reservationModeId`) REFERENCES `ReservationMode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
