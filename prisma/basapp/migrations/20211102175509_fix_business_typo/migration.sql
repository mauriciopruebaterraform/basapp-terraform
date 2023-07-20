/*
  Warnings:

  - You are about to alter the column `type` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `Enum("Customer_type")` to `Enum("Customer_type")`.

*/
-- AlterTable
ALTER TABLE `Customer` MODIFY `type` ENUM('business', 'government') NOT NULL DEFAULT 'business';
