-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify process_audition_reminders function exists and is properly configured
-- The function should call the send-audition-reminders edge function via HTTP
CREATE OR REPLACE FUNCTION public.process_audition_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Call the edge function to process audition reminders
  PERFORM net.http_post(
    url := 'https://cqlczzkyktktaajbfmli.supabase.co/functions/v1/send-audition-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGN6emt5a3RrdGFhamJmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTY2MDUsImV4cCI6MjA2NjI5MjYwNX0.Zw2biXCKS10SiKLo81NCRAFqJCX-lQbO-zjo3HZe5T8"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  );
END;
$function$;