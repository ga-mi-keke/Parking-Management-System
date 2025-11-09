-- Ensure TimescaleDB extension is available (requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- CreateTable
CREATE TABLE "ParkingSpot" (
    "id" SERIAL PRIMARY KEY,
    "label" TEXT NOT NULL UNIQUE,
    "occupied" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promote to hypertable on the updatedAt column
SELECT create_hypertable('"ParkingSpot"', '"updatedAt"', if_not_exists => TRUE);
