-- CreateTable
CREATE TABLE `CustomerSections` (
    `id` VARCHAR(36) NOT NULL,
    `alerts` BOOLEAN NOT NULL DEFAULT true,
    `events` BOOLEAN NOT NULL DEFAULT true,
    `notifications` BOOLEAN NOT NULL DEFAULT true,
    `reservations` BOOLEAN NOT NULL DEFAULT true,
    `protocols` BOOLEAN NOT NULL DEFAULT true,
    `usefulInformation` BOOLEAN NOT NULL DEFAULT true,
    `integrations` BOOLEAN NOT NULL DEFAULT true,
    `lots` BOOLEAN NOT NULL DEFAULT true,
    `cameras` BOOLEAN NOT NULL DEFAULT true,
    `locations` BOOLEAN NOT NULL DEFAULT true,
    `customerId` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `CustomerSections_customerId_key`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerSections` ADD CONSTRAINT `CustomerSections_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
