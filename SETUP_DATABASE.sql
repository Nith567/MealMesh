-- CreateTable User
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "worldIdNullifier" TEXT NOT NULL UNIQUE,
    "address" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable Meal
CREATE TABLE "public"."Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "hostUsername" TEXT NOT NULL,
    "hostAddress" TEXT,
    "restaurant" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationString" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "description" TEXT,
    "maxGuests" INTEGER NOT NULL,
    "currentGuests" INTEGER NOT NULL DEFAULT 0,
    "stakeAmount" TEXT NOT NULL,
    "transactionId" TEXT,
    "contractMealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Meal_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Guest
CREATE TABLE "public"."Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userAddress" TEXT,
    "transactionId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guest_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "public"."Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Guest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_mealId_userId_key" ON "public"."Guest"("mealId", "userId");
CREATE INDEX "Meal_hostId_idx" ON "public"."Meal"("hostId");
CREATE INDEX "Meal_latitude_longitude_idx" ON "public"."Meal"("latitude", "longitude");
CREATE INDEX "Meal_date_idx" ON "public"."Meal"("date");
CREATE INDEX "Guest_mealId_idx" ON "public"."Guest"("mealId");
CREATE INDEX "Guest_userId_idx" ON "public"."Guest"("userId");
