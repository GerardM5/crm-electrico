-- Contact tracking for the renewal queue.
-- activity_logs remains append-only; the authenticated user is always the actor.

create or replace function public.set_activity_log_actor()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.actor_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_activity_log_actor on public.activity_logs;
create trigger trg_activity_log_actor
  before insert on public.activity_logs
  for each row
  execute function public.set_activity_log_actor();

-- Older installations include organization_id, while the current production
-- schema derives access from the authenticated profile. Support both layouts.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'activity_logs'
      and column_name = 'organization_id'
  ) then
    execute '
      alter table public.activity_logs
      alter column organization_id set default public.current_org_id()
    ';
  end if;
end
$$;

create or replace function public.sync_customer_last_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.entity_type = 'customer' and new.action = 'renewal_contact' then
    update public.customers
    set last_contact_at = new.created_at
    where id = new.entity_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_customer_last_contact on public.activity_logs;
create trigger trg_sync_customer_last_contact
  after insert on public.activity_logs
  for each row
  execute function public.sync_customer_last_contact();

create index if not exists activity_logs_renewal_contacts_idx
  on public.activity_logs (entity_id, created_at desc)
  where entity_type = 'customer' and action = 'renewal_contact';
