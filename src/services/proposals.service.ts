import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type ProposalRow = Tables<'proposals'>

export function useProposals(filter: { customerId?: string } = {}) {
  return useQuery<ProposalRow[]>({
    queryKey: queryKeys.proposals(filter),
    queryFn: async () => {
      let q = supabase.from('proposals').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      const { data, error } = await q
      if (error) throw error
      return data as ProposalRow[]
    },
  })
}

export function useCreateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'proposals'>) => {
      const { data, error } = await supabase.from('proposals').insert(payload).select().single()
      if (error) throw error
      return data as ProposalRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.proposals() }),
  })
}

export function useUpdateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'proposals'> & { id: string }) => {
      const { data, error } = await supabase.from('proposals').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as ProposalRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.proposals() }),
  })
}
