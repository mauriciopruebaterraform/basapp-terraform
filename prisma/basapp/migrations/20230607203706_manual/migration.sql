/*
  Warnings:

  - Made the column `manual` on table `Alert` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Alert` MODIFY `manual` BOOLEAN NOT NULL DEFAULT false;
