-- Add the sales channel/provider source used to originate each contract.
alter table public.contracts
  add column if not exists sales_channel text;
