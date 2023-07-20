/*
  Warnings:

  - A unique constraint covering the columns `[username,customerType]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_username_key` ON `User`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `customerType` ENUM('business', 'government') NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_customerType_key` ON `User`(`username`, `customerType`);
