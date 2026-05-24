/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `BalanceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `BalanceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BalanceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `BalanceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requestedById` on the `BalanceRequest` table. All the data in the column will be lost.
  - The `status` column on the `BalanceRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `rejectReason` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Expense` table. All the data in the column will be lost.
  - The `status` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `agoPrice` on the `FuelPrice` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `FuelPrice` table. All the data in the column will be lost.
  - You are about to drop the column `pmsPrice` on the `FuelPrice` table. All the data in the column will be lost.
  - You are about to drop the column `setById` on the `FuelPrice` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SalesReport` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SalesReport` table. All the data in the column will be lost.
  - The `status` column on the `SalesReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requesterId` to the `BalanceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `BalanceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ago` to the `FuelPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pms` to the `FuelPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FuelPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agoSales` to the `SalesReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `SalesReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pmsSales` to the `SalesReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPayments` to the `SalesReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `submittedAt` on table `SalesReport` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `balance` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EXPENSE', 'PRICE', 'BALANCE', 'SECURITY', 'USER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PMS', 'AGO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "UserStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "BalanceRequest" DROP CONSTRAINT "BalanceRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "BalanceRequest" DROP CONSTRAINT "BalanceRequest_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "FuelPrice" DROP CONSTRAINT "FuelPrice_setById_fkey";

-- DropIndex
DROP INDEX "SalesReport_branchId_date_key";

-- DropIndex
DROP INDEX "Transaction_reference_key";

-- AlterTable
ALTER TABLE "BalanceRequest" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "requestedById",
ADD COLUMN     "adminPin" TEXT,
ADD COLUMN     "approvedTime" TIMESTAMP(3),
ADD COLUMN     "pinUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "requesterId" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "content",
DROP COLUMN "roomId",
ADD COLUMN     "text" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "approvedAt",
DROP COLUMN "rejectReason",
DROP COLUMN "submittedById",
DROP COLUMN "updatedAt",
ADD COLUMN     "managerId" TEXT NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "FuelPrice" DROP COLUMN "agoPrice",
DROP COLUMN "createdAt",
DROP COLUMN "pmsPrice",
DROP COLUMN "setById",
ADD COLUMN     "ago" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pms" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SalesReport" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "agoSales" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "pmsSales" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalPayments" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "submittedAt" SET NOT NULL,
ALTER COLUMN "submittedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "valueDate" TIMESTAMP(3),
ALTER COLUMN "reference" DROP NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropEnum
DROP TYPE "BalanceRequestStatus";

-- DropEnum
DROP TYPE "ExpenseStatus";

-- DropEnum
DROP TYPE "SalesReportStatus";

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "pms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ago" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "product" "ProductType" NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccessRequest" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedTime" TIMESTAMP(3),
    "loginUsername" TEXT,
    "loginPassword" TEXT,
    "expiresAt" TIMESTAMP(3),
    "requesterId" TEXT NOT NULL,

    CONSTRAINT "BankAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceRequest" ADD CONSTRAINT "BalanceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccessRequest" ADD CONSTRAINT "BankAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
