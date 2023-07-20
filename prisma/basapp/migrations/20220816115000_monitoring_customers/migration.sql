-- CreateTable
CREATE TABLE `MonitoringCustomer` (
    `id` VARCHAR(36) NOT NULL,
    `userPermissionId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonitoringCustomer` ADD CONSTRAINT `MonitoringCustomer_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonitoringCustomer` ADD CONSTRAINT `MonitoringCustomer_userPermissionId_fkey` FOREIGN KEY (`userPermissionId`) REFERENCES `UserPermission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
