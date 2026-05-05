import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables } from '../types/database.types'
import { queryKeys } from './query-keys'

export type InvoiceRow = Tables<'invoices'>

export function useInvoices(filter: { customerId?: string } = {}) {
  return useQuery<InvoiceRow[]>({
    queryKey: queryKeys.invoices(filter),
    queryFn: async () => {
      let q = supabase.from('invoices').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      const { data, error } = await q
      if (error) throw error
      return data as InvoiceRow[]
    },
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'invoices'>) => {
      const { data, error } = await supabase.from('invoices').insert(payload).select().single()
      if (error) throw error
      return data as InvoiceRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.invoices() }),
  })
}
