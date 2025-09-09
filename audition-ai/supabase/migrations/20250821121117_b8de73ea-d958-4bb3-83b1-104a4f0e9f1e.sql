
-- 1) Create a private storage bucket for cached TTS audio
insert into storage.buckets (id, name, public)
values ('tts-audio', 'tts-audio', false)
on conflict (id) do nothing;

-- 2) Storage RLS policies for the new bucket (users can manage their own files if accessed directly)
-- Note: Edge functions will typically use the service role and bypass these RLS policies.

-- Allow users to read their own objects in tts-audio
create policy "tts-audio read own objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'tts-audio' and owner = auth.uid());

-- Allow users to insert their own objects in tts-audio
create policy "tts-audio insert own objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'tts-audio' and owner = auth.uid());

-- Allow users to update their own objects in tts-audio
create policy "tts-audio update own objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'tts-audio' and owner = auth.uid())
with check (bucket_id = 'tts-audio' and owner = auth.uid());

-- Allow users to delete their own objects in tts-audio
create policy "tts-audio delete own objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'tts-audio' and owner = auth.uid());

-- 3) Create an index table for cached TTS files
create table if not exists public.tts_cache_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  script_id uuid not null,
  dialogue_index integer not null,
  character text not null,
  voice_id text not null,
  speed numeric(4,2) not null default 1.00,
  provider text not null default 'google',
  hash text not null,
  storage_path text not null unique,
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.tts_cache_items enable row level security;

-- Users can view their own cache index records
create policy "Users can view their own TTS cache"
on public.tts_cache_items
for select
to authenticated
using (auth.uid() = user_id);

-- Helpful indexes
create index if not exists tts_cache_items_user_script_idx
  on public.tts_cache_items (user_id, script_id);

create unique index if not exists tts_cache_items_uniqueness
  on public.tts_cache_items (user_id, script_id, dialogue_index, voice_id, speed, hash);
