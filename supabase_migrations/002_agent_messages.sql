-- Add messages column to agent_threads for conversation persistence
ALTER TABLE public.agent_threads
ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;
