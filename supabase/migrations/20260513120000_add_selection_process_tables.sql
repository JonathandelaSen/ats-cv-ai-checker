create table if not exists public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  company text,
  location text,
  remote text,
  salary text,
  seniority text,
  contract_type text,
  benefits jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  responsibilities jsonb not null default '[]'::jsonb,
  notable_points jsonb not null default '[]'::jsonb,
  description text,
  url text,
  source_job_match_analysis_id uuid references public.analyses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_opportunities enable row level security;

create policy "Users can read their job opportunities"
on public.job_opportunities for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their job opportunities"
on public.job_opportunities for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their job opportunities"
on public.job_opportunities for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their job opportunities"
on public.job_opportunities for delete
to authenticated
using ((select auth.uid()) = user_id);

create unique index if not exists job_opportunities_source_analysis_unique_idx
on public.job_opportunities (source_job_match_analysis_id)
where source_job_match_analysis_id is not null;

create index if not exists job_opportunities_user_created_idx
on public.job_opportunities (user_id, created_at desc);

drop trigger if exists job_opportunities_set_updated_at on public.job_opportunities;
create trigger job_opportunities_set_updated_at
before update on public.job_opportunities
for each row
execute function public.set_updated_at();

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_opportunity_id uuid not null references public.job_opportunities(id) on delete cascade,
  status text not null default 'interesante',
  notes text,
  next_action text,
  next_action_at timestamptz,
  source_job_match_analysis_id uuid references public.analyses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_status_check
    check (status in ('interesante', 'aplicado', 'entrevista', 'oferta', 'rechazado', 'descartado')),
  constraint follow_ups_user_job_unique unique (user_id, job_opportunity_id)
);

alter table public.follow_ups enable row level security;

create policy "Users can read their follow ups"
on public.follow_ups for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their follow ups"
on public.follow_ups for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their follow ups"
on public.follow_ups for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their follow ups"
on public.follow_ups for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists follow_ups_user_status_idx
on public.follow_ups (user_id, status, updated_at desc);

drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at
before update on public.follow_ups
for each row
execute function public.set_updated_at();

create table if not exists public.process_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_opportunity_id uuid references public.job_opportunities(id) on delete set null,
  question text not null,
  context text,
  answer text,
  ai_model text,
  ai_generated_at timestamptz,
  source_job_match_analysis_id uuid references public.analyses(id) on delete set null,
  legacy_interview_question_id uuid unique references public.interview_questions(id) on delete set null,
  legacy_cv_id uuid references public.cvs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint process_questions_question_not_blank
    check (length(trim(question)) > 0)
);

alter table public.process_questions enable row level security;

create policy "Users can read their process questions"
on public.process_questions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their process questions"
on public.process_questions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their process questions"
on public.process_questions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their process questions"
on public.process_questions for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists process_questions_user_created_idx
on public.process_questions (user_id, created_at desc);

create index if not exists process_questions_user_job_idx
on public.process_questions (user_id, job_opportunity_id, created_at desc)
where job_opportunity_id is not null;

create index if not exists process_questions_user_source_analysis_idx
on public.process_questions (user_id, source_job_match_analysis_id, created_at desc)
where source_job_match_analysis_id is not null;

drop trigger if exists process_questions_set_updated_at on public.process_questions;
create trigger process_questions_set_updated_at
before update on public.process_questions
for each row
execute function public.set_updated_at();

insert into public.job_opportunities (
  user_id,
  title,
  company,
  location,
  remote,
  salary,
  seniority,
  contract_type,
  benefits,
  requirements,
  responsibilities,
  notable_points,
  description,
  url,
  source_job_match_analysis_id,
  created_at,
  updated_at
)
select
  a.user_id,
  coalesce(a.job_key_data->>'title', a.title),
  a.job_key_data->>'company',
  a.job_key_data->>'location',
  a.job_key_data->>'remote',
  a.job_key_data->>'salary',
  a.job_key_data->>'seniority',
  a.job_key_data->>'contractType',
  coalesce(a.job_key_data->'benefits', '[]'::jsonb),
  coalesce(a.job_key_data->'requirements', '[]'::jsonb),
  coalesce(a.job_key_data->'responsibilities', '[]'::jsonb),
  coalesce(a.job_key_data->'notablePoints', '[]'::jsonb),
  a.job_description,
  a.job_url,
  a.id,
  a.created_at,
  a.updated_at
from public.analyses a
where a.analysis_mode = 'job_match'
on conflict (source_job_match_analysis_id) where source_job_match_analysis_id is not null
do update set
  title = excluded.title,
  company = excluded.company,
  location = excluded.location,
  remote = excluded.remote,
  salary = excluded.salary,
  seniority = excluded.seniority,
  contract_type = excluded.contract_type,
  benefits = excluded.benefits,
  requirements = excluded.requirements,
  responsibilities = excluded.responsibilities,
  notable_points = excluded.notable_points,
  description = excluded.description,
  url = excluded.url,
  updated_at = excluded.updated_at;

insert into public.follow_ups (
  user_id,
  job_opportunity_id,
  status,
  notes,
  next_action,
  next_action_at,
  source_job_match_analysis_id,
  created_at,
  updated_at
)
select
  a.user_id,
  jo.id,
  coalesce(a.offer_status, 'interesante'),
  a.offer_notes,
  a.offer_next_action,
  a.offer_next_action_at,
  a.id,
  a.created_at,
  a.updated_at
from public.analyses a
join public.job_opportunities jo on jo.source_job_match_analysis_id = a.id
where a.analysis_mode = 'job_match'
on conflict (user_id, job_opportunity_id)
do update set
  status = excluded.status,
  notes = excluded.notes,
  next_action = excluded.next_action,
  next_action_at = excluded.next_action_at,
  source_job_match_analysis_id = excluded.source_job_match_analysis_id,
  updated_at = excluded.updated_at;

insert into public.process_questions (
  id,
  user_id,
  job_opportunity_id,
  question,
  context,
  answer,
  ai_model,
  ai_generated_at,
  source_job_match_analysis_id,
  legacy_interview_question_id,
  legacy_cv_id,
  created_at,
  updated_at
)
select
  iq.id,
  iq.user_id,
  jo.id,
  iq.question,
  iq.context,
  iq.answer,
  iq.ai_model,
  iq.ai_generated_at,
  iq.analysis_id,
  iq.id,
  iq.cv_id,
  iq.created_at,
  iq.updated_at
from public.interview_questions iq
left join public.job_opportunities jo on jo.source_job_match_analysis_id = iq.analysis_id
on conflict (legacy_interview_question_id)
do update set
  job_opportunity_id = excluded.job_opportunity_id,
  question = excluded.question,
  context = excluded.context,
  answer = excluded.answer,
  ai_model = excluded.ai_model,
  ai_generated_at = excluded.ai_generated_at,
  source_job_match_analysis_id = excluded.source_job_match_analysis_id,
  legacy_cv_id = excluded.legacy_cv_id,
  updated_at = excluded.updated_at;
