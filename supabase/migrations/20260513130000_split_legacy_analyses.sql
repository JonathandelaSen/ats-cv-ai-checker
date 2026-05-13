create table if not exists public.cv_analyses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_document_id uuid references public.cvs(id) on delete set null,
  cv_structured_profile_id uuid references public.cv_structured_profiles(id) on delete set null,
  title text not null,
  filename text not null,
  file_size bigint,
  pdf_storage_path text,
  text_python text,
  text_pdfjs text,
  text_node text,
  extract_error_python text,
  extract_error_pdfjs text,
  extract_error_node text,
  ai_model text,
  score integer,
  feedback text,
  keywords jsonb,
  improvements jsonb,
  ai_context jsonb,
  analyzed_at timestamptz,
  legacy_analysis_id uuid unique references public.analyses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cv_analyses enable row level security;

create policy "Users can read their CV analyses"
on public.cv_analyses for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their CV analyses"
on public.cv_analyses for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their CV analyses"
on public.cv_analyses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their CV analyses"
on public.cv_analyses for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists cv_analyses_user_created_idx
on public.cv_analyses (user_id, created_at desc);

create index if not exists cv_analyses_cv_document_idx
on public.cv_analyses (user_id, cv_document_id, created_at desc)
where cv_document_id is not null;

drop trigger if exists cv_analyses_set_updated_at on public.cv_analyses;
create trigger cv_analyses_set_updated_at
before update on public.cv_analyses
for each row
execute function public.set_updated_at();

create table if not exists public.job_match_analyses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_document_id uuid references public.cvs(id) on delete set null,
  cv_structured_profile_id uuid references public.cv_structured_profiles(id) on delete set null,
  job_opportunity_id uuid references public.job_opportunities(id) on delete set null,
  title text not null,
  filename text not null,
  file_size bigint,
  pdf_storage_path text,
  text_python text,
  text_pdfjs text,
  text_node text,
  extract_error_python text,
  extract_error_pdfjs text,
  extract_error_node text,
  ai_model text,
  score integer,
  feedback text,
  ai_keywords jsonb,
  improvements jsonb,
  job_snapshot jsonb,
  job_keywords jsonb,
  cv_keywords jsonb,
  matching_keywords jsonb,
  missing_keywords jsonb,
  analyzed_at timestamptz,
  legacy_analysis_id uuid unique references public.analyses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_match_analyses enable row level security;

create policy "Users can read their job match analyses"
on public.job_match_analyses for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their job match analyses"
on public.job_match_analyses for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their job match analyses"
on public.job_match_analyses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their job match analyses"
on public.job_match_analyses for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists job_match_analyses_user_created_idx
on public.job_match_analyses (user_id, created_at desc);

create index if not exists job_match_analyses_job_opportunity_idx
on public.job_match_analyses (user_id, job_opportunity_id, created_at desc)
where job_opportunity_id is not null;

drop trigger if exists job_match_analyses_set_updated_at on public.job_match_analyses;
create trigger job_match_analyses_set_updated_at
before update on public.job_match_analyses
for each row
execute function public.set_updated_at();

insert into public.cv_analyses (
  id,
  user_id,
  cv_document_id,
  title,
  filename,
  file_size,
  pdf_storage_path,
  text_python,
  text_pdfjs,
  text_node,
  extract_error_python,
  extract_error_pdfjs,
  extract_error_node,
  ai_model,
  score,
  feedback,
  keywords,
  improvements,
  ai_context,
  analyzed_at,
  legacy_analysis_id,
  created_at,
  updated_at
)
select
  id,
  user_id,
  cv_id,
  title,
  filename,
  file_size,
  pdf_storage_path,
  text_python,
  text_pdfjs,
  text_node,
  extract_error_python,
  extract_error_pdfjs,
  extract_error_node,
  ai_model,
  ai_score,
  ai_feedback,
  coalesce(ai_keywords, '[]'::jsonb),
  coalesce(ai_improvements, '[]'::jsonb),
  ai_context,
  ai_analyzed_at,
  id,
  created_at,
  updated_at
