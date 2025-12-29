import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { UserRole } from '../types/database'
import { WifiOff, Wifi } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const { isOnline, wasOffline } = useNetworkStatus()
  const location = useLocation()

  // Timeout de sécurité pour éviter un blocage infini
  const [forceRender, setForceRender] = useState(false)
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Loading timeout, forcing render')
        setForceRender(true)
      }
    }, 3000) // 3 secondes max

    return () => clearTimeout(timeout)
  }, [loading])

  // Éviter les boucles : ne pas rediriger si on est déjà sur la bonne page
  const isOnLoginPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password'
  const isOnAppPage = location.pathname === '/app'

  // Afficher un message si hors ligne
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion perdue</h2>
          <p className="text-gray-600 mb-4">Vérifiez votre connexion Internet et réessayez.</p>
        </div>
      </div>
    )
  }

  if (loading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          {wasOffline && (
            <p className="text-sm text-gray-600">Reconnexion en cours...</p>
          )}
        </div>
      </div>
    )
  }

  // Si authentification requise mais utilisateur non connecté
  if (requireAuth && !user) {
    // Ne pas rediriger si on est déjà sur une page publique
    if (!isOnLoginPage) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
    // Si on est déjà sur login, laisser passer (pour éviter les boucles)
    return <>{children}</>
  }

  // Si pas d'authentification requise mais utilisateur connecté, rediriger vers app
  if (!requireAuth && user) {
    // Ne pas rediriger si on est déjà sur /app ou sur une page admin
    if (!isOnAppPage && !location.pathname.startsWith('/admin')) {
      return <Navigate to="/app" replace />
    }
    // Si on est déjà sur /app ou admin, laisser passer
    return <>{children}</>
  }

  // Vérifier le rôle si spécifié (seulement si le profil est chargé)
  if (requiredRole && profile) {
    if (profile.role !== requiredRole && profile.role !== 'admin') {
      // Rediriger vers /app seulement si on n'y est pas déjà
      if (!isOnAppPage) {
        return <Navigate to="/app" replace />
      }
    }
  }

  return <>{children}</>
}
