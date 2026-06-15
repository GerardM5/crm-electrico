import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type IncidentRow = Tables<'incidents'>

export function useIncidents(
  filter: { customerId?: string; contractId?: string; status?: string } = {},
) {
  return useQuery<IncidentRow[]>({
    queryKey: queryKeys.incidents(filter),
    queryFn: async () => {
      let q = supabase.from('incidents').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      if (filter.contractId) q = q.eq('contract_id', filter.contractId)
      if (filter.status) q = q.eq('status', filter.status)
      const { data, error } = await q
      if (error) throw error
      return data as IncidentRow[]
    },
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'incidents'>) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(payload as never)
        .select()
        .single()
      if (error) throw error
      return data as IncidentRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.incidents() }),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'incidents'> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(payload as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as IncidentRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.incidents() }),
  })
}

export function useDeleteIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.incidents() }),
  })
}
