import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type InstallationRow = Tables<'installations'>

export function useInstallations(filter: { customerId?: string } = {}) {
  return useQuery<InstallationRow[]>({
    queryKey: queryKeys.installations(filter),
    queryFn: async () => {
      let q = supabase.from('installations').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      const { data, error } = await q
      if (error) throw error
      return data as InstallationRow[]
    },
  })
}

export function useCreateInstallation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'installations'>) => {
      const { data, error } = await supabase.from('installations').insert(payload as never).select().single()
      if (error) throw error
      return data as InstallationRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.installations() }),
  })
}

export function useUpdateInstallation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'installations'> & { id: string }) => {
      const { data, error } = await supabase.from('installations').update(payload as never).eq('id', id).select().single()
      if (error) throw error
      return data as InstallationRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.installations() }),
  })
}
