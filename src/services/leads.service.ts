import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type LeadRow = Tables<'leads'>

interface LeadsFilter {
  search?: string
  status?: string
  assignedTo?: string
  page?: number
  pageSize?: number
}

export function useLeads(filter: LeadsFilter = {}) {
  const { search, status, assignedTo, page = 0, pageSize = 25 } = filter
  return useQuery<{ data: LeadRow[]; total: number }>({
    queryKey: queryKeys.leads(filter),
    queryFn: async () => {
      let q = supabase.from('leads').select('*', { count: 'exact' }).is('deleted_at', null)
      if (search) q = q.or(`contact_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`)
      if (status) q = q.eq('status', status)
      if (assignedTo) q = q.eq('assigned_to', assignedTo)
      q = q.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1)
      const { data, error, count } = await q
      if (error) throw error
      return { data: data as LeadRow[], total: count ?? 0 }
    },
  })
}

export function useLead(id: string) {
  return useQuery<LeadRow>({
    queryKey: queryKeys.lead(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
      if (error) throw error
      return data as LeadRow
    },
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'leads'>) => {
      const { data, error } = await supabase.from('leads').insert(payload).select().single()
      if (error) throw error
      return data as LeadRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.leads() }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'leads'> & { id: string }) => {
      const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as LeadRow
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads() })
      qc.invalidateQueries({ queryKey: queryKeys.lead(vars.id) })
    },
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, customerId }: { leadId: string; customerId: string }) => {
      const { error } = await supabase.from('leads').update({ status: 'converted', converted_customer_id: customerId }).eq('id', leadId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads() })
      qc.invalidateQueries({ queryKey: queryKeys.customers() })
    },
  })
}
