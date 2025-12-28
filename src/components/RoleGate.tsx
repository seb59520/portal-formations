import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/database'

interface RoleGateProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { profile } = useAuth()

  if (!profile) return fallback

  // Admin a accès à tout
  if (profile.role === 'admin') return <>{children}</>

  // Vérifier si le rôle de l'utilisateur est autorisé
  if (allowedRoles.includes(profile.role)) return <>{children}</>

  return <>{fallback}</>
}
