-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fix the search path for existing functions to be secure
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.get_user_audition_stats(uuid) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Update the cron job with the correct URL after enabling pg_net
SELECT cron.unschedule('audition-reminders-hourly');

SELECT cron.schedule(
  'audition-reminders-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://cqlczzkyktktaajbfmli.supabase.co/functions/v1/send-audition-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGN6emt5a3RrdGFhamJmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTY2MDUsImV4cCI6MjA2NjI5MjYwNX0.Zw2biXCKS10SiKLo81NCRAFqJCX-lQbO-zjo3HZe5T8"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);