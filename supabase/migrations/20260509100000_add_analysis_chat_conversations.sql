-- Conversations table for grouping chat messages
create table if not exists public.analysis_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analysis_chat_conversations_title_not_blank
    check (length(trim(title)) > 0)
);

alter table public.analysis_chat_conversations enable row level security;

create policy "Users can read their chat conversations"
on public.analysis_chat_conversations for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their chat conversations"
on public.analysis_chat_conversations for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their chat conversations"
on public.analysis_chat_conversations for update
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can delete their chat conversations"
on public.analysis_chat_conversations for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists analysis_chat_conversations_user_analysis_idx
on public.analysis_chat_conversations (user_id, analysis_id, updated_at desc);

-- Add conversation_id to messages (nullable for backwards compat with existing messages)
alter table public.analysis_chat_messages
  add column if not exists conversation_id uuid references public.analysis_chat_conversations(id) on delete cascade;

-- Migrate existing messages: create a conversation per analysis and assign
do $$
declare
  rec record;
  conv_id uuid;
begin
  for rec in
    select distinct user_id, analysis_id
    from public.analysis_chat_messages
    where conversation_id is null
  loop
    insert into public.analysis_chat_conversations (user_id, analysis_id, title)
    values (rec.user_id, rec.analysis_id, 'Conversación inicial')
    returning id into conv_id;

    update public.analysis_chat_messages
    set conversation_id = conv_id
    where user_id = rec.user_id
      and analysis_id = rec.analysis_id
      and conversation_id is null;
  end loop;
end $$;

-- Now make conversation_id not null
alter table public.analysis_chat_messages
  alter column conversation_id set not null;

create index if not exists analysis_chat_messages_conversation_idx
on public.analysis_chat_messages (conversation_id, created_at asc);
