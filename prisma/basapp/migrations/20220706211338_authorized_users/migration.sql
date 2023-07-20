/*
  Warnings:

  - A unique constraint covering the columns `[username,customerId]` on the table `AuthorizedUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `AuthorizedUser` MODIFY `description` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `AuthorizedUser_username_customerId_key` ON `AuthorizedUser`(`username`, `customerId`);
