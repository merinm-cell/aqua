/*
  # Water Quality Monitoring Schema

  1. New Tables
    - `water_quality_readings`
      - `id` (uuid, primary key)
      - `temperature` (numeric) - Water temperature in Celsius
      - `ph` (numeric) - pH level (0-14 scale)
      - `turbidity` (numeric) - Turbidity in NTU (Nephelometric Turbidity Units)
      - `message_number` (integer) - Sequential message counter
      - `timestamp` (timestamptz) - When the reading was taken
      - `created_at` (timestamptz) - When the record was created in the database

  2. Security
    - Enable RLS on `water_quality_readings` table
    - Add policy for public read access (dashboard is read-only for monitoring)
    - Add policy for authenticated insert (for backend data ingestion)

  3. Indexes
    - Index on timestamp for efficient time-based queries
    - Index on created_at for recent data retrieval
*/

CREATE TABLE IF NOT EXISTS water_quality_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  temperature numeric NOT NULL,
  ph numeric NOT NULL,
  turbidity numeric NOT NULL,
  message_number integer NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE water_quality_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to water quality readings"
  ON water_quality_readings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated insert of water quality readings"
  ON water_quality_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_water_quality_timestamp 
  ON water_quality_readings(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_water_quality_created_at 
  ON water_quality_readings(created_at DESC);