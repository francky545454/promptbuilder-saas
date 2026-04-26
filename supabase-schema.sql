-- PromptBuilder Pro — Supabase Schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New query)

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  credits      integer not null default 5,
  total_purchased integer not null default 0,
  created_at   timestamptz default now()
);

-- ─── PROMPT HISTORY ───────────────────────────────────────────────────────────
create table if not exists public.prompt_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text not null check (type in ('build', 'improve', 'test')),
  original_prompt text,
  result         jsonb,
  credits_used   integer not null default 1,
  created_at     timestamptz default now()
);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_id   text unique,
  amount_eur          numeric(10,2),
  credits_purchased   integer not null default 500,
  status              text not null default 'completed',
  created_at          timestamptz default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists prompt_history_user_id_idx on public.prompt_history(user_id);
create index if not exists prompt_history_created_at_idx on public.prompt_history(created_at desc);
create index if not exists transactions_user_id_idx on public.transactions(user_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.prompt_history enable row level security;
alter table public.transactions   enable row level security;

-- Profiles: users can only read/update their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Prompt history: users can read/insert/delete their own rows
create policy "history_select_own" on public.prompt_history
  for select using (auth.uid() = user_id);
create policy "history_insert_own" on public.prompt_history
  for insert with check (auth.uid() = user_id);
create policy "history_delete_own" on public.prompt_history
  for delete using (auth.uid() = user_id);

-- Transactions: users can only read their own
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

-- ─── TRIGGER: create profile on signup ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, credits, total_purchased)
  values (new.id, new.email, 5, 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SERVICE ROLE BYPASS (for webhook API) ────────────────────────────────────
-- The Stripe webhook uses the service role key which bypasses RLS.
-- No extra policy needed — service role has full access by default.
