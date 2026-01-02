import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getTrainerContext } from '../../lib/queries/trainerQueries';

interface TrainerRouteGuardProps {
  children: React.ReactNode;
}

export function TrainerRouteGuard({ children }: TrainerRouteGuardProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthorization() {
      if (authLoading) {
        return;
      }

      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { org, role, error } = await getTrainerContext();

        // Vérifier aussi le profil directement si getTrainerContext échoue
        if (error || !role) {
          // Fallback: vérifier le profil directement
          if (profile && (profile.role === 'admin' || profile.role === 'instructor')) {
            console.log('Authorization granted via profile role:', profile.role);
            setIsAuthorized(true);
            setLoading(false);
            return;
          }

          console.error('Authorization error:', error);
          console.log('Profile:', profile);
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        console.log('Authorization granted via org_members, role:', role);

        if (role !== 'admin' && role !== 'trainer') {
          // Fallback: vérifier le profil directement
          if (profile && (profile.role === 'admin' || profile.role === 'instructor')) {
            console.log('Authorization granted via profile role (fallback):', profile.role);
            setIsAuthorized(true);
            setLoading(false);
            return;
          }
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        // Fallback: vérifier le profil directement
        if (profile && (profile.role === 'admin' || profile.role === 'instructor')) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuthorization();
  }, [user, profile, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Vérification des permissions...</p>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Accès refusé</h2>
          <p className="mt-2 text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

