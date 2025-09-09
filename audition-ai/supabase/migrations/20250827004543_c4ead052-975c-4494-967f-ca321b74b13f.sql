
-- 1) Create coaches table
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  bio text,
  highlights text[] not null default '{}'::text[],
  email text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

-- Keep updated_at fresh
drop trigger if exists trg_coaches_updated_at on public.coaches;
create trigger trg_coaches_updated_at
before update on public.coaches
for each row
execute function public.update_updated_at_column();

-- 2) Enable RLS and policies
alter table public.coaches enable row level security;

-- Public (anonymous or authenticated) can view only active coaches
drop policy if exists "Public can view active coaches" on public.coaches;
create policy "Public can view active coaches"
  on public.coaches
  for select
  using (active = true);

-- Admins can manage (insert/update/delete/select all)
drop policy if exists "Admins can manage coaches" on public.coaches;
create policy "Admins can manage coaches"
  on public.coaches
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3) Storage bucket for coach photos
insert into storage.buckets (id, name, public)
values ('coach-photos', 'coach-photos', true)
on conflict (id) do nothing;

-- Storage policies for the coach-photos bucket
-- Public read access to images in this bucket
drop policy if exists "Public can view coach photos" on storage.objects;
create policy "Public can view coach photos"
  on storage.objects
  for select
  using (bucket_id = 'coach-photos');

-- Admins can manage objects in this bucket
drop policy if exists "Admins can manage coach photos" on storage.objects;
create policy "Admins can manage coach photos"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'coach-photos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'coach-photos' and public.has_role(auth.uid(), 'admin'));

-- 4) Seed first coach (email left null for now; can be added via admin)
insert into public.coaches (name, slug, bio, highlights, photo_url, active)
values (
  'Rick Zieff',
  'rick-zieff',
  'Voice-over veteran since the mid-1980s spanning animation, games, and live-action. Emmy-nominated performer, coach, and voice/casting director with extensive credits and teaching experience.',
  array[
    'Daytime Emmy nomination for Spike the Dog (The Tom and Jerry Show)',
    'Grandpa Loud (The Loud House); Chief Clark (Mech Cadets); Croaks (The Cuphead Show)',
    'Shusuke Amagai (Bleach); Mr. Nosy & Mr. Nervous (The Mr. Men Show)',
    'Video game credits incl. Half-Life: Alyx, Final Fantasy VII Rebirth, Halo 2',
    'Voice direction on Steamboy, Cyberpunk: Edgerunners, Helluva Boss',
    'Teaches voice-over courses and workshops in Los Angeles and nationwide'
  ],
  '/lovable-uploads/cbfeae9f-0292-42a6-8705-8c6d0862be40.png',
  true
)
on conflict (slug) do nothing;
