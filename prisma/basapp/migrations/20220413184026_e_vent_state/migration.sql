-- DropForeignKey
ALTER TABLE `EventState` DROP FOREIGN KEY `EventState_customerId_fkey`;

-- AlterTable
ALTER TABLE `EventState` MODIFY `customerId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `EventState` ADD CONSTRAINT `EventState_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
