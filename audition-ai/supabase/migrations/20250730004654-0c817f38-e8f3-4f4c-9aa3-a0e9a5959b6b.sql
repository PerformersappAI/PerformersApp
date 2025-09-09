-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run audition reminders every hour
SELECT cron.schedule(
  'audition-reminders-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://cqlczzkyktktaajbfmli.supabase.co/functions/v1/send-audition-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGN6emt5a3RrdGFhamJmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTY2MDUsImV4cCI6MjA2NjI5MjYwNX0.Zw2biXCKS10SiKLo81NCRAFqJCX-lQbO-zjo3HZe5T8"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);