-- Remove 'incident' from contract status — incidents are a separate entity

-- Migrate any existing contracts with status='incident' to 'active'
-- (or choose another sensible default; adjust if needed)
update public.contracts
set status = 'active'
where status = 'incident';

-- Drop old constraint and recreate without 'incident'
alter table public.contracts drop constraint if exists contracts_status_check;

alter table public.contracts
  add constraint contracts_status_check
  check (status in (
    'pending_processing',
    'processing',
    'pending_signature',
    'active',
    'cancelled',
    'terminated'
  ));
