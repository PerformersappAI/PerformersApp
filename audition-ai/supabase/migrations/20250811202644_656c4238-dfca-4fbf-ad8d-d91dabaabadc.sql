
-- 1) Roles: enum + table
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Allow users to read their own roles (optional, helpful for client)
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- 2) Role check function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- 3) Soft delete column for scripts
alter table public.scripts
add column if not exists deleted_at timestamp with time zone;

create index if not exists idx_scripts_deleted_at on public.scripts (deleted_at);
create index if not exists idx_scripts_user_deleted_at on public.scripts (user_id, deleted_at);

-- 4) Update RLS on scripts
-- Drop existing SELECT policy to replace with one that hides trashed items for normal users
drop policy if exists "Users can view their own scripts" on public.scripts;

-- Users: view only their own non-deleted scripts
create policy "Users can view their own active scripts"
on public.scripts
for select
to authenticated
using (
  auth.uid() = user_id
  and deleted_at is null
);

-- Admins: view all scripts (including trashed)
create policy "Admins can view all scripts"
on public.scripts
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admins: can update any script (e.g., set deleted_at for trash/restore)
create policy "Admins can update any script"
on public.scripts
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admins: can delete any script permanently
create policy "Admins can delete any script"
on public.scripts
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));
