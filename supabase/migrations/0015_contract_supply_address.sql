-- Move the supply (point of supply) address from customers to contracts.
-- Each contract represents a single point of supply, so its physical
-- address now lives on the contract rather than the customer. The customer
-- keeps its correspondence (mailing) address.
alter table public.contracts
  add column if not exists supply_address text,
  add column if not exists supply_city text,
  add column if not exists supply_province text,
  add column if not exists supply_postal_code text;
