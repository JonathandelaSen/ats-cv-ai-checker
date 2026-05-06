alter table public.analyses
  add column if not exists offer_status text,
  add column if not exists offer_notes text,
  add column if not exists offer_next_action text,
  add column if not exists offer_next_action_at timestamptz;

alter table public.analyses
  drop constraint if exists analyses_offer_status_check;

alter table public.analyses
  add constraint analyses_offer_status_check
  check (
    offer_status is null
    or offer_status in (
      'interesante',
      'aplicado',
      'entrevista',
      'oferta',
      'rechazado',
      'descartado'
    )
  );

update public.analyses
set offer_status = 'interesante'
where analysis_mode = 'job_match'
  and offer_status is null;

alter table public.analyses
  alter column offer_status set default 'interesante';

create index if not exists analyses_user_offer_status_idx
on public.analyses (user_id, offer_status, created_at desc)
where analysis_mode = 'job_match';
