import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type DealRow = Tables<'deals'>
export type PipelineStageRow = Tables<'pipeline_stages'>

export function useDeals(filter: { customerId?: string; leadId?: string } = {}) {
  return useQuery<DealRow[]>({
    queryKey: queryKeys.deals(filter),
    queryFn: async () => {
      let q = supabase.from('deals').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      if (filter.leadId) q = q.eq('lead_id', filter.leadId)
      const { data, error } = await q
      if (error) throw error
      return data as DealRow[]
    },
  })
}

export function usePipelineStages() {
  return useQuery<PipelineStageRow[]>({
    queryKey: queryKeys.pipelineStages,
    queryFn: async () => {
      const { data, error } = await supabase.from('pipeline_stages').select('*').order('position')
      if (error) throw error
      return data as PipelineStageRow[]
    },
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'deals'>) => {
      const { data, error } = await supabase.from('deals').insert(payload as never).select().single()
      if (error) throw error
      return data as DealRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deals() }),
  })
}

export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'deals'> & { id: string }) => {
      const { data, error } = await supabase.from('deals').update(payload as never).eq('id', id).select().single()
      if (error) throw error
      return data as DealRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deals() }),
  })
}

export function useMoveDeals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase.from('deals').update({ stage_id: stageId } as never).eq('id', dealId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deals() }),
  })
}
