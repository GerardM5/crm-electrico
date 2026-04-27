create extension if not exists "pgcrypto";

do $$ begin create type app_role as enum ('owner', 'admin', 'sales', 'technician', 'viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type lead_status as enum ('new', 'contacted', 'qualified', 'lost', 'converted'); exception when duplicate_object then null; end $$;
do $$ begin create type customer_type as enum ('residential', 'business', 'community', 'industrial'); exception when duplicate_object then null; end $$;
do $$ begin create type deal_status as enum ('open', 'won', 'lost'); exception when duplicate_object then null; end $$;
do $$ begin create type proposal_status as enum ('draft', 'sent', 'accepted', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type contract_status as enum ('draft', 'sent', 'signed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type installation_status as enum ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type task_status as enum ('pending', 'in_progress', 'done', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type task_priority as enum ('low', 'medium', 'high', 'urgent'); exception when duplicate_object then null; end $$;
do $$ begin create type document_type as enum ('invoice', 'proposal', 'contract', 'dni', 'cif', 'technical_photo', 'other'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  role app_role not null default 'viewer',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null,
  status lead_status not null default 'new',
  company_name text,
  contact_name text not null,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  notes text,
  estimated_monthly_bill numeric(10,2),
  created_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  converted_customer_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id),
  type customer_type not null default 'business',
  name text not null,
  legal_name text,
  tax_id text,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  province text,
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  notes text,
  created_by uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  add constraint leads_converted_customer_id_fkey
  foreign key (converted_customer_id) references public.customers(id) deferrable initially deferred;

create table if not exists public.customer_energy_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade unique,
  cups text,
  tariff_type text not null,
  contracted_power_kw numeric(8,2) not null,
  monthly_consumption_kwh numeric(10,2) not null,
  monthly_cost_eur numeric(10,2) not null,
  annual_consumption_kwh numeric(12,2),
  has_solar boolean not null default false,
  roof_area_m2 numeric(10,2),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  energy_profile_id uuid references public.customer_energy_profiles(id) on delete set null,
  file_path text not null,
  file_name text not null,
  period_start date,
  period_end date,
  total_amount_eur numeric(10,2) not null,
  consumption_kwh numeric(10,2),
  contracted_power_kw numeric(8,2),
  tariff_type text,
  provider text,
  uploaded_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saving_simulations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  energy_profile_id uuid references public.customer_energy_profiles(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  current_monthly_cost_eur numeric(10,2) not null,
  contracted_power_kw numeric(8,2),
  monthly_consumption_kwh numeric(10,2),
  tariff_type text,
  estimated_saving_percent numeric(5,2) not null,
  proposed_monthly_cost_eur numeric(10,2) not null,
  monthly_saving_eur numeric(10,2) not null,
  annual_saving_eur numeric(10,2) not null,
  solar_investment_eur numeric(12,2),
  roi_years numeric(6,2),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position int not null,
  color text,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  stage_id uuid not null references public.pipeline_stages(id),
  title text not null,
  status deal_status not null default 'open',
  value_eur numeric(12,2) not null default 0,
  probability int not null default 25 check (probability between 0 and 100),
  expected_close_date date,
  assigned_to uuid references public.profiles(id),
  won_at timestamptz,
  lost_reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  simulation_id uuid references public.saving_simulations(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  status proposal_status not null default 'draft',
  title text not null,
  services jsonb not null default '[]'::jsonb,
  estimated_price_eur numeric(12,2) not null default 0,
  valid_until date not null,
  html_snapshot text,
  pdf_path text,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  status contract_status not null default 'draft',
  contract_number text not null,
  signed_at timestamptz,
  starts_at date,
  ends_at date,
  amount_eur numeric(12,2) not null default 0,
  file_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  status installation_status not null default 'pending',
  type text not null,
  address text not null,
  city text,
  province text,
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  assigned_technician uuid references public.profiles(id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  installation_id uuid references public.installations(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  due_at timestamptz not null,
  assigned_to uuid references public.profiles(id),
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  installation_id uuid references public.installations(id) on delete cascade,
  type document_type not null default 'other',
  bucket text not null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installation_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  installation_id uuid not null references public.installations(id) on delete cascade,
  technician_id uuid references public.profiles(id),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  latitude numeric(10,7),
  longitude numeric(10,7),
  notes text,
  photo_paths text[] not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_org_status on public.leads(organization_id, status) where deleted_at is null;
create index if not exists idx_customers_org_name on public.customers(organization_id, name) where deleted_at is null;
create index if not exists idx_deals_org_stage on public.deals(organization_id, stage_id, status);
create index if not exists idx_tasks_org_assignee_due on public.tasks(organization_id, assigned_to, due_at);
create index if not exists idx_documents_org_customer on public.documents(organization_id, customer_id);
create index if not exists idx_invoices_org_customer on public.invoices(organization_id, customer_id);
create index if not exists idx_activity_org_created on public.activity_logs(organization_id, created_at desc);
create index if not exists idx_installations_org_status on public.installations(organization_id, status);
create unique index if not exists idx_pipeline_stage_position on public.pipeline_stages(organization_id, position);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations','profiles','leads','customers','customer_energy_profiles','invoices',
    'saving_simulations','pipeline_stages','deals','proposals','contracts','installations',
    'tasks','documents','installation_visits'
  ]
  loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;
