-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(512) NOT NULL,
    `description` TEXT NOT NULL,
    `image` JSON NULL,
    `userId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `toUserId` VARCHAR(36) NULL,
    `authorizationRequestId` VARCHAR(36) NULL,
    `locationId` VARCHAR(36) NULL,
    `notificationType` ENUM('massive', 'panic', 'authorization', 'reservation', 'user', 'monitoring') NOT NULL,
    `emergency` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sendAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromLot` VARCHAR(32) NULL,
    `toLot` VARCHAR(32) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationCustomer` (
    `id` VARCHAR(36) NOT NULL,
    `notificationId` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_authorizationRequestId_fkey` FOREIGN KEY (`authorizationRequestId`) REFERENCES `EventAuthorizationRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationCustomer` ADD CONSTRAINT `NotificationCustomer_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationCustomer` ADD CONSTRAINT `NotificationCustomer_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
