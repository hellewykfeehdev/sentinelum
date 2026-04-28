-- Idempotent repair migration for existing Supabase projects created from earlier drafts.
-- Run this after 001_initial_schema.sql if your dashboard logs mention missing columns,
-- schema cache issues, or subscription_status enum errors.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.profiles') is null then
    create table profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text not null,
      full_name text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  end if;

  if to_regclass('public.workspaces') is null then
    create table workspaces (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      owner_user_id uuid references profiles(id) on delete cascade,
      plan text default 'free',
      subscription_status text default 'incomplete',
      stripe_customer_id text unique,
      stripe_subscription_id text unique,
      annual_certificate_allowance integer default 10000,
      usage_period_start timestamptz,
      usage_period_end timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  end if;
end $$;

alter table workspaces add column if not exists owner_user_id uuid references profiles(id) on delete cascade;
alter table workspaces add column if not exists plan text default 'free';
alter table workspaces add column if not exists stripe_customer_id text;
alter table workspaces add column if not exists stripe_subscription_id text;
alter table workspaces add column if not exists annual_certificate_allowance integer default 10000;
alter table workspaces add column if not exists usage_period_start timestamptz;
alter table workspaces add column if not exists usage_period_end timestamptz;
alter table workspaces add column if not exists created_at timestamptz default now();
alter table workspaces add column if not exists updated_at timestamptz default now();

alter table workspaces add column if not exists subscription_status text default 'incomplete';
alter table workspaces
  alter column subscription_status drop default,
  alter column subscription_status type text using subscription_status::text;

alter table workspaces alter column subscription_status set default 'incomplete';
update workspaces
set subscription_status = 'incomplete'
where subscription_status is null or subscription_status in ('none', '');

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'owner',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  certificate_number text unique not null,
  ai_system_name text not null,
  model_name text not null,
  ai_output_hash text not null,
  human_reviewer_name text not null,
  human_reviewer_email text not null,
  human_reviewer_role text not null,
  decision text not null,
  decision_notes text not null,
  risk_flags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  payload_hash text not null,
  certificate_hash text not null unique,
  signature text not null,
  pdf_url text,
  verification_url text,
  status text default 'issued',
  issued_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  certificate_id uuid references certificates(id) on delete set null,
  event_type text not null default 'certificate.generated',
  quantity integer not null default 1,
  included_in_plan boolean default true,
  reported_to_stripe boolean default false,
  stripe_reported boolean default false,
  stripe_event_id text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now(),
  payload jsonb
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  amount_paid integer,
  amount_due integer,
  currency text,
  hosted_invoice_url text,
  invoice_pdf text,
  created_at timestamptz default now()
);

create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_certificates_workspace_created on certificates(workspace_id, created_at desc);
create index if not exists idx_usage_workspace_created on usage_events(workspace_id, created_at desc);
create index if not exists idx_api_keys_hash on api_keys(key_hash);

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table api_keys enable row level security;
alter table certificates enable row level security;
alter table usage_events enable row level security;
alter table audit_logs enable row level security;
alter table invoices enable row level security;
alter table stripe_events enable row level security;

create or replace function is_workspace_member(workspace uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = workspace and user_id = auth.uid()
  );
$$;

create or replace function prevent_certificate_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.pdf_url is distinct from old.pdf_url and
       new.ai_system_name = old.ai_system_name and
       new.model_name = old.model_name and
       new.ai_output_hash = old.ai_output_hash and
       new.human_reviewer_name = old.human_reviewer_name and
       new.human_reviewer_email = old.human_reviewer_email and
       new.human_reviewer_role = old.human_reviewer_role and
       new.decision = old.decision and
       new.decision_notes = old.decision_notes and
       new.risk_flags = old.risk_flags and
       new.metadata = old.metadata and
       new.payload_hash = old.payload_hash and
       new.certificate_hash = old.certificate_hash and
       new.signature = old.signature then
      return new;
    end if;
    raise exception 'certificates are append-only';
  end if;

  if tg_op = 'DELETE' then
    raise exception 'certificates cannot be deleted';
  end if;

  return new;
end;
$$;

drop trigger if exists certificates_append_only on certificates;
create trigger certificates_append_only
before update or delete on certificates
for each row execute function prevent_certificate_mutation();
