import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type TaskRow = Tables<'tasks'>

export function useTasks(filter: { customerId?: string; assignedTo?: string; status?: string } = {}) {
  return useQuery<TaskRow[]>({
    queryKey: queryKeys.tasks(filter),
    queryFn: async () => {
      let q = supabase.from('tasks').select('*').order('due_at')
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      if (filter.assignedTo) q = q.eq('assigned_to', filter.assignedTo)
      if (filter.status) q = q.eq('status', filter.status)
      const { data, error } = await q
      if (error) throw error
      return data as TaskRow[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'tasks'>) => {
      const { data, error } = await supabase.from('tasks').insert(payload as never).select().single()
      if (error) throw error
      return data as TaskRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks() }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDto<'tasks'> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(payload as never).eq('id', id).select().single()
      if (error) throw error
      return data as TaskRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks() }),
  })
}
