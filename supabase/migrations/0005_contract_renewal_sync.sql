-- Migration: auto-sync customers.renewal_date and contract_signed_at from contracts
-- When a contract with status 'active' is saved, update the parent customer's
-- renewal_date (= ends_at) and contract_signed_at (= starts_at).
-- Also auto-update customer status to 'renewal_due' is removed from manual form,
-- but 'renewed' transition remains via the existing renewCustomer action.

-- Function called by the trigger
create or replace function public.sync_customer_renewal_from_contract()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when the contract is (or becomes) active and has an ends_at date
  if NEW.status = 'active' and NEW.ends_at is not null then
    update public.customers
    set
      renewal_date        = NEW.ends_at,
      contract_signed_at  = coalesce(NEW.signed_at, NEW.starts_at::timestamptz),
      updated_at          = now()
    where id = NEW.customer_id;
  end if;
  return NEW;
end;
$$;

-- Trigger fires after INSERT or UPDATE on contracts
drop trigger if exists trg_contract_renewal_sync on public.contracts;
create trigger trg_contract_renewal_sync
  after insert or update of status, ends_at, starts_at, signed_at
  on public.contracts
  for each row
  execute function public.sync_customer_renewal_from_contract();
