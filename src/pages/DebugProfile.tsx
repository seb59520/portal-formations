import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { AppHeader } from '../components/AppHeader';

export function DebugProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDbProfile();
    }
  }, [user?.id]);

  const fetchDbProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from DB:', error);
      } else {
        console.log('Profile from DB:', data);
        setDbProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating role:', error);
        alert('Erreur: ' + error.message);
      } else {
        alert('Rôle mis à jour avec succès ! Rechargez la page.');
        await fetchDbProfile();
        await refreshProfile();
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Debug Profil" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Debug Profil" />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Informations de débogage</h2>

          {/* User Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User (auth.users)</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Profile from Context */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile (useAuth context)</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
            {profile && (
              <div className="mt-2">
                <p className="text-sm">
                  <strong>Rôle:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{profile.role}</code>
                </p>
                <p className="text-sm">
                  <strong>Type du rôle:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{typeof profile.role}</code>
                </p>
                <p className="text-sm">
                  <strong>Rôle === 'admin':</strong> <code className="bg-gray-200 px-2 py-1 rounded">{String(profile.role === 'admin')}</code>
                </p>
              </div>
            )}
          </div>

          {/* Profile from DB */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile (direct DB query)</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(dbProfile, null, 2)}
            </pre>
            {dbProfile && (
              <div className="mt-2">
                <p className="text-sm">
                  <strong>Rôle:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{dbProfile.role}</code>
                </p>
                <p className="text-sm">
                  <strong>Type du rôle:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{typeof dbProfile.role}</code>
                </p>
                <p className="text-sm">
                  <strong>Rôle === 'admin':</strong> <code className="bg-gray-200 px-2 py-1 rounded">{String(dbProfile.role === 'admin')}</code>
                </p>
              </div>
            )}
          </div>

          {/* Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparaison</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              {profile?.role === dbProfile?.role ? (
                <p className="text-green-700">✓ Les rôles correspondent</p>
              ) : (
                <p className="text-red-700">✗ Les rôles ne correspondent pas !</p>
              )}
              {profile?.role !== 'admin' && dbProfile?.role === 'admin' && (
                <p className="text-red-700 mt-2">
                  ⚠ Le rôle dans la DB est 'admin' mais le contexte affiche '{profile?.role}'
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={fetchDbProfile}
                className="btn-secondary"
              >
                Rafraîchir depuis la DB
              </button>
              <button
                onClick={refreshProfile}
                className="btn-secondary"
              >
                Rafraîchir le contexte
              </button>
              <button
                onClick={handleUpdateRole}
                className="btn-primary"
              >
                Forcer le rôle à 'admin' dans la DB
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Vérifiez que le rôle dans la DB est bien 'admin'</li>
              <li>Si le rôle dans la DB est différent, cliquez sur "Forcer le rôle à 'admin'"</li>
              <li>Cliquez sur "Rafraîchir le contexte" pour mettre à jour l'application</li>
              <li>Rechargez la page pour voir les changements</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

