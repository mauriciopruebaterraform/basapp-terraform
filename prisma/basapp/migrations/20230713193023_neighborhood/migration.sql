-- AlterTable
ALTER TABLE `Alert` ADD COLUMN `neighborhoodAlarmId` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_neighborhoodAlarmId_fkey` FOREIGN KEY (`neighborhoodAlarmId`) REFERENCES `NeighborhoodAlarm`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
