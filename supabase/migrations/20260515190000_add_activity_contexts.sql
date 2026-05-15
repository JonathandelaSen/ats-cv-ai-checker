create table if not exists public.activity_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  name text not null,
  status text not null default 'active',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_contexts_type_check
    check (type in ('employment', 'project', 'personal', 'other')),
  constraint activity_contexts_status_check
    check (status in ('active', 'archived')),
  constraint activity_contexts_name_not_blank
    check (length(trim(name)) > 0)
);

alter table public.activity_contexts enable row level security;

create policy "Users can read their activity contexts"
on public.activity_contexts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their activity contexts"
on public.activity_contexts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their activity contexts"
on public.activity_contexts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their activity contexts"
on public.activity_contexts for delete
to authenticated
using ((select auth.uid()) = user_id and not is_default);

create unique index if not exists activity_contexts_one_default_idx
on public.activity_contexts (user_id)
where is_default;

create index if not exists activity_contexts_user_status_idx
on public.activity_contexts (user_id, status, updated_at desc);

drop trigger if exists activity_contexts_set_updated_at on public.activity_contexts;
create trigger activity_contexts_set_updated_at
before update on public.activity_contexts
for each row
execute function public.set_updated_at();

create or replace function public.count_activity_context_records(
  p_user_id uuid,
  p_context_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  total integer;
begin
  select
    (
      select count(*) from public.work_journal_entries
      where user_id = p_user_id and activity_context_id = p_context_id
    ) +
    (
      select count(*) from public.commitments
      where user_id = p_user_id and activity_context_id = p_context_id
    ) +
    (
      select count(*) from public.received_feedback
      where user_id = p_user_id and activity_context_id = p_context_id
    )
  into total;

  return coalesce(total, 0);
end;
$$;

create or replace function public.reassign_activity_context_records(
  p_user_id uuid,
  p_source_context_id uuid,
  p_default_context_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  total integer := 0;
  changed integer := 0;
begin
  update public.work_journal_entries
  set activity_context_id = p_default_context_id
  where user_id = p_user_id and activity_context_id = p_source_context_id;
  get diagnostics changed = row_count;
  total := total + changed;

  update public.commitments
  set activity_context_id = p_default_context_id
  where user_id = p_user_id and activity_context_id = p_source_context_id;
  get diagnostics changed = row_count;
  total := total + changed;

  update public.received_feedback
  set activity_context_id = p_default_context_id
  where user_id = p_user_id and activity_context_id = p_source_context_id;
  get diagnostics changed = row_count;
  total := total + changed;

  return total;
end;
$$;

insert into public.activity_contexts (user_id, type, name, status, is_default)
select users.user_id, 'other', 'General', 'active', true
from (
  select id as user_id from auth.users
  union
  select user_id from public.work_journal_entries
  union
  select user_id from public.commitments
  union
  select user_id from public.received_feedback
  union
  select user_id from public.work_journal_contexts
  union
  select user_id from public.commitment_contexts
) users
on conflict do nothing;

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

alter table public.work_journal_entries
add column if not exists activity_context_id uuid references public.activity_contexts(id) on delete restrict;

alter table public.commitments
add column if not exists activity_context_id uuid references public.activity_contexts(id) on delete restrict;

alter table public.received_feedback
add column if not exists activity_context_id uuid references public.activity_contexts(id) on delete restrict;

update public.work_journal_entries entry
set activity_context_id = context.id
from public.activity_contexts context
where entry.activity_context_id is null
  and context.user_id = entry.user_id
  and context.is_default;

update public.commitments commitment
set activity_context_id = context.id
from public.activity_contexts context
where commitment.activity_context_id is null
  and context.user_id = commitment.user_id
  and context.is_default;

update public.received_feedback feedback
set activity_context_id = context.id
from public.activity_contexts context
where feedback.activity_context_id is null
  and context.user_id = feedback.user_id
  and context.is_default;

alter table public.work_journal_entries
alter column activity_context_id set not null;

alter table public.commitments
alter column activity_context_id set not null;

alter table public.received_feedback
alter column activity_context_id set not null;

create index if not exists work_journal_entries_user_activity_context_date_idx
on public.work_journal_entries (user_id, activity_context_id, date_start desc);

create index if not exists commitments_user_activity_context_status_idx
on public.commitments (user_id, activity_context_id, status, updated_at desc);

create index if not exists received_feedback_user_activity_context_date_idx
on public.received_feedback (user_id, activity_context_id, received_date desc);

alter table public.work_journal_entries
drop constraint if exists work_journal_entries_context_id_fkey;

alter table public.commitments
drop constraint if exists commitments_context_id_fkey;

alter table public.work_journal_entries
alter column context_id drop not null;

alter table public.commitments
alter column context_id drop not null;

delete from public.work_journal_contexts;
delete from public.commitment_contexts;
