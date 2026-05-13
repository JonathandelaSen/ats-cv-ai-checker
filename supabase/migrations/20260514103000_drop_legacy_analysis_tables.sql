alter table public.processing_events
  drop constraint if exists processing_events_analysis_id_fkey;

alter table public.cv_analyses
  drop constraint if exists cv_analyses_legacy_analysis_id_fkey;

alter table public.job_match_analyses
  drop constraint if exists job_match_analyses_legacy_analysis_id_fkey;

alter table public.process_questions
  drop constraint if exists process_questions_legacy_interview_question_id_fkey;

drop table if exists public.interview_questions;
drop table if exists public.analyses;
