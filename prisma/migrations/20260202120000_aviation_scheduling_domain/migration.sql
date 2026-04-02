-- Aviation scheduling domain: schedulable resources, booking lifecycle, participants,
-- squawks, pilot qualification tables, aircraft Hobbs/Tach.

-- CreateEnum
CREATE TYPE "SchedulableResourceKind" AS ENUM ('AIRCRAFT', 'SIMULATOR', 'CLASSROOM');
CREATE TYPE "BookingStatus" AS ENUM ('SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BookingParticipantRole" AS ENUM ('RENTER', 'INSTRUCTOR');
CREATE TYPE "SquawkStatus" AS ENUM ('OPEN', 'DEFERRED', 'CLEARED');

-- AlterTable aircraft: Hobbs/Tach
ALTER TABLE "aircraft" ADD COLUMN "hobbs_hours" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "aircraft" ADD COLUMN "tach_hours" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable schedulable_resources
CREATE TABLE "schedulable_resources" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "base_id" TEXT NOT NULL,
    "kind" "SchedulableResourceKind" NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "aircraft_id" TEXT,

    CONSTRAINT "schedulable_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "schedulable_resources_aircraft_id_key" ON "schedulable_resources"("aircraft_id");
CREATE INDEX "schedulable_resources_organization_id_idx" ON "schedulable_resources"("organization_id");
CREATE INDEX "schedulable_resources_base_id_idx" ON "schedulable_resources"("base_id");

ALTER TABLE "schedulable_resources" ADD CONSTRAINT "schedulable_resources_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedulable_resources" ADD CONSTRAINT "schedulable_resources_base_id_fkey"
  FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedulable_resources" ADD CONSTRAINT "schedulable_resources_aircraft_id_fkey"
  FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One resource per aircraft (backfill)
INSERT INTO "schedulable_resources" ("id", "organization_id", "base_id", "kind", "name", "is_active", "aircraft_id")
SELECT gen_random_uuid()::text, a."organization_id", a."home_base_id", 'AIRCRAFT'::"SchedulableResourceKind", a."tail_number", true, a."id"
FROM "aircraft" a;

-- AlterTable bookings: new columns before FK swap
ALTER TABLE "bookings" ADD COLUMN "schedulable_resource_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN "status" "BookingStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "bookings" ADD COLUMN "dispatched_at" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "cancelled_at" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "hobbs_out" DECIMAL(12,2);
ALTER TABLE "bookings" ADD COLUMN "hobbs_in" DECIMAL(12,2);
ALTER TABLE "bookings" ADD COLUMN "tach_out" DECIMAL(12,2);
ALTER TABLE "bookings" ADD COLUMN "tach_in" DECIMAL(12,2);

UPDATE "bookings" b
SET "schedulable_resource_id" = sr."id"
FROM "schedulable_resources" sr
WHERE sr."aircraft_id" = b."aircraft_id";

ALTER TABLE "bookings" ALTER COLUMN "schedulable_resource_id" SET NOT NULL;

DROP INDEX IF EXISTS "bookings_aircraft_id_idx";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_aircraft_id_fkey";
ALTER TABLE "bookings" DROP COLUMN "aircraft_id";

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedulable_resource_id_fkey"
  FOREIGN KEY ("schedulable_resource_id") REFERENCES "schedulable_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "bookings_schedulable_resource_id_idx" ON "bookings"("schedulable_resource_id");

-- booking_participants
CREATE TABLE "booking_participants" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BookingParticipantRole" NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "booking_participants_booking_id_user_id_key" ON "booking_participants"("booking_id", "user_id");
CREATE INDEX "booking_participants_organization_id_idx" ON "booking_participants"("organization_id");
CREATE INDEX "booking_participants_user_id_idx" ON "booking_participants"("user_id");

ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "booking_participants" ("id", "booking_id", "user_id", "role", "organization_id")
SELECT gen_random_uuid()::text, b."id", b."user_id", 'RENTER'::"BookingParticipantRole", u."organization_id"
FROM "bookings" b
JOIN "users" u ON u."id" = b."user_id";

-- squawks
CREATE TABLE "squawks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SquawkStatus" NOT NULL DEFAULT 'OPEN',
    "grounds_aircraft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cleared_at" TIMESTAMP(3),

    CONSTRAINT "squawks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "squawks_organization_id_idx" ON "squawks"("organization_id");
CREATE INDEX "squawks_aircraft_id_idx" ON "squawks"("aircraft_id");

ALTER TABLE "squawks" ADD CONSTRAINT "squawks_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "squawks" ADD CONSTRAINT "squawks_aircraft_id_fkey"
  FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Qualification tables
CREATE TABLE "pilot_medicals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pilot_medicals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pilot_medicals_organization_id_idx" ON "pilot_medicals"("organization_id");
CREATE INDEX "pilot_medicals_user_id_idx" ON "pilot_medicals"("user_id");
ALTER TABLE "pilot_medicals" ADD CONSTRAINT "pilot_medicals_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pilot_medicals" ADD CONSTRAINT "pilot_medicals_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pilot_certificates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "identifier" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pilot_certificates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pilot_certificates_organization_id_idx" ON "pilot_certificates"("organization_id");
CREATE INDEX "pilot_certificates_user_id_idx" ON "pilot_certificates"("user_id");
ALTER TABLE "pilot_certificates" ADD CONSTRAINT "pilot_certificates_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pilot_certificates" ADD CONSTRAINT "pilot_certificates_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "flight_review_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flight_review_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "flight_review_records_organization_id_idx" ON "flight_review_records"("organization_id");
CREATE INDEX "flight_review_records_user_id_idx" ON "flight_review_records"("user_id");
ALTER TABLE "flight_review_records" ADD CONSTRAINT "flight_review_records_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flight_review_records" ADD CONSTRAINT "flight_review_records_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "aircraft_checkouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "aircraft_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "signed_off_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aircraft_checkouts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "aircraft_checkouts_organization_id_idx" ON "aircraft_checkouts"("organization_id");
CREATE INDEX "aircraft_checkouts_user_id_idx" ON "aircraft_checkouts"("user_id");
CREATE INDEX "aircraft_checkouts_aircraft_id_idx" ON "aircraft_checkouts"("aircraft_id");
ALTER TABLE "aircraft_checkouts" ADD CONSTRAINT "aircraft_checkouts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aircraft_checkouts" ADD CONSTRAINT "aircraft_checkouts_aircraft_id_fkey"
  FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aircraft_checkouts" ADD CONSTRAINT "aircraft_checkouts_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aircraft_checkouts" ADD CONSTRAINT "aircraft_checkouts_signed_off_by_user_id_fkey"
  FOREIGN KEY ("signed_off_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
