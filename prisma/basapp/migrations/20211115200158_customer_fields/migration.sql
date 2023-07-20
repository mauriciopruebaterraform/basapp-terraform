/*
  Warnings:

  - A unique constraint covering the columns `[secretKey]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `country` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedById` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `country` VARCHAR(191) NOT NULL,
    ADD COLUMN `countryCode` VARCHAR(191),
    ADD COLUMN `district` VARCHAR(191) NOT NULL,
    ADD COLUMN `image` JSON,
    ADD COLUMN `notes` VARCHAR(100),
    ADD COLUMN `parentId` VARCHAR(36),
    ADD COLUMN `phoneLength` INTEGER,
    ADD COLUMN `secretKey` VARCHAR(191),
    ADD COLUMN `speed` VARCHAR(3),
    ADD COLUMN `state` VARCHAR(191) NOT NULL,
    ADD COLUMN `timezone` VARCHAR(191),
    ADD COLUMN `trialPeriod` BOOLEAN DEFAULT false,
    ADD COLUMN `updatedById` VARCHAR(36) NOT NULL,
    ADD COLUMN `url` VARCHAR(191);

-- CreateIndex
CREATE UNIQUE INDEX `Customer_secretKey_key` ON `Customer`(`secretKey`);

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
