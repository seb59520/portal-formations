import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { Profile } from '../types/database'
import { withRetry, withTimeout, isAuthError } from '../lib/supabaseHelpers'

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
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

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

    // Récupérer la session initiale avec retry et timeout
    withRetry(
      () => withTimeout(
        supabase.auth.getSession(),
        5000,
        'Session fetch timeout'
      ),
      { maxRetries: 2, initialDelay: 1000 }
    )
      .then((result: any) => {
        if (!mounted) return

        const { data: { session }, error } = result

        if (error) {
          console.error('Error getting session:', error)
          // Si erreur d'auth, nettoyer la session
          if (isAuthError(error)) {
            supabase.auth.signOut().catch(() => {})
            setSession(null)
            setUser(null)
            setProfile(null)
          }
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
          // Si timeout ou erreur réseau, on continue sans session
          if (error.message?.includes('timeout') || error.message?.includes('network')) {
            console.warn('Continuing without session due to network issue')
          } else {
            setUser(null)
            setSession(null)
            setProfile(null)
          }
          if (timeoutId) clearTimeout(timeoutId)
        }
      })

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.id)

      // Gérer le refresh token
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        if (session?.user) {
          // Rafraîchir le profil après refresh token
          await fetchProfile(session.user.id)
        }
        return
      }

      // Gérer les erreurs de token
      if (event === 'SIGNED_OUT' && session === null && user) {
        console.warn('Session expired or invalid, signing out')
        setUser(null)
        setProfile(null)
        setSession(null)
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.replace('/login')
        }
        return
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
        
        // Démarrer un intervalle pour vérifier et rafraîchir le token si nécessaire
        if (!refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(async () => {
            if (!mounted || isRefreshingRef.current) return
            
            try {
              const { data: { session: currentSession } } = await supabase.auth.getSession()
              if (currentSession) {
                // Vérifier si le token expire bientôt (dans les 5 prochaines minutes)
                const expiresAt = currentSession.expires_at
                if (expiresAt) {
                  const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
                  if (expiresIn < 300 && expiresIn > 0) {
                    // Rafraîchir le token
                    isRefreshingRef.current = true
                    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
                    if (error) {
                      console.error('Error refreshing session:', error)
                      if (isAuthError(error)) {
                        // Session invalide, déconnecter
                        await supabase.auth.signOut()
                      }
                    } else if (refreshedSession) {
                      console.log('Session refreshed proactively')
                      setSession(refreshedSession)
                    }
                    isRefreshingRef.current = false
                  }
                }
              }
            } catch (error) {
              console.error('Error checking session:', error)
              isRefreshingRef.current = false
            }
          }, 60000) // Vérifier toutes les minutes
        }
      } else {
        setProfile(null)
        setLoading(false)
        // Arrêter l'intervalle de refresh
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
          refreshIntervalRef.current = null
        }
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
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // Utiliser retry et timeout
      const result = await withRetry(
        () => withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          8000,
          'Profile fetch timeout'
        ),
        { maxRetries: 2, initialDelay: 1000 }
      )
      
      const { data, error } = result || { data: null, error: null }

      if (error) {
        // Si le profil n'existe pas, ce n'est pas forcément une erreur critique
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.warn('Profile not found for user:', userId, '- This is normal for new users')
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Si erreur d'auth, déconnecter
        if (isAuthError(error)) {
          console.error('Auth error fetching profile, signing out')
          await supabase.auth.signOut()
          setProfile(null)
          setUser(null)
          setSession(null)
          setLoading(false)
          return
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
        console.error('Profile fetch timeout for user:', userId)
        console.warn('Continuing without profile - this may indicate a network issue')
      } else if (isAuthError(error)) {
        console.error('Auth error, signing out')
        await supabase.auth.signOut()
        setProfile(null)
        setUser(null)
        setSession(null)
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
