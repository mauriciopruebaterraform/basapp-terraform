/*
  Warnings:

  - A unique constraint covering the columns `[code,customerId]` on the table `EventType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `EventType_code_customerId_key` ON `EventType`(`code`, `customerId`);
