import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/database'

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
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si authentification requise mais utilisateur non connecté
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si pas d'authentification requise mais utilisateur connecté, rediriger vers app
  if (!requireAuth && user) {
    return <Navigate to="/app" replace />
  }

  // Vérifier le rôle si spécifié
  if (requiredRole && profile && profile.role !== requiredRole && profile.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
