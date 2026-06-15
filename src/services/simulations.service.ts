import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables } from '../types/database.types'
import { queryKeys } from './query-keys'

export type SimulationRow = Tables<'saving_simulations'>
export type EnergyProfileRow = Tables<'customer_energy_profiles'>

export function useSimulations(filter: { customerId?: string } = {}) {
  return useQuery<SimulationRow[]>({
    queryKey: queryKeys.simulations(filter),
    queryFn: async () => {
      let q = supabase.from('saving_simulations').select('*').order('created_at', { ascending: false })
      if (filter.customerId) q = q.eq('customer_id', filter.customerId)
      const { data, error } = await q
      if (error) throw error
      return data as SimulationRow[]
    },
  })
}

export function useCreateSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InsertDto<'saving_simulations'>) => {
      const { data, error } = await supabase.from('saving_simulations').insert(payload as never).select().single()
      if (error) throw error
      return data as SimulationRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.simulations() }),
  })
}

export function useEnergyProfiles(customerId?: string) {
  return useQuery<EnergyProfileRow[]>({
    queryKey: queryKeys.customerEnergyProfile(customerId ?? ''),
    queryFn: async () => {
      let q = supabase.from('customer_energy_profiles').select('*').order('created_at', { ascending: false })
      if (customerId) q = q.eq('customer_id', customerId)
      const { data, error } = await q
      if (error) throw error
      return data as EnergyProfileRow[]
    },
    enabled: customerId !== undefined ? !!customerId : true,
  })
}

export function useEnergyProfile(id: string) {
  return useQuery<EnergyProfileRow>({
    queryKey: [...queryKeys.customerEnergyProfile(id), 'single'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customer_energy_profiles').select('*').eq('id', id).single()
      if (error) throw error
      return data as EnergyProfileRow
    },
    enabled: !!id,
  })
}
