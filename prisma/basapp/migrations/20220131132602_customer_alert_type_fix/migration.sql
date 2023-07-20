-- DropForeignKey
ALTER TABLE `CustomerAlertType` DROP FOREIGN KEY `CustomerAlertType_customerId_fkey`;

-- AddForeignKey
ALTER TABLE `CustomerAlertType` ADD CONSTRAINT `CustomerAlertType_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
