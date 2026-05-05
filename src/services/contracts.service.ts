import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables } from '../types/database.types'
import { queryKeys } from './query-keys'

export type ContractRow = Tables<'contracts'>

export function useContracts(filter: { customerId?: string } = {}) {
  return useQuery<ContractRow[]>({
    queryKey: queryKeys.contracts(filter),
    queryFn: async () => {
      let q = supabase.from('contracts').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      const { data, error } = await q
      if (error) throw error
      return data as ContractRow[]
    },
  })
}

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'contracts'>) => {
      const { data, error } = await supabase.from('contracts').insert(payload).select().single()
      if (error) throw error
      return data as ContractRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contracts() }),
  })
}
