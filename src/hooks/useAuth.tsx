import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithApple: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Timeout de sécurité pour éviter un blocage infini (réduit à 5 secondes)
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
        setProfile(null) // Forcer profile à null si timeout
        setUser(null) // Forcer user à null si timeout
        setSession(null)
      }
    }, 5000) // 5 secondes max

    // Récupérer la session initiale avec timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
    )

    Promise.race([sessionPromise, timeoutPromise])
      .then((result: any) => {
        if (!mounted) return

        const { data: { session }, error } = result

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (mounted && timeoutId) {
              clearTimeout(timeoutId)
            }
          })
        } else {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      })
      .catch((error) => {
        console.error('Error in getSession:', error)
        if (mounted) {
          setLoading(false)
          setUser(null)
          setSession(null)
          setProfile(null)
          if (timeoutId) clearTimeout(timeoutId)
        }
      })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        // Si l'utilisateur se déconnecte et qu'on n'est pas déjà sur la page de login
        if (event === 'SIGNED_OUT' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          // Utiliser replace pour éviter d'ajouter à l'historique
          window.location.replace('/login')
        }
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, retries = 1) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs si le profil n'existe pas
      // Timeout augmenté à 10 secondes pour les connexions lentes
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Utiliser maybeSingle() pour éviter les erreurs si le profil n'existe pas

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any
      const { data, error } = result || { data: null, error: null }

      if (error) {
        // Si le profil n'existe pas, ce n'est pas forcément une erreur critique
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.warn('Profile not found for user:', userId, '- This is normal for new users')
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Retry en cas d'erreur réseau (seulement 1 fois maintenant)
        if (retries > 0 && (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('timeout'))) {
          console.warn(`Retrying profile fetch (${retries} retries left):`, error.message)
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchProfile(userId, retries - 1)
        }
        
        // En cas d'erreur, on continue quand même
        console.warn('Error fetching profile, continuing without profile:', error)
        setProfile(null)
        setLoading(false)
        return
      } else if (data) {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
      } else {
        // Pas de données mais pas d'erreur (maybeSingle retourne null si pas de résultat)
        console.warn('No profile found for user:', userId)
        setProfile(null)
      }
    } catch (error: any) {
      // Gérer spécifiquement les timeouts
      if (error?.message?.includes('timeout')) {
        console.error('Profile fetch timeout after 10 seconds for user:', userId)
        console.warn('Continuing without profile - this may indicate a network issue or RLS policy problem')
      } else {
        console.error('Error fetching profile:', error)
      }
      // En cas d'erreur ou timeout, on continue quand même
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    })
    return { error }
  }

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    try {
      // Réinitialiser l'état local d'abord
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Déconnecter de Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        // Même en cas d'erreur, on continue car l'état local est déjà réinitialisé
      }
    } catch (error) {
      console.error('Error during sign out:', error)
      // En cas d'erreur, on s'assure que l'état est réinitialisé
      setUser(null)
      setProfile(null)
      setSession(null)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
