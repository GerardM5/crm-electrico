-- Delete a customer and all app-owned data that is not covered by FK cascade.
-- Documents, contracts, incidents, tasks and other customer-owned rows cascade
-- from public.customers. Activity logs use a generic entity_id, and converted
-- leads point back to customers without ON DELETE behavior, so they are handled
-- explicitly here.

create or replace function public.delete_customer_cascade(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role text;
  v_has_customer_org boolean;
  v_customer_exists boolean;
begin
  select p.role::text
  into v_role
  from public.profiles p
  where p.id = auth.uid();

  if v_role not in ('owner', 'admin') then
    raise exception 'No tienes permisos para eliminar clientes.'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'organization_id'
  )
  into v_has_customer_org;

  execute 'select exists(select 1 from public.customers where id = $1)'
  into v_customer_exists
  using p_customer_id;

  if not v_customer_exists then
    raise exception 'Cliente no encontrado o sin permisos para eliminarlo.'
      using errcode = 'P0002';
  end if;

  if v_has_customer_org then
    execute 'select organization_id from public.customers where id = $1'
    into v_org_id
    using p_customer_id;
  end if;

  if to_regclass('public.leads') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'leads'
        and column_name = 'converted_customer_id'
    )
  then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'leads'
        and column_name = 'updated_at'
    ) then
      execute 'update public.leads set converted_customer_id = null, updated_at = now() where converted_customer_id = $1'
      using p_customer_id;
    else
      execute 'update public.leads set converted_customer_id = null where converted_customer_id = $1'
      using p_customer_id;
    end if;
  end if;

  delete from public.customers
  where id = p_customer_id;

  if to_regclass('public.activity_logs') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'activity_logs'
        and column_name = 'entity_type'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'activity_logs'
        and column_name = 'entity_id'
    )
  then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'activity_logs'
        and column_name = 'organization_id'
    ) then
      if v_org_id is not null then
        execute 'delete from public.activity_logs where organization_id = $1 and entity_type = $2 and entity_id = $3'
        using v_org_id, 'customer', p_customer_id;
      else
        execute 'delete from public.activity_logs where entity_type = $1 and entity_id = $2'
        using 'customer', p_customer_id;
      end if;
    else
      execute 'delete from public.activity_logs where entity_type = $1 and entity_id = $2'
      using 'customer', p_customer_id;
    end if;
  end if;
end;
$$;

revoke all on function public.delete_customer_cascade(uuid) from public;
grant execute on function public.delete_customer_cascade(uuid) to authenticated;
