/*
  Warnings:

  - Made the column `username` on table `AuthorizedUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `AuthorizedUser` MODIFY `username` VARCHAR(191) NOT NULL;
