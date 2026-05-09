create table if not exists public.work_journal_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  name text not null,
  role_or_label text,
  status text not null default 'active',
  is_default boolean not null default false,
  created_from_cv boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_journal_contexts_type_check
    check (type in ('employment', 'project')),
  constraint work_journal_contexts_status_check
    check (status in ('active', 'archived')),
  constraint work_journal_contexts_name_not_blank
    check (length(trim(name)) > 0)
);

create table if not exists public.work_journal_hidden_context_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  name_key text not null,
  created_at timestamptz not null default now(),
  constraint work_journal_hidden_context_suggestions_type_check
    check (type in ('employment', 'project')),
  constraint work_journal_hidden_context_suggestions_name_key_not_blank
    check (length(trim(name_key)) > 0),
  constraint work_journal_hidden_context_suggestions_unique
    unique (user_id, type, name_key)
);

create table if not exists public.work_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.work_journal_contexts(id) on delete cascade,
  date_start date not null default current_date,
  date_end date,
  topic text,
  input_mode text not null default 'manual',
  raw_notes text not null,
  final_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_journal_entries_input_mode_check
    check (input_mode in ('manual', 'ai_assisted')),
  constraint work_journal_entries_raw_notes_not_blank
    check (length(trim(raw_notes)) > 0),
  constraint work_journal_entries_final_text_not_blank
    check (length(trim(final_text)) > 0),
  constraint work_journal_entries_date_range_check
    check (date_end is null or date_end >= date_start)
);

create table if not exists public.work_journal_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context_id uuid not null references public.work_journal_contexts(id) on delete cascade,
  title text not null,
  summary text not null,
  date_start date,
  date_end date,
  status text not null default 'proposed',
  source_entry_ids uuid[] not null default '{}',
  candidate_bullets jsonb not null default '[]'::jsonb,
  detected_topics text[] not null default '{}',
  follow_up_questions jsonb not null default '[]'::jsonb,
  additional_evidence jsonb not null default '[]'::jsonb,
  ai_model text,
  ai_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_journal_highlights_status_check
    check (status in ('proposed', 'saved', 'discarded')),
  constraint work_journal_highlights_title_not_blank
    check (length(trim(title)) > 0),
  constraint work_journal_highlights_summary_not_blank
    check (length(trim(summary)) > 0),
  constraint work_journal_highlights_date_range_check
    check (date_end is null or date_start is null or date_end >= date_start),
  constraint work_journal_highlights_candidate_bullets_array
    check (jsonb_typeof(candidate_bullets) = 'array'),
  constraint work_journal_highlights_follow_up_questions_array
    check (jsonb_typeof(follow_up_questions) = 'array'),
  constraint work_journal_highlights_additional_evidence_array
    check (jsonb_typeof(additional_evidence) = 'array')
);

alter table public.work_journal_contexts enable row level security;
alter table public.work_journal_hidden_context_suggestions enable row level security;
alter table public.work_journal_entries enable row level security;
alter table public.work_journal_highlights enable row level security;

create policy "Users can read their work journal contexts"
on public.work_journal_contexts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their work journal contexts"
on public.work_journal_contexts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their work journal contexts"
on public.work_journal_contexts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their work journal contexts"
on public.work_journal_contexts for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their hidden work journal suggestions"
on public.work_journal_hidden_context_suggestions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can hide work journal suggestions"
on public.work_journal_hidden_context_suggestions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete hidden work journal suggestions"
on public.work_journal_hidden_context_suggestions for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their work journal entries"
on public.work_journal_entries for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their work journal entries"
on public.work_journal_entries for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their work journal entries"
on public.work_journal_entries for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their work journal entries"
on public.work_journal_entries for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their work journal highlights"
on public.work_journal_highlights for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their work journal highlights"
on public.work_journal_highlights for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their work journal highlights"
on public.work_journal_highlights for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their work journal highlights"
on public.work_journal_highlights for delete
to authenticated
using ((select auth.uid()) = user_id);

create unique index if not exists work_journal_contexts_one_default_idx
on public.work_journal_contexts (user_id)
where is_default and status = 'active';

create index if not exists work_journal_contexts_user_status_idx
on public.work_journal_contexts (user_id, status, updated_at desc);

create index if not exists work_journal_entries_user_context_date_idx
on public.work_journal_entries (user_id, context_id, date_start desc);

create index if not exists work_journal_entries_user_created_idx
on public.work_journal_entries (user_id, created_at desc);

create index if not exists work_journal_highlights_user_context_status_idx
on public.work_journal_highlights (user_id, context_id, status, updated_at desc);

create index if not exists work_journal_highlights_source_entry_ids_idx
on public.work_journal_highlights using gin (source_entry_ids);

drop trigger if exists work_journal_contexts_set_updated_at on public.work_journal_contexts;
create trigger work_journal_contexts_set_updated_at
before update on public.work_journal_contexts
for each row
execute function public.set_updated_at();

drop trigger if exists work_journal_entries_set_updated_at on public.work_journal_entries;
create trigger work_journal_entries_set_updated_at
before update on public.work_journal_entries
for each row
execute function public.set_updated_at();

drop trigger if exists work_journal_highlights_set_updated_at on public.work_journal_highlights;
create trigger work_journal_highlights_set_updated_at
before update on public.work_journal_highlights
for each row
execute function public.set_updated_at();
