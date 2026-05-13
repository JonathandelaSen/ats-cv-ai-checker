alter table public.job_opportunities
  drop constraint if exists job_opportunities_source_job_match_analysis_id_fkey;

update public.job_opportunities jo
set source_job_match_analysis_id = null
where source_job_match_analysis_id is not null
  and not exists (
    select 1
    from public.job_match_analyses jma
    where jma.id = jo.source_job_match_analysis_id
  );

alter table public.job_opportunities
  add constraint job_opportunities_source_job_match_analysis_id_fkey
  foreign key (source_job_match_analysis_id)
  references public.job_match_analyses(id)
  on delete set null;

alter table public.follow_ups
  drop constraint if exists follow_ups_source_job_match_analysis_id_fkey;

update public.follow_ups fu
set source_job_match_analysis_id = null
where source_job_match_analysis_id is not null
  and not exists (
    select 1
    from public.job_match_analyses jma
    where jma.id = fu.source_job_match_analysis_id
  );

alter table public.follow_ups
  add constraint follow_ups_source_job_match_analysis_id_fkey
  foreign key (source_job_match_analysis_id)
  references public.job_match_analyses(id)
  on delete set null;

alter table public.process_questions
  drop constraint if exists process_questions_source_job_match_analysis_id_fkey;

update public.process_questions pq
set source_job_match_analysis_id = null
where source_job_match_analysis_id is not null
  and not exists (
    select 1
    from public.job_match_analyses jma
    where jma.id = pq.source_job_match_analysis_id
  );

alter table public.process_questions
  add constraint process_questions_source_job_match_analysis_id_fkey
  foreign key (source_job_match_analysis_id)
  references public.job_match_analyses(id)
  on delete set null;
