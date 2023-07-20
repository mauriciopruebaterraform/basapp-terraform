/*
  Warnings:

  - A unique constraint covering the columns `[code,customerId]` on the table `ReservationType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ReservationType_code_customerId_key` ON `ReservationType`(`code`, `customerId`);
