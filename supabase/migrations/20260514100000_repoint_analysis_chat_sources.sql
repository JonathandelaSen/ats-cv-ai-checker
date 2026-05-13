alter table public.analysis_chat_messages
  drop constraint if exists analysis_chat_messages_analysis_id_fkey;

alter table public.analysis_chat_messages
  alter column analysis_id drop not null;

update public.analysis_chat_messages acm
set analysis_id = null
where analysis_id is not null
  and not exists (
    select 1
    from public.job_match_analyses jma
    where jma.id = acm.analysis_id
  );

alter table public.analysis_chat_messages
  add constraint analysis_chat_messages_analysis_id_fkey
  foreign key (analysis_id)
  references public.job_match_analyses(id)
  on delete cascade;

alter table public.analysis_chat_conversations
  drop constraint if exists analysis_chat_conversations_analysis_id_fkey;

alter table public.analysis_chat_conversations
  alter column analysis_id drop not null;

update public.analysis_chat_conversations acc
set analysis_id = null
where analysis_id is not null
  and not exists (
    select 1
    from public.job_match_analyses jma
    where jma.id = acc.analysis_id
  );

alter table public.analysis_chat_conversations
  add constraint analysis_chat_conversations_analysis_id_fkey
  foreign key (analysis_id)
  references public.job_match_analyses(id)
  on delete cascade;
