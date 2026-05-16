create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interface_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_interface_language_check
    check (interface_language in ('en', 'es'))
);

alter table public.user_preferences enable row level security;

create policy "Users can read their preferences"
on public.user_preferences for select
using ((select auth.uid()) = user_id);

create policy "Users can create their preferences"
on public.user_preferences for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their preferences"
on public.user_preferences for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();
