/*
  # Initial Schema for Game of Evolution

  1. New Tables
    - `yugas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `target_points` (numeric)
      - `current_points` (numeric)
      - `created_at` (timestamptz)

    - `bonus_tasks`
      - `id` (uuid, primary key)
      - `yuga_id` (uuid, references yugas)
      - `name` (text)
      - `points` (numeric)
      - `completed` (boolean)
      - `created_at` (timestamptz)

    - `daily_entries`
      - `id` (uuid, primary key)
      - `yuga_id` (uuid, references yugas)
      - `title` (text)
      - `description` (text)
      - `hours` (numeric)
      - `points` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create yugas table
CREATE TABLE yugas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  target_points numeric NOT NULL,
  current_points numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE yugas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own yugas"
  ON yugas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create bonus_tasks table
CREATE TABLE bonus_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yuga_id uuid REFERENCES yugas ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  points numeric NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bonus_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage bonus tasks for their yugas"
  ON bonus_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM yugas
      WHERE yugas.id = bonus_tasks.yuga_id
      AND yugas.user_id = auth.uid()
    )
  );

-- Create daily_entries table
CREATE TABLE daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yuga_id uuid REFERENCES yugas ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  hours numeric NOT NULL,
  points numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage entries for their yugas"
  ON daily_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM yugas
      WHERE yugas.id = daily_entries.yuga_id
      AND yugas.user_id = auth.uid()
    )
  );