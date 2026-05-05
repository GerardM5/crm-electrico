import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son obligatorios.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'crm-auth-session',
  },
})

/** Fetch the authenticated user's profile from the profiles table */
export async function fetchProfileById(userId: string): Promise<Tables<'profiles'> | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data as Tables<'profiles'>
}
