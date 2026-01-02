import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { AppHeader } from '../components/AppHeader';
import { supabase } from '../lib/supabaseClient';
import { getUserRole } from '../lib/queries/userRole';
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function DiagnosticRole() {
  const { user, profile, refreshProfile } = useAuth();
  const { role, roleLabel, roleContext, refreshRole, isAdmin } = useUserRole();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadDiagnostic() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1. Récupérer le profil depuis la DB
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erreur profil:', profileError);
      } else {
        setDbProfile(profileData);
      }

      // 2. Récupérer les membres d'organisation
      const { data: membersData, error: membersError } = await supabase
        .from('org_members')
        .select('*, orgs(name)')
        .eq('user_id', user.id);

      if (membersError) {
        console.error('Erreur org_members:', membersError);
      } else {
        setOrgMembers(membersData || []);
      }

      // 3. Récupérer le rôle via getUserRole
      const roleContext = await getUserRole(user.id);
      console.log('🔍 Diagnostic - Rôle déterminé:', roleContext);

      setLoading(false);
    }

    loadDiagnostic();
  }, [user?.id]);

  const handleFullRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await refreshRole();
      
      // Recharger les données
      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setDbProfile(profileData);

        const { data: membersData } = await supabase
          .from('org_members')
          .select('*, orgs(name)')
          .eq('user_id', user.id);
        setOrgMembers(membersData || []);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Diagnostic Rôle" showBackButton backTo="/app" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const profileRoleMatch = profile?.role === dbProfile?.role;
  const hasOrgMembers = orgMembers && orgMembers.length > 0;
  const orgRoleStudent = orgMembers.some(m => m.role === 'student');
  const shouldBeAdmin = dbProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Diagnostic Rôle" showBackButton backTo="/app" />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Bouton de rafraîchissement */}
          <div className="bg-white shadow rounded-lg p-6">
            <button
              onClick={handleFullRefresh}
              disabled={refreshing}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Rafraîchissement...' : 'Rafraîchir tout'}
            </button>
          </div>

          {/* Résumé */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rôle dans l'application :</span>
                <span className={`text-sm font-semibold ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {roleLabel} {isAdmin ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rôle dans profiles (DB) :</span>
                <span className={`text-sm font-semibold ${dbProfile?.role === 'admin' ? 'text-green-600' : 'text-gray-900'}`}>
                  {dbProfile?.role || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Source du rôle :</span>
                <span className="text-sm font-semibold text-gray-900">
                  {roleContext?.source || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Problèmes détectés */}
          {(shouldBeAdmin && !isAdmin) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    ⚠️ Problème détecté
                  </h3>
                  <p className="text-sm text-red-800 mb-4">
                    Votre rôle est défini comme <strong>admin</strong> dans la base de données, 
                    mais l'application affiche <strong>{roleLabel}</strong>.
                  </p>
                  
                  {hasOrgMembers && orgRoleStudent && (
                    <div className="mt-4 p-4 bg-red-100 rounded">
                      <p className="text-sm text-red-900 font-semibold mb-2">
                        🔍 Cause probable :
                      </p>
                      <p className="text-sm text-red-800">
                        Vous avez un rôle <strong>student</strong> dans une organisation qui masque votre rôle admin.
                        Même si <code>profiles.role = 'admin'</code> devrait avoir la priorité, il y a peut-être un problème de cache.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-red-900 font-semibold">Solutions :</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                      <li>Cliquez sur "Rafraîchir tout" ci-dessus</li>
                      <li>Rafraîchissez la page (F5 ou Cmd+R)</li>
                      <li>Déconnectez-vous et reconnectez-vous</li>
                      {hasOrgMembers && (
                        <li>Supprimez votre rôle dans org_members ou mettez-le à 'admin'</li>
                      )}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Détails Profil */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profil</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Dans le contexte React :</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {profile?.role || 'null'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Dans la base de données :</p>
                  <p className={`text-sm font-mono p-2 rounded ${
                    profileRoleMatch ? 'bg-green-50 text-green-900' : 'bg-yellow-50 text-yellow-900'
                  }`}>
                    {dbProfile?.role || 'null'}
                  </p>
                </div>
              </div>
              {!profileRoleMatch && (
                <div className="flex items-center text-yellow-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Le profil dans le contexte ne correspond pas à la base de données
                </div>
              )}
            </div>
          </div>

          {/* Détails Rôle */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rôle déterminé</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Rôle final :</p>
                <p className="text-lg font-semibold text-gray-900">{role || 'null'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Source :</p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {roleContext?.source || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Organisation ID :</p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {roleContext?.orgId || 'null'}
                </p>
              </div>
            </div>
          </div>

          {/* Membres d'organisation */}
          {hasOrgMembers && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Membres d'organisation ({orgMembers.length})
              </h2>
              <div className="space-y-3">
                {orgMembers.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {member.orgs?.name || member.org_id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Rôle : <span className="font-mono">{member.role}</span>
                        </p>
                      </div>
                      {member.role === 'student' && shouldBeAdmin && (
                        <div className="flex items-center text-yellow-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Peut masquer admin
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {orgRoleStudent && shouldBeAdmin && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Vous avez un rôle <strong>student</strong> dans une organisation. 
                    Normalement, <code>profiles.role = 'admin'</code> devrait avoir la priorité, 
                    mais vérifiez que le rafraîchissement fonctionne correctement.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Problème : Profil manquant */}
          {!dbProfile && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    ❌ Profil manquant dans la base de données
                  </h3>
                  <p className="text-sm text-red-800 mb-4">
                    Votre profil n'existe pas dans la table <code className="bg-red-100 px-1 rounded">profiles</code>. 
                    C'est la cause principale du problème.
                  </p>
                  <div className="mt-4 p-4 bg-red-100 rounded">
                    <p className="text-sm text-red-900 font-semibold mb-2">
                      🔧 Solution : Créer votre profil
                    </p>
                    <p className="text-sm text-red-800 mb-3">
                      Exécutez cette requête SQL dans Supabase SQL Editor :
                    </p>
                    <pre className="bg-red-200 p-3 rounded text-xs overflow-x-auto mb-3">
{`INSERT INTO profiles (id, role, full_name)
VALUES (
  '${user?.id}',
  'admin',
  '${profile?.full_name || user?.email?.split('@')[0] || 'Admin User'}'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';`}
                    </pre>
                    <p className="text-xs text-red-700">
                      Après avoir exécuté cette requête, cliquez sur "Rafraîchir tout" ci-dessus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions SQL */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions SQL recommandées</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  1. Vérifier votre rôle dans profiles :
                </p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`SELECT id, role, full_name 
FROM profiles 
WHERE id = '${user?.id}';`}
                </pre>
                {!dbProfile && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Si cette requête ne retourne rien, votre profil n'existe pas. Utilisez la requête ci-dessous pour le créer.
                  </p>
                )}
              </div>

              {!dbProfile && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    1.5. Créer votre profil (si manquant) :
                  </p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`INSERT INTO profiles (id, role, full_name)
VALUES (
  '${user?.id}',
  'admin',
  '${profile?.full_name || user?.email?.split('@')[0] || 'Admin User'}'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';`}
                  </pre>
                </div>
              )}

              {hasOrgMembers && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    2. Vérifier vos rôles dans org_members :
                  </p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`SELECT om.*, o.name as org_name
FROM org_members om
LEFT JOIN orgs o ON o.id = om.org_id
WHERE om.user_id = '${user?.id}';`}
                  </pre>
                </div>
              )}

              {hasOrgMembers && orgRoleStudent && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    3. Supprimer ou mettre à jour votre rôle dans org_members :
                  </p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`-- Option 1: Supprimer votre membership
DELETE FROM org_members 
WHERE user_id = '${user?.id}';

-- Option 2: Mettre à jour votre rôle en admin
UPDATE org_members 
SET role = 'admin' 
WHERE user_id = '${user?.id}';`}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  4. Forcer la mise à jour du rôle (si nécessaire) :
                </p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`UPDATE profiles 
SET role = 'admin' 
WHERE id = '${user?.id}';`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

