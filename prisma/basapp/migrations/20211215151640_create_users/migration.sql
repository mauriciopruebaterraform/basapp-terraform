/*
  Warnings:

  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN `fullName` VARCHAR(191) NOT NULL,
    ADD COLUMN `image` JSON NULL,
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `lot` VARCHAR(191) NULL,
    ADD COLUMN `updatedById` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `EventType` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `EventType_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermission` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alerts` BOOLEAN NOT NULL DEFAULT false,
    `events` BOOLEAN NOT NULL DEFAULT false,
    `notifications` BOOLEAN NOT NULL DEFAULT false,
    `users` BOOLEAN NOT NULL DEFAULT false,
    `configurations` BOOLEAN NOT NULL DEFAULT false,
    `authorizedUsers` BOOLEAN NOT NULL DEFAULT false,
    `cameras` BOOLEAN NOT NULL DEFAULT false,
    `alertStates` BOOLEAN NOT NULL DEFAULT false,
    `eventTypes` BOOLEAN NOT NULL DEFAULT false,
    `eventStates` BOOLEAN NOT NULL DEFAULT false,
    `eventKey` BOOLEAN NOT NULL DEFAULT false,
    `usefulInformation` BOOLEAN NOT NULL DEFAULT false,
    `protocols` BOOLEAN NOT NULL DEFAULT false,
    `statesmanEvents` BOOLEAN NOT NULL DEFAULT false,
    `reservations` BOOLEAN NOT NULL DEFAULT false,
    `lots` BOOLEAN NOT NULL DEFAULT false,
    `locations` BOOLEAN NOT NULL DEFAULT false,
    `integrations` BOOLEAN NOT NULL DEFAULT false,
    `receiveEvents` BOOLEAN NOT NULL DEFAULT false,
    `createEvents` BOOLEAN NOT NULL DEFAULT false,
    `createReservations` BOOLEAN NOT NULL DEFAULT false,
    `sendNotification` BOOLEAN NOT NULL DEFAULT false,
    `panicButton` BOOLEAN NOT NULL DEFAULT false,
    `enableTraccar` BOOLEAN NOT NULL DEFAULT false,
    `visitorsQueue` BOOLEAN NOT NULL DEFAULT false,
    `requestAuthorization` BOOLEAN NOT NULL DEFAULT false,
    `visitorsEventTypeId` VARCHAR(36) NULL,
    `authorizationEventTypeId` VARCHAR(36) NULL,

    UNIQUE INDEX `UserPermission_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AlertTypeToUserPermission` (
    `A` VARCHAR(36) NOT NULL,
    `B` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `_AlertTypeToUserPermission_AB_unique`(`A`, `B`),
    INDEX `_AlertTypeToUserPermission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventTypeToUserPermission` (
    `A` VARCHAR(36) NOT NULL,
    `B` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `_EventTypeToUserPermission_AB_unique`(`A`, `B`),
    INDEX `_EventTypeToUserPermission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_visitorsEventTypeId_fkey` FOREIGN KEY (`visitorsEventTypeId`) REFERENCES `EventType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_authorizationEventTypeId_fkey` FOREIGN KEY (`authorizationEventTypeId`) REFERENCES `EventType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AlertTypeToUserPermission` ADD FOREIGN KEY (`A`) REFERENCES `AlertType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AlertTypeToUserPermission` ADD FOREIGN KEY (`B`) REFERENCES `UserPermission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventTypeToUserPermission` ADD FOREIGN KEY (`A`) REFERENCES `EventType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventTypeToUserPermission` ADD FOREIGN KEY (`B`) REFERENCES `UserPermission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
