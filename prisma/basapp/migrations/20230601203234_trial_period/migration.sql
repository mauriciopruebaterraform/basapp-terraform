-- AlterTable
ALTER TABLE `Event` ADD COLUMN `trialPeriod` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `EventAuthorizationRequest` ADD COLUMN `trialPeriod` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `trialPeriod` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `trialPeriod` BOOLEAN NOT NULL DEFAULT false;
