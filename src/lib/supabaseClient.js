import { createClient } from '@supabase/supabase-js'

let cachedClient = null

function readFromImportMeta(key) {
  if (typeof import.meta !== 'undefined' && import.meta?.env && key in import.meta.env) {
    return import.meta.env[key]
  }
  return undefined
}

function readFromProcessEnv(key) {
  if (typeof process !== 'undefined' && process?.env && key in process.env) {
    return process.env[key]
  }
  return undefined
}

function readSupabaseConfig() {
  const supabaseUrl =
    readFromImportMeta('VITE_SUPABASE_URL') ??
    readFromProcessEnv('VITE_SUPABASE_URL') ??
    readFromProcessEnv('SUPABASE_URL')

  const supabaseAnonKey =
    readFromImportMeta('VITE_SUPABASE_ANON_KEY') ??
    readFromProcessEnv('VITE_SUPABASE_ANON_KEY') ??
    readFromProcessEnv('SUPABASE_ANON_KEY')

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
