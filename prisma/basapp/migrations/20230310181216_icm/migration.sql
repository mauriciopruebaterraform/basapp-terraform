-- AlterTable
ALTER TABLE `Event` ADD COLUMN `isDelivery` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `EventType` ADD COLUMN `icmDeliveryType` VARCHAR(191) NULL,
    ADD COLUMN `isDelivery` BOOLEAN NOT NULL DEFAULT false;
