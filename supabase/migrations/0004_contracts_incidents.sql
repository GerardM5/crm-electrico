-- 0004_contracts_incidents.sql
-- Extiende contracts con campos energéticos/comerciales, redefine estados de
-- contrato y crea la tabla de incidencias. Sigue las convenciones reales de la
-- base de datos en producción: sin organization_id y RLS con
-- is_authenticated() / get_my_role().

-- 1) Campos energéticos y comerciales en contracts ---------------------------
alter table public.contracts
  add column if not exists cups text,
  add column if not exists provider text,
  add column if not exists product text,
  add column if not exists tariff_type text,
  add column if not exists power_kw numeric,
  add column if not exists annual_consumption_kwh numeric,
  add column if not exists energy_price_eur numeric,
  add column if not exists power_price_eur numeric,
  add column if not exists commission_eur numeric not null default 0,
  add column if not exists notes text;

-- contract_number pasa a ser opcional (se autogenera/edita desde la UI)
alter table public.contracts alter column contract_number drop not null;

-- 2) Nuevos estados de contrato (text + check) -------------------------------
-- contracts no tiene filas en producción; la conversión es segura.
alter table public.contracts alter column status drop default;

alter table public.contracts
  alter column status type text using (
    case status::text
      when 'draft' then 'pending_processing'
      when 'sent' then 'pending_signature'
      when 'signed' then 'active'
      when 'cancelled' then 'cancelled'
      else 'pending_processing'
    end
  );

alter table public.contracts alter column status set default 'pending_processing';

alter table public.contracts
  add constraint contracts_status_check
  check (status in ('pending_processing','processing','pending_signature','active','cancelled'));

-- 3) Tabla de incidencias ----------------------------------------------------
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  assigned_to uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

alter table public.incidents enable row level security;

drop policy if exists incidents_select on public.incidents;
drop policy if exists incidents_write on public.incidents;

create policy incidents_select on public.incidents
  for select using (public.is_authenticated());

create policy incidents_write on public.incidents
  for all
  using (public.get_my_role() = any (array['owner','admin','sales']::app_role[]))
  with check (public.get_my_role() = any (array['owner','admin','sales']::app_role[]));

create index if not exists incidents_customer_idx on public.incidents (customer_id);
create index if not exists incidents_contract_idx on public.incidents (contract_id);
create index if not exists incidents_status_idx on public.incidents (status);
