-- CreateTable
CREATE TABLE `ReservationLock` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `ignoreIfHoliday` BOOLEAN NOT NULL DEFAULT false,
    `date` DATETIME(3) NULL,
    `sun` JSON NULL,
    `mon` JSON NULL,
    `tue` JSON NULL,
    `wed` JSON NULL,
    `thu` JSON NULL,
    `fri` JSON NULL,
    `sat` JSON NULL,
    `holiday` JSON NULL,
    `holidayEve` JSON NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `reservationSpaceId` VARCHAR(36) NOT NULL,
    `reservationTypeId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReservationLock` ADD CONSTRAINT `ReservationLock_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationLock` ADD CONSTRAINT `ReservationLock_reservationSpaceId_fkey` FOREIGN KEY (`reservationSpaceId`) REFERENCES `ReservationSpace`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationLock` ADD CONSTRAINT `ReservationLock_reservationTypeId_fkey` FOREIGN KEY (`reservationTypeId`) REFERENCES `ReservationType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
