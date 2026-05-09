alter table public.cvs
  add column if not exists public_enabled boolean not null default false,
  add column if not exists public_id text,
  add column if not exists public_slug text,
  add column if not exists public_published_at timestamptz;

alter table public.cvs
  add constraint cvs_public_id_unique unique (public_id);

create index if not exists cvs_public_lookup_idx
on public.cvs (public_id, public_enabled)
where public_id is not null;

alter table public.cvs
  add constraint cvs_public_slug_format
  check (
    public_slug is null
    or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  );
