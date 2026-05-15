insert into public.activity_contexts (user_id, type, name, status, is_default)
select users.id, 'other', 'General', 'active', true
from auth.users users
where not exists (
  select 1
  from public.activity_contexts contexts
  where contexts.user_id = users.id
    and contexts.is_default
);

create or replace function public.ensure_default_activity_context_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_contexts (user_id, type, name, status, is_default)
  values (new.id, 'other', 'General', 'active', true)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_default_activity_context_after_user_created on auth.users;
create trigger ensure_default_activity_context_after_user_created
after insert on auth.users
for each row
execute function public.ensure_default_activity_context_for_user();
