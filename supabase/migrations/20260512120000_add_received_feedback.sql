create table if not exists public.received_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  received_date date not null,
  giver_name text not null,
  feedback_text text not null,
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint received_feedback_giver_name_not_blank
    check (length(trim(giver_name)) > 0),
  constraint received_feedback_feedback_text_not_blank
    check (length(trim(feedback_text)) > 0),
  constraint received_feedback_received_date_not_future
    check (received_date <= current_date)
);

alter table public.received_feedback enable row level security;

create policy "Users can read their received feedback"
on public.received_feedback for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their received feedback"
on public.received_feedback for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their received feedback"
on public.received_feedback for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their received feedback"
on public.received_feedback for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists received_feedback_user_received_date_idx
on public.received_feedback (user_id, received_date desc, created_at desc);

drop trigger if exists received_feedback_set_updated_at on public.received_feedback;
create trigger received_feedback_set_updated_at
before update on public.received_feedback
for each row
execute function public.set_updated_at();
