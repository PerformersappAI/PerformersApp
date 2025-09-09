
-- Add reminder-related columns to the auditions table
ALTER TABLE public.auditions 
ADD COLUMN submission_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN reminder_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;

-- Create an index on reminder_time for efficient cron job queries
CREATE INDEX idx_auditions_reminder_time ON public.auditions(reminder_time) WHERE reminder_enabled = TRUE AND reminder_sent = FALSE;

-- Create a function to check and send reminders (will be called by cron job)
CREATE OR REPLACE FUNCTION public.process_audition_reminders()
RETURNS void AS $$
BEGIN
  -- This function will be implemented in the edge function
  -- but we create it here for the cron job reference
  PERFORM net.http_post(
    url := 'https://cqlczzkyktktaajbfmli.supabase.co/functions/v1/send-audition-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGN6emt5a3RrdGFhamJmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTY2MDUsImV4cCI6MjA2NjI5MjYwNX0.Zw2biXCKS10SiKLo81NCRAFqJCX-lQbO-zjo3HZe5T8"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminder check to run every 15 minutes
SELECT cron.schedule(
  'audition-reminders',
  '*/15 * * * *',
  'SELECT public.process_audition_reminders();'
);
