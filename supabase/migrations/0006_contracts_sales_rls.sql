-- Fix: sales users should only see (and write) contracts for customers
-- assigned to them. owners and admins keep full visibility; technicians and
-- viewers keep full read access.
-- The contracts table has no organization_id; isolation goes through customer_id.

-- Reusable predicate: row's customer is assigned to the current user.
-- (Inlined as an EXISTS in every policy to avoid an extra function dependency.)

-- 1) SELECT ------------------------------------------------------------------
drop policy if exists contracts_select on public.contracts;

create policy contracts_select on public.contracts
  for select using (
    public.is_authenticated()
    and (
      -- privileged roles see all contracts
      public.get_my_role() = any(array['owner', 'admin', 'technician', 'viewer']::app_role[])
      or
      -- sales users only see contracts whose customer is assigned to them
      exists (
        select 1
        from public.customers c
        where c.id = contracts.customer_id
          and c.assigned_to = auth.uid()
      )
    )
  );

-- 2) Writes ------------------------------------------------------------------
-- The previous `contracts_write` policy used `for all`, whose USING clause also
-- applies to SELECT. Combined with OR, it let any sales user read every
-- contract, defeating contracts_select. Split it into explicit
-- INSERT / UPDATE / DELETE policies so SELECT is governed solely by
-- contracts_select, and scope sales writes to their own customers.
drop policy if exists contracts_write on public.contracts;

create policy contracts_insert on public.contracts
  for insert with check (
    public.get_my_role() = any(array['owner', 'admin']::app_role[])
    or (
      public.get_my_role() = 'sales'::app_role
      and exists (
        select 1
        from public.customers c
        where c.id = customer_id
          and c.assigned_to = auth.uid()
      )
    )
  );

create policy contracts_update on public.contracts
  for update
  using (
    public.get_my_role() = any(array['owner', 'admin']::app_role[])
    or (
      public.get_my_role() = 'sales'::app_role
      and exists (
        select 1
        from public.customers c
        where c.id = contracts.customer_id
          and c.assigned_to = auth.uid()
      )
    )
  )
  with check (
    public.get_my_role() = any(array['owner', 'admin']::app_role[])
    or (
      public.get_my_role() = 'sales'::app_role
      and exists (
        select 1
        from public.customers c
        where c.id = contracts.customer_id
          and c.assigned_to = auth.uid()
      )
    )
  );

create policy contracts_delete on public.contracts
  for delete using (
    public.get_my_role() = any(array['owner', 'admin']::app_role[])
    or (
      public.get_my_role() = 'sales'::app_role
      and exists (
        select 1
        from public.customers c
        where c.id = contracts.customer_id
          and c.assigned_to = auth.uid()
      )
    )
  );
