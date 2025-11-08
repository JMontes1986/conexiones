import { createClient } from '@supabase/supabase-js'

let cachedClient = null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function readSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return {
    supabaseUrl,
    supabaseAnonKey
  }
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = readSupabaseConfig()
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient
  }

  const { supabaseUrl, supabaseAnonKey } = readSupabaseConfig()

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey)
  return cachedClient
}
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
