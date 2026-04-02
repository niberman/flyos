-- Multi-organization / multi-base architecture.
-- Backfills existing rows to Centennial Flight Academy + KAPA where needed.

-- Drop global tail number uniqueness (replaced by per-organization unique).
DROP INDEX IF EXISTS "aircraft_tail_number_key";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icao_code" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bases_pkey" PRIMARY KEY ("id")
);

-- Seed tenant row so FK-backed columns can be backfilled (matches prisma/seed.ts slug).
INSERT INTO "organizations" ("id", "name", "slug", "created_at", "updated_at")
VALUES (
    gen_random_uuid()::text,
    'Centennial Flight Academy',
    'centennial-flight-academy',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "bases" ("id", "organization_id", "name", "icao_code", "timezone", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    o."id",
    'Main Base',
    'KAPA',
    'America/Denver',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "organizations" o
WHERE o."slug" = 'centennial-flight-academy'
LIMIT 1;

INSERT INTO "bases" ("id", "organization_id", "name", "icao_code", "timezone", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    o."id",
    'Boulder Base',
    'KBJC',
    'America/Denver',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "organizations" o
WHERE o."slug" = 'centennial-flight-academy'
LIMIT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "organization_id" TEXT;

UPDATE "users"
SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'centennial-flight-academy' LIMIT 1);

ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "aircraft" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "aircraft" ADD COLUMN "home_base_id" TEXT;

UPDATE "aircraft"
SET
    "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'centennial-flight-academy' LIMIT 1),
    "home_base_id" = (SELECT "id" FROM "bases" WHERE "icao_code" = 'KAPA' LIMIT 1);

ALTER TABLE "aircraft" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "aircraft" ALTER COLUMN "home_base_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "base_id" TEXT;

UPDATE "bookings"
SET "base_id" = (SELECT "id" FROM "bases" WHERE "icao_code" = 'KAPA' LIMIT 1);

ALTER TABLE "bookings" ALTER COLUMN "base_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_logs" ADD COLUMN "organization_id" TEXT;

UPDATE "maintenance_logs" ml
SET "organization_id" = a."organization_id"
FROM "aircraft" a
WHERE ml."aircraft_id" = a."id";

ALTER TABLE "maintenance_logs" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "telemetry" ADD COLUMN "organization_id" TEXT;

UPDATE "telemetry" t
SET "organization_id" = a."organization_id"
FROM "aircraft" a
WHERE t."aircraft_id" = a."id";

ALTER TABLE "telemetry" ALTER COLUMN "organization_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "user_bases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_id" TEXT NOT NULL,

    CONSTRAINT "user_bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "bases_organization_id_idx" ON "bases"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "bases_organization_id_icao_code_key" ON "bases"("organization_id", "icao_code");

-- CreateIndex
CREATE INDEX "user_bases_user_id_idx" ON "user_bases"("user_id");

-- CreateIndex
CREATE INDEX "user_bases_base_id_idx" ON "user_bases"("base_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_bases_user_id_base_id_key" ON "user_bases"("user_id", "base_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "aircraft_organization_id_idx" ON "aircraft"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "aircraft_organization_id_tail_number_key" ON "aircraft"("organization_id", "tail_number");

-- CreateIndex
CREATE INDEX "bookings_base_id_idx" ON "bookings"("base_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_aircraft_id_idx" ON "bookings"("aircraft_id");

-- CreateIndex
CREATE INDEX "maintenance_logs_organization_id_idx" ON "maintenance_logs"("organization_id");

-- CreateIndex
CREATE INDEX "telemetry_organization_id_idx" ON "telemetry"("organization_id");

-- AddForeignKey
ALTER TABLE "bases" ADD CONSTRAINT "bases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bases" ADD CONSTRAINT "user_bases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bases" ADD CONSTRAINT "user_bases_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_home_base_id_fkey" FOREIGN KEY ("home_base_id") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
