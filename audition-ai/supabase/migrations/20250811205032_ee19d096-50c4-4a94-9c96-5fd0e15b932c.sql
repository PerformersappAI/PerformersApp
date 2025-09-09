
-- Grant admin role to the specified user (idempotent)
-- This will assign 'admin' to any auth.user with the given email if it exists,
-- and skip if the role is already present.

insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where lower(u.email) = lower('Will@ActorWillRoberts.com')
  and not exists (
    select 1
    from public.user_roles r
    where r.user_id = u.id
      and r.role = 'admin'::app_role
  );

-- Optional: you can verify afterwards with:
-- select u.email, r.role from public.user_roles r
-- join auth.users u on u.id = r.user_id
-- where lower(u.email) = lower('Will@ActorWillRoberts.com');
