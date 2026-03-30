/*
  # Alert Settings Schema

  1. New Tables
    - `alert_settings`
      - `id` (uuid, primary key)
      - `metric_name` (text) - Name of the metric (temperature, ph, turbidity)
      - `min_value` (numeric) - Minimum safe value
      - `max_value` (numeric) - Maximum safe value
      - `updated_at` (timestamptz) - When settings were last updated

  2. Security
    - Enable RLS on `alert_settings` table
    - Add policy for public read access
    - Add policy for public update access (settings can be modified by anyone viewing the dashboard)

  3. Initial Data
    - Insert default safe ranges for temperature, pH, and turbidity
*/

CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text UNIQUE NOT NULL,
  min_value numeric NOT NULL,
  max_value numeric NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to alert settings"
  ON alert_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public update of alert settings"
  ON alert_settings
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

INSERT INTO alert_settings (metric_name, min_value, max_value) VALUES
  ('temperature', 0, 30),
  ('ph', 6.5, 8.5),
  ('turbidity', 0, 5)
ON CONFLICT (metric_name) DO NOTHING;