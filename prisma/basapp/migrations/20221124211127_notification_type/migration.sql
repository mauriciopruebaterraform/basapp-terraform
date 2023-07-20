-- AlterTable
ALTER TABLE `Notification` MODIFY `notificationType` ENUM('massive', 'panic', 'authorization', 'reservation', 'user', 'monitoring', 'alert', 'event') NOT NULL;
