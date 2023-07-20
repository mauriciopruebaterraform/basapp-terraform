/*
  Warnings:

  - You are about to alter the column `type` on the `Location` table. The data in that column could be lost. The data in that column will be cast from `Json` to `Enum("Location_type")`.

*/
-- AlterTable
ALTER TABLE `Location` MODIFY `type` ENUM('locality', 'neighborhood') NOT NULL;