from public.analyses
where analysis_mode = 'general'
on conflict (id) do update set
  cv_document_id = excluded.cv_document_id,
  title = excluded.title,
  filename = excluded.filename,
  file_size = excluded.file_size,
  pdf_storage_path = excluded.pdf_storage_path,
  text_python = excluded.text_python,
  text_pdfjs = excluded.text_pdfjs,
  text_node = excluded.text_node,
  extract_error_python = excluded.extract_error_python,
  extract_error_pdfjs = excluded.extract_error_pdfjs,
  extract_error_node = excluded.extract_error_node,
  ai_model = excluded.ai_model,
  score = excluded.score,
  feedback = excluded.feedback,
  keywords = excluded.keywords,
  improvements = excluded.improvements,
  ai_context = excluded.ai_context,
  analyzed_at = excluded.analyzed_at,
  legacy_analysis_id = excluded.legacy_analysis_id,
  updated_at = excluded.updated_at;

insert into public.job_match_analyses (
  id,
  user_id,
  cv_document_id,
  job_opportunity_id,
  title,
  filename,
  file_size,
  pdf_storage_path,
  text_python,
  text_pdfjs,
  text_node,
  extract_error_python,
  extract_error_pdfjs,
  extract_error_node,
  ai_model,
  score,
  feedback,
  ai_keywords,
  improvements,
  job_snapshot,
  job_keywords,
  cv_keywords,
  matching_keywords,
  missing_keywords,
  analyzed_at,
  legacy_analysis_id,
  created_at,
  updated_at
)
select
  a.id,
  a.user_id,
  a.cv_id,
  jo.id,
  a.title,
  a.filename,
  a.file_size,
  a.pdf_storage_path,
  a.text_python,
  a.text_pdfjs,
  a.text_node,
  a.extract_error_python,
  a.extract_error_pdfjs,
  a.extract_error_node,
  a.ai_model,
  a.ai_score,
  a.ai_feedback,
  coalesce(a.ai_keywords, '[]'::jsonb),
  coalesce(a.ai_improvements, '[]'::jsonb),
  jsonb_build_object(
    'description', a.job_description,
    'url', a.job_url,
    'keyData', a.job_key_data
  ),
  coalesce(a.job_keywords, '[]'::jsonb),
  coalesce(a.cv_keywords, '[]'::jsonb),
  coalesce(a.matching_keywords, '[]'::jsonb),
  coalesce(a.missing_keywords, '[]'::jsonb),
  a.ai_analyzed_at,
  a.id,
  a.created_at,
  a.updated_at
from public.analyses a
left join public.job_opportunities jo on jo.source_job_match_analysis_id = a.id
where a.analysis_mode = 'job_match'
on conflict (id) do update set
  cv_document_id = excluded.cv_document_id,
  job_opportunity_id = excluded.job_opportunity_id,
  title = excluded.title,
  filename = excluded.filename,
  file_size = excluded.file_size,
  pdf_storage_path = excluded.pdf_storage_path,
  text_python = excluded.text_python,
  text_pdfjs = excluded.text_pdfjs,
  text_node = excluded.text_node,
  extract_error_python = excluded.extract_error_python,
  extract_error_pdfjs = excluded.extract_error_pdfjs,
  extract_error_node = excluded.extract_error_node,
  ai_model = excluded.ai_model,
  score = excluded.score,
  feedback = excluded.feedback,
  ai_keywords = excluded.ai_keywords,
  improvements = excluded.improvements,
  job_snapshot = excluded.job_snapshot,
  job_keywords = excluded.job_keywords,
  cv_keywords = excluded.cv_keywords,
  matching_keywords = excluded.matching_keywords,
  missing_keywords = excluded.missing_keywords,
  analyzed_at = excluded.analyzed_at,
  legacy_analysis_id = excluded.legacy_analysis_id,
  updated_at = excluded.updated_at;
