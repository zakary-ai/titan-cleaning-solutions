create table public.issue_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  issue_id uuid not null,
  last_read_at timestamptz not null default now(),
  unique (user_id, issue_id)
);

create index idx_issue_reads_user on public.issue_reads(user_id);

alter table public.issue_reads enable row level security;

create policy "Users view own issue reads"
  on public.issue_reads for select
  using (auth.uid() = user_id);

create policy "Users insert own issue reads"
  on public.issue_reads for insert
  with check (auth.uid() = user_id);

create policy "Users update own issue reads"
  on public.issue_reads for update
  using (auth.uid() = user_id);