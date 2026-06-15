import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type OrganizationRow = Tables<'organizations'>

export function useOrganization() {
  return useQuery<OrganizationRow | null>({
    queryKey: queryKeys.organization,
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').limit(1).maybeSingle()
      if (error) throw error
      return data as OrganizationRow | null
    },
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'organizations'> & { id: string }) => {
      const { data, error } = await supabase.from('organizations').update(payload as never).eq('id', id).select().single()
      if (error) throw error
      return data as OrganizationRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.organization }),
  })
}
