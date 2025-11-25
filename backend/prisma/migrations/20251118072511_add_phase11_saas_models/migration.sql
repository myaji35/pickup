-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER');

-- CreateEnum
CREATE TYPE "institution_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "shuttle_type" AS ENUM ('MORNING', 'EVENING', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "institutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_types" (
    "id" TEXT NOT NULL,
    "typeCode" VARCHAR(20) NOT NULL,
    "typeName" VARCHAR(50) NOT NULL,
    "minimumCareTimeHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "businessRegistrationNo" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "institutionTypeId" TEXT,
    "status" "institution_status" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "lastFourDigits" VARCHAR(4) NOT NULL,
    "passengerCapacity" INTEGER NOT NULL,
    "institutionId" TEXT NOT NULL,
    "currentGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_groups" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "groupCode" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "totalPassengerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "pickupAddress" VARCHAR(200) NOT NULL,
    "dropoffAddress" VARCHAR(200) NOT NULL,
    "shuttleType" "shuttle_type" NOT NULL,
    "institutionId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_schedules" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "pickupTime" VARCHAR(5) NOT NULL,
    "dropoffTime" VARCHAR(5) NOT NULL,
    "careTimeHours" DOUBLE PRECISION NOT NULL,
    "isCareTimeInsufficient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "maxVehicles" INTEGER,
    "maxPassengers" INTEGER,
    "monthlyPrice" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'TRIAL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_institutionId_idx" ON "users"("institutionId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "institution_types_typeCode_key" ON "institution_types"("typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_businessRegistrationNo_key" ON "institutions"("businessRegistrationNo");

-- CreateIndex
CREATE INDEX "institutions_businessRegistrationNo_idx" ON "institutions"("businessRegistrationNo");

-- CreateIndex
CREATE INDEX "institutions_institutionTypeId_idx" ON "institutions"("institutionTypeId");

-- CreateIndex
CREATE INDEX "institutions_status_idx" ON "institutions"("status");

-- CreateIndex
CREATE INDEX "vehicles_institutionId_currentGroupId_idx" ON "vehicles"("institutionId", "currentGroupId");

-- CreateIndex
CREATE INDEX "vehicles_lastFourDigits_idx" ON "vehicles"("lastFourDigits");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_institutionId_lastFourDigits_key" ON "vehicles"("institutionId", "lastFourDigits");

-- CreateIndex
CREATE INDEX "passenger_groups_institutionId_groupCode_idx" ON "passenger_groups"("institutionId", "groupCode");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_groups_institutionId_groupCode_key" ON "passenger_groups"("institutionId", "groupCode");

-- CreateIndex
CREATE INDEX "passengers_institutionId_shuttleType_idx" ON "passengers"("institutionId", "shuttleType");

-- CreateIndex
CREATE INDEX "passengers_institutionId_name_idx" ON "passengers"("institutionId", "name");

-- CreateIndex
CREATE INDEX "passengers_groupId_idx" ON "passengers"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_institutionId_phoneNumber_key" ON "passengers"("institutionId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_schedules_passengerId_key" ON "passenger_schedules"("passengerId");

-- CreateIndex
CREATE INDEX "passenger_schedules_isCareTimeInsufficient_idx" ON "passenger_schedules"("isCareTimeInsufficient");

-- CreateIndex
CREATE INDEX "passenger_schedules_passengerId_idx" ON "passenger_schedules"("passengerId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_code_idx" ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "subscriptions_institutionId_idx" ON "subscriptions"("institutionId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_institutionTypeId_fkey" FOREIGN KEY ("institutionTypeId") REFERENCES "institution_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_currentGroupId_fkey" FOREIGN KEY ("currentGroupId") REFERENCES "passenger_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_groups" ADD CONSTRAINT "passenger_groups_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "passenger_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_schedules" ADD CONSTRAINT "passenger_schedules_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "passengers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
