
-- 1) Enum for status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'blog_status') then
    create type public.blog_status as enum ('draft', 'published');
  end if;
end $$;

-- 2) Table for blog posts
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image_url text,
  youtube_url text,
  status public.blog_status not null default 'published',
  author_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optional: reference profiles instead of auth.users to avoid reserved schema references
  constraint blog_posts_author_fk
    foreign key (author_id) references public.profiles(id)
      on delete cascade,
  -- YouTube-only enforcement for videos
  constraint blog_posts_youtube_link_chk
    check (
      youtube_url is null
      or youtube_url ~* '^(https?://)?(www\.)?(youtube\.com|youtu\.be)/'
    )
);

-- 3) Helpful indexes
create index if not exists blog_posts_status_created_idx
  on public.blog_posts (status, created_at desc);

-- 4) Keep updated_at in sync
drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row
execute procedure public.update_updated_at_column();

-- 5) Row Level Security
alter table public.blog_posts enable row level security;

-- Public can view published posts
drop policy if exists "Public can view published blog posts" on public.blog_posts;
create policy "Public can view published blog posts"
on public.blog_posts
for select
using (status = 'published');

-- Admins can view all posts
drop policy if exists "Admins can view all blog posts" on public.blog_posts;
create policy "Admins can view all blog posts"
on public.blog_posts
for select
using (public.has_role(auth.uid(), 'admin'));

-- Admins can insert posts
drop policy if exists "Admins can insert blog posts" on public.blog_posts;
create policy "Admins can insert blog posts"
on public.blog_posts
for insert
with check (public.has_role(auth.uid(), 'admin'));

-- Admins can update posts
drop policy if exists "Admins can update blog posts" on public.blog_posts;
create policy "Admins can update blog posts"
on public.blog_posts
for update
using (public.has_role(auth.uid(), 'admin'));

-- Admins can delete posts
drop policy if exists "Admins can delete blog posts" on public.blog_posts;
create policy "Admins can delete blog posts"
on public.blog_posts
for delete
using (public.has_role(auth.uid(), 'admin'));
