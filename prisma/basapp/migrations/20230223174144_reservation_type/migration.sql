-- AlterTable
ALTER TABLE `ReservationType` ADD COLUMN `allowsSimultaneous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `daysSecondTime` INTEGER NULL,
    ADD COLUMN `pendingPerLot` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `requireConfirmation` BOOLEAN NOT NULL DEFAULT false;
