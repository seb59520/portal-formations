import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification plus détaillée des variables d'environnement
if (!supabaseUrl) {
  const error = 'Missing VITE_SUPABASE_URL environment variable. Please set it in your .env file or deployment platform.'
  console.error(error)
  throw new Error(error)
}

if (!supabaseAnonKey) {
  const error = 'Missing VITE_SUPABASE_ANON_KEY environment variable. Please set it in your .env file or deployment platform.'
  console.error(error)
  throw new Error(error)
}

// Vérifier que les valeurs ne sont pas des placeholders
if (supabaseAnonKey === 'your-anon-key-here' || supabaseAnonKey.includes('your-')) {
  const error = 'VITE_SUPABASE_ANON_KEY appears to be a placeholder. Please set the actual Supabase anon key.'
  console.error(error)
  throw new Error(error)
}

console.log('Supabase client initialized with URL:', supabaseUrl)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
    // Améliorer la gestion du refresh token
    debug: import.meta.env.DEV,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
    // Timeout pour les requêtes
    fetch: (url, options = {}) => {
      // Ajouter un timeout par défaut de 30 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Écouter les erreurs de refresh token
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  } else if (event === 'USER_UPDATED') {
    console.log('User updated')
  }
})

// Types helper
export type SupabaseClient = typeof supabase
