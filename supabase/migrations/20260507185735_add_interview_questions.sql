create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  context text,
  answer text,
  cv_id uuid references public.cvs(id) on delete set null,
  analysis_id uuid references public.analyses(id) on delete set null,
  ai_model text,
  ai_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_questions_question_not_blank
    check (length(trim(question)) > 0)
);

alter table public.interview_questions enable row level security;

create policy "Users can read their interview questions"
on public.interview_questions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their interview questions"
on public.interview_questions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their interview questions"
on public.interview_questions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their interview questions"
on public.interview_questions for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists interview_questions_user_created_idx
on public.interview_questions (user_id, created_at desc);

create index if not exists interview_questions_user_cv_idx
on public.interview_questions (user_id, cv_id, created_at desc)
where cv_id is not null;

create index if not exists interview_questions_user_analysis_idx
on public.interview_questions (user_id, analysis_id, created_at desc)
where analysis_id is not null;

drop trigger if exists interview_questions_set_updated_at on public.interview_questions;
create trigger interview_questions_set_updated_at
before update on public.interview_questions
for each row
execute function public.set_updated_at();
