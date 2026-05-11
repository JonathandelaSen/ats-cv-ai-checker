create table if not exists public.feedback_notes_feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  status text not null default 'active',
  final_feedback text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_notes_feedbacks_person_name_not_blank
    check (length(trim(person_name)) > 0),
  constraint feedback_notes_feedbacks_status_check
    check (status in ('active', 'closed')),
  constraint feedback_notes_feedbacks_closed_at_check
    check ((status = 'closed' and closed_at is not null) or (status = 'active' and closed_at is null))
);

create table if not exists public.feedback_notes_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback_id uuid not null references public.feedback_notes_feedbacks(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_notes_entries_content_not_blank
    check (length(trim(content)) > 0)
);

alter table public.feedback_notes_feedbacks enable row level security;
alter table public.feedback_notes_entries enable row level security;

create policy "Users can read their feedback notes"
on public.feedback_notes_feedbacks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their feedback notes"
on public.feedback_notes_feedbacks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their feedback notes"
on public.feedback_notes_feedbacks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their feedback notes"
on public.feedback_notes_feedbacks for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their feedback note entries"
on public.feedback_notes_entries for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their feedback note entries"
on public.feedback_notes_entries for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their feedback note entries"
on public.feedback_notes_entries for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their feedback note entries"
on public.feedback_notes_entries for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists feedback_notes_feedbacks_user_status_updated_idx
on public.feedback_notes_feedbacks (user_id, status, updated_at desc);

create index if not exists feedback_notes_feedbacks_user_updated_idx
on public.feedback_notes_feedbacks (user_id, updated_at desc);

create index if not exists feedback_notes_entries_feedback_created_idx
on public.feedback_notes_entries (feedback_id, created_at asc);

create index if not exists feedback_notes_entries_user_feedback_idx
on public.feedback_notes_entries (user_id, feedback_id);

drop trigger if exists feedback_notes_feedbacks_set_updated_at on public.feedback_notes_feedbacks;
create trigger feedback_notes_feedbacks_set_updated_at
before update on public.feedback_notes_feedbacks
for each row
execute function public.set_updated_at();

drop trigger if exists feedback_notes_entries_set_updated_at on public.feedback_notes_entries;
create trigger feedback_notes_entries_set_updated_at
before update on public.feedback_notes_entries
for each row
execute function public.set_updated_at();
