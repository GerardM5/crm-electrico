-- Fix: sales users should only see documents for customers assigned to them.
-- owners, admins, technicians and viewers keep full visibility.
-- Note: documents table has no organization_id; isolation goes through customer_id.

-- SELECT ---------------------------------------------------------------------
drop policy if exists documents_select on public.documents;

create policy documents_select on public.documents
  for select using (
    public.is_authenticated()
    and (
      -- privileged roles see all documents
      public.get_my_role() = any(array['owner', 'admin', 'technician', 'viewer']::app_role[])
      or
      -- sales: only documents linked to their assigned customers
      (
        public.get_my_role() = 'sales'::app_role
        and (
          -- linked directly to an assigned customer
          (customer_id is not null and exists (
            select 1 from public.customers c
            where c.id = documents.customer_id
              and c.assigned_to = auth.uid()
          ))
          or
          -- linked via a deal whose customer is assigned to them
          (customer_id is null and deal_id is not null and exists (
            select 1 from public.deals d
            join public.customers c on c.id = d.customer_id
            where d.id = documents.deal_id
              and c.assigned_to = auth.uid()
          ))
          or
          -- fallback: uploaded by the sales user themselves
          uploaded_by = auth.uid()
        )
      )
    )
  );

-- WRITE (split FOR ALL into explicit ops to avoid USING leaking into SELECT) --
drop policy if exists documents_write on public.documents;

create policy documents_insert on public.documents
  for insert with check (
    public.get_my_role() = any(array['owner', 'admin', 'sales']::app_role[])
  );

create policy documents_update on public.documents
  for update
  using (public.get_my_role() = any(array['owner', 'admin', 'sales']::app_role[]))
  with check (public.get_my_role() = any(array['owner', 'admin', 'sales']::app_role[]));

create policy documents_delete on public.documents
  for delete using (
    public.get_my_role() = any(array['owner', 'admin']::app_role[])
  );
