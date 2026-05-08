create table if not exists public.analysis_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  role text not null,
  content text not null,
  model text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint analysis_chat_messages_role_check
    check (role in ('user', 'assistant')),
  constraint analysis_chat_messages_content_not_blank
    check (length(trim(content)) > 0)
);

alter table public.analysis_chat_messages enable row level security;

create policy "Users can read their analysis chat messages"
on public.analysis_chat_messages for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their analysis chat messages"
on public.analysis_chat_messages for insert
to authenticated
with check ((select auth.uid()) = user_id);

create index if not exists analysis_chat_messages_user_analysis_created_idx
on public.analysis_chat_messages (user_id, analysis_id, created_at asc);
