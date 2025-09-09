
-- Grant 'admin' role to the specified email (case-insensitive)
insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where lower(u.email) = lower('Will@Actorwillroberts.com')
on conflict (user_id, role) do nothing;

-- Verify the role assignment
select u.email, r.role
from auth.users u
left join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('Will@Actorwillroberts.com');
