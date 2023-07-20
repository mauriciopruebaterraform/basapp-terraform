-- CreateTable
CREATE TABLE `CustomerSettings` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedById` VARCHAR(36) NOT NULL,
    `minAccuracy` INTEGER NULL,
    `maxAccuracy` INTEGER NULL,
    `perimeterViolationNumbers` VARCHAR(191) NULL,
    `alarmActivatedNumbers` VARCHAR(191) NULL,
    `badCompanyNumbers` VARCHAR(191) NULL,
    `panicNumbers` VARCHAR(191) NULL,
    `publicViolenceNumbers` VARCHAR(191) NULL,
    `kidnappingNumbers` VARCHAR(191) NULL,
    `fireNumbers` VARCHAR(191) NULL,
    `healthEmergencyNumbers` VARCHAR(191) NULL,
    `genderViolenceNumbers` VARCHAR(191) NULL,
    `robberyNumbers` VARCHAR(191) NULL,
    `fire` VARCHAR(191) NULL,
    `healthEmergency` VARCHAR(191) NULL,
    `robbery` VARCHAR(191) NULL,
    `publicViolence` VARCHAR(191) NULL,
    `securityGuard` VARCHAR(191) NULL,
    `securityChief` VARCHAR(191) NULL,
    `additionalNotifications` VARCHAR(191) NULL,
    `panicKey` VARCHAR(191) NULL,
    `panicNotifications` VARCHAR(191) NULL,
    `reservationEmail` VARCHAR(191) NULL,
    `receiveAlertsFromOutside` BOOLEAN NOT NULL DEFAULT false,
    `daysToShow` VARCHAR(191) NULL,
    `validateUsers` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `CustomerSettings_customerId_key`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerSettings` ADD CONSTRAINT `CustomerSettings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerSettings` ADD CONSTRAINT `CustomerSettings_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
