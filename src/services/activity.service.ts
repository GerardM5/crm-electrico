import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type ActivityLogRow = Tables<'activity_logs'>

export function useRecentActivity(limit = 10) {
  return useQuery<ActivityLogRow[]>({
    queryKey: ['activity', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as ActivityLogRow[]
    },
  })
}

export function useCustomerActivity(customerId: string) {
  return useQuery<ActivityLogRow[]>({
    queryKey: ['activity', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'customer')
        .eq('entity_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as ActivityLogRow[]
    },
    enabled: !!customerId,
  })
}

// Alias for routes that import useActivityLogs
export const useActivityLogs = useCustomerActivity

export function useLogActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ entityType, entityId, action, metadata = {} }: {
      entityType: string
      entityId: string
      action: string
      metadata?: Record<string, unknown>
    }) => {
      const { error } = await supabase.from('activity_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        metadata,
      } as never)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity'] }),
  })
}
