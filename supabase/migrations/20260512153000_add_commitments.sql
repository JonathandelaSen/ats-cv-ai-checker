create table if not exists public.commitment_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  name text not null,
  role_or_label text,
  status text not null default 'active',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commitment_contexts_type_check
    check (type in ('employment', 'project', 'personal', 'other')),
  constraint commitment_contexts_status_check
    check (status in ('active', 'archived')),
  constraint commitment_contexts_name_not_blank
    check (length(trim(name)) > 0)
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.commitment_contexts(id) on delete cascade,
  title text not null,
  description text,
  success_criteria text,
  result_notes text,
  source text not null,
  status text not null default 'active',
  priority text,
  start_date date not null default current_date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commitments_source_check
    check (source in ('manager', 'self', 'company', 'project', 'other')),
  constraint commitments_status_check
    check (status in ('active', 'paused', 'achieved', 'missed', 'cancelled')),
  constraint commitments_priority_check
    check (priority is null or priority in ('low', 'medium', 'high')),
  constraint commitments_title_not_blank
    check (length(trim(title)) > 0),
  constraint commitments_date_range_check
    check (target_date is null or target_date >= start_date)
);

create table if not exists public.commitment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  title text not null,
  notes text,
  evidence_notes text,
  status text not null default 'todo',
  due_date date,
  completed_at timestamptz,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commitment_items_status_check
    check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  constraint commitment_items_title_not_blank
    check (length(trim(title)) > 0)
);

create table if not exists public.commitment_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  type text not null,
  status text not null default 'expected',
  title text not null,
  description text,
  amount numeric(12, 2),
  currency text default 'EUR',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commitment_outcomes_type_check
    check (type in ('promotion', 'role_change', 'leadership', 'mentoring', 'money', 'recognition', 'learning', 'other')),
  constraint commitment_outcomes_status_check
    check (status in ('expected', 'achieved', 'missed', 'changed')),
  constraint commitment_outcomes_title_not_blank
    check (length(trim(title)) > 0),
  constraint commitment_outcomes_currency_check
    check (currency is null or length(currency) = 3)
);

alter table public.commitment_contexts enable row level security;
alter table public.commitments enable row level security;
alter table public.commitment_items enable row level security;
alter table public.commitment_outcomes enable row level security;

create policy "Users can read their commitment contexts"
on public.commitment_contexts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their commitment contexts"
on public.commitment_contexts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their commitment contexts"
on public.commitment_contexts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their commitment contexts"
on public.commitment_contexts for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their commitments"
on public.commitments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their commitments"
on public.commitments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their commitments"
on public.commitments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their commitments"
on public.commitments for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their commitment items"
on public.commitment_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their commitment items"
on public.commitment_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their commitment items"
on public.commitment_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their commitment items"
on public.commitment_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their commitment outcomes"
on public.commitment_outcomes for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their commitment outcomes"
on public.commitment_outcomes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their commitment outcomes"
on public.commitment_outcomes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their commitment outcomes"
on public.commitment_outcomes for delete
to authenticated
using ((select auth.uid()) = user_id);

create unique index if not exists commitment_contexts_one_default_idx
on public.commitment_contexts (user_id)
where is_default and status = 'active';

create index if not exists commitment_contexts_user_status_idx
on public.commitment_contexts (user_id, status, updated_at desc);

create index if not exists commitments_user_context_status_idx
on public.commitments (user_id, context_id, status, updated_at desc);

create index if not exists commitments_user_target_date_idx
on public.commitments (user_id, target_date);

create index if not exists commitment_items_user_commitment_order_idx
on public.commitment_items (user_id, commitment_id, order_index asc, created_at asc);

create index if not exists commitment_outcomes_user_commitment_idx
on public.commitment_outcomes (user_id, commitment_id, created_at asc);

drop trigger if exists commitment_contexts_set_updated_at on public.commitment_contexts;
create trigger commitment_contexts_set_updated_at
before update on public.commitment_contexts
for each row
execute function public.set_updated_at();

drop trigger if exists commitments_set_updated_at on public.commitments;
create trigger commitments_set_updated_at
before update on public.commitments
for each row
execute function public.set_updated_at();

drop trigger if exists commitment_items_set_updated_at on public.commitment_items;
create trigger commitment_items_set_updated_at
before update on public.commitment_items
for each row
execute function public.set_updated_at();

drop trigger if exists commitment_outcomes_set_updated_at on public.commitment_outcomes;
create trigger commitment_outcomes_set_updated_at
before update on public.commitment_outcomes
for each row
execute function public.set_updated_at();
