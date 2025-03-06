# Game of Evolution (GOE) Application Context

## Application Overview
Game of Evolution (GOE) is a personal development platform that gamifies self-improvement by tracking consistent efforts through the concept of "Yugas" (mastery journeys). Users create Yugas for skills they want to master, set target points, log daily entries, and complete bonus tasks to earn points toward their mastery goals.

## Tech Stack
- Frontend: React with Tailwind CSS for styling
- Backend: Supabase for authentication, database, and serverless functions
- State Management: React hooks (useState, useEffect)
- UI Components: Custom components with Lucide React icons
- Notifications: react-hot-toast for toast notifications

## Database Schema

### Users Table
- Managed by Supabase Auth

### Yugas Table
- `id`: UUID PRIMARY KEY
- `user_id`: UUID (references auth.users.id)
- `name`: VARCHAR(255) - Name of the Yuga/skill
- `description`: TEXT (optional)
- `current_points`: INTEGER - Points accumulated so far
- `target_points`: INTEGER - Goal points for mastery
- `created_at`: TIMESTAMPTZ

### Explore Topics Table
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID (references auth.users.id)
- `yuga_id`: UUID (references yugas.id)
- `topic_name`: VARCHAR(255)
- `description`: TEXT (optional)
- `points`: INTEGER - Points awarded when completed
- `is_completed`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMPTZ DEFAULT NOW()
- `completed_at`: TIMESTAMPTZ (null until completed)

## Design Language

### Color Scheme
- Primary: Purple gradient (`from-purple-600 to-indigo-600`)
- Secondary: Amber/yellow for bonus items (`from-amber-50 to-yellow-50`)
- Success states: Green (`text-green-500`, `bg-green-50`)
- Background: White with subtle gradients
- Cards: White with rounded corners and light shadows

### UI Components
- Rounded corners: `rounded-xl` or `rounded-2xl`
- Gradient backgrounds: `bg-gradient-to-r from-{color}-X to-{color}-Y`
- Shadow effects: `shadow-md` with hover animations
- Decorative elements: Overlapping circles with opacity for depth

### Icons
- Uses Lucide React icons: `import { IconName } from 'lucide-react'`
- Common icons: CheckCircle, PlusCircle, Award, Star, X, Search, Filter

## Component Structure

### Modal Pattern
Modals follow this structure:
- Fixed positioning with backdrop blur
- White background with rounded corners
- Header with title and close button
- Form sections with gradient backgrounds by category
- Footer with action buttons (Cancel/Submit)

### Card Pattern
Cards follow this structure:
- White background with shadow
- Rounded corners (xl or 2xl)
- Header with title and action buttons
- Content area
- Optional decorative elements

### List Item Pattern
List items have:
- Border with rounded corners
- Status indicator (often a checkbox)
- Title and description
- Metadata (date, points, etc.)
- Hover effects for interactive elements

## Authentication & Data Flow

### Authentication
- Uses Supabase auth with `supabase.auth.getUser()` to get current user
- All database operations verify user authentication first
- Row Level Security (RLS) on all tables

### Data Operations
- Fetch operations: Load data on component mount and when dependencies change
- Create operations: Insert data, then update local state
- Update operations: Update remote data, then update local state
- Use toast notifications for operation feedback

## Points System
- Each Yuga has a target points goal
- Points are earned by completing topics and bonus tasks
- When a topic is completed, its points are added to the Yuga's current_points
- If a completed topic is marked incomplete, points are removed

## Database Functions
A custom function handles topic completion toggling:
```sql
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
  -- Get topic info
  SELECT * INTO topic_record FROM explore_topics WHERE id = topic_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Topic not found';
  END IF;
  
  -- Calculate points change
  IF new_status = TRUE AND topic_record.is_completed = FALSE THEN
    points_change := topic_record.points;
  ELSIF new_status = FALSE AND topic_record.is_completed = TRUE THEN
    points_change := -topic_record.points;
  ELSE
    points_change := 0;
  END IF;
  
  -- Update topic status
  UPDATE explore_topics
  SET is_completed = new_status,
      completed_at = completed_time
  WHERE id = topic_id;
  
  -- Update Yuga points if needed
  IF points_change != 0 THEN
    UPDATE yugas
    SET current_points = current_points + points_change
    WHERE id = topic_record.yuga_id;
  END IF;
END;
$$;
```

## Example Component Structure
Components typically follow this pattern:
1. Import necessary libraries (React, Lucide icons, toast)
2. Set up state variables (data, UI state, form values)
3. Define data fetching functions using useEffect
4. Define event handlers (toggle, submit, search, filter)
5. Return JSX with proper styling classes
6. Export the component as default

## Common Patterns for New Components
- Always check authentication before database operations
- Update local state immediately after successful database operations
- Use descriptive toast messages for user feedback
- Implement loading states for asynchronous operations
- Provide empty states for lists when no data exists
- Match the purple/gradient design language
- Use proper rounded corners and shadow effects
- Include decorative elements for visual interest