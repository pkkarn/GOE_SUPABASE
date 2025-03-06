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

-- create a function to update the yuga points
BEGIN
  UPDATE yugas
  SET current_points = current_points + p_points
  WHERE id = p_yuga_id;
END;


-- Create the explore_topics table with UUID for yuga_id and points
CREATE TABLE IF NOT EXISTS explore_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    yuga_id UUID NOT NULL REFERENCES yugas(id) ON DELETE CASCADE,
    topic_name VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 5,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_explore_topics_user_id ON explore_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_explore_topics_yuga_id ON explore_topics(yuga_id);
CREATE INDEX IF NOT EXISTS idx_explore_topics_completed ON explore_topics(is_completed);

-- Enable Row Level Security (RLS)
ALTER TABLE explore_topics ENABLE ROW LEVEL SECURITY;

-- Set up policies so users can only see and modify their own topics
CREATE POLICY "Users can view their own topics" 
    ON explore_topics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics" 
    ON explore_topics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
    ON explore_topics FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
    ON explore_topics FOR DELETE 
    USING (auth.uid() = user_id);

-- Create a database function to handle topic completion status toggle and update Yuga points
CREATE OR REPLACE FUNCTION toggle_topic_completion(
  topic_id UUID,
  new_status BOOLEAN,
  completed_time TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  topic_record RECORD;
  points_change INTEGER;
BEGIN
  -- Get the topic information
  SELECT * INTO topic_record FROM explore_topics WHERE id = topic_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Topic not found';
  END IF;
  
  -- Calculate points change based on new status
  IF new_status = TRUE AND topic_record.is_completed = FALSE THEN
    -- Topic is being completed, add points
    points_change := topic_record.points;
  ELSIF new_status = FALSE AND topic_record.is_completed = TRUE THEN
    -- Topic is being uncompleted, remove points
    points_change := -topic_record.points;
  ELSE
    -- No status change, no points change
    points_change := 0;
  END IF;
  
  -- Update the topic status
  UPDATE explore_topics
  SET is_completed = new_status,
      completed_at = completed_time
  WHERE id = topic_id;
  
  -- Only update Yuga points if there's a points change
  IF points_change != 0 THEN
    UPDATE yugas
    SET current_points = current_points + points_change
    WHERE id = topic_record.yuga_id;
    
    -- Record to points_history
    INSERT INTO points_history (
      user_id,
      yuga_id,
      points,
      source_type,
      source_id,
      description
    ) VALUES (
      (SELECT user_id FROM yugas WHERE id = topic_record.yuga_id),
      topic_record.yuga_id,
      points_change,
      'explore_topic',
      topic_id,
      CASE 
        WHEN new_status = TRUE THEN 'Completed topic: ' || topic_record.topic_name
        ELSE 'Uncompleted topic: ' || topic_record.topic_name
      END
    );
  END IF;
END;
$$;

-- Create a points_history table to track all point transactions
CREATE TABLE points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yuga_id UUID NOT NULL REFERENCES yugas(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'daily_entry', 'explore_topic', etc.
  source_id UUID NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_points_history_yuga_id ON points_history(yuga_id);
CREATE INDEX idx_points_history_created_at ON points_history(created_at);

-- Enable Row Level Security
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Set up policy so users can only see their own points history
CREATE POLICY "Users can view their own points history"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create a trigger function to record daily entries to points_history
CREATE OR REPLACE FUNCTION record_daily_entry_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO points_history (
    user_id,
    yuga_id, 
    points,
    source_type,
    source_id,
    description
  ) VALUES (
    (SELECT user_id FROM yugas WHERE id = NEW.yuga_id),
    NEW.yuga_id,
    NEW.points,
    'daily_entry',
    NEW.id,
    'Daily entry: ' || NEW.title
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on daily_entries
CREATE TRIGGER daily_entry_points_trigger
AFTER INSERT ON daily_entries
FOR EACH ROW
EXECUTE FUNCTION record_daily_entry_points();