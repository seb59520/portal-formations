import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { AppHeader } from '../components/AppHeader';
import { supabase } from '../lib/supabaseClient';
import { getUserOrg } from '../lib/queries/userQueries';
import type { Org } from '../types/database';
import { User, Save, X, Building2, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Profile() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { roleLabel, refreshRole } = useUserRole();
  const [fullName, setFullName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [org, setOrg] = useState<Org | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.email) {
      setFullName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  useEffect(() => {
    async function loadOrg() {
      if (!user?.id) {
        setLoadingOrg(false);
        return;
      }

      setLoadingOrg(true);
      const { org: userOrg, error: orgError } = await getUserOrg(user.id);
      
      if (orgError) {
        console.error('Error loading org:', orgError);
      } else {
        setOrg(userOrg);
      }
      
      setLoadingOrg(false);
    }

    loadOrg();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    if (!fullName.trim()) {
      setError('Le nom ne peut pas être vide');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Rafraîchir le profil dans le contexte auth
      await refreshProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || user?.email?.split('@')[0] || '');
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshProfile();
      await refreshRole();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error refreshing profile:', err);
      setError('Erreur lors du rafraîchissement du profil');
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email || 'Utilisateur';
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);


  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Mon profil" showBackButton backTo="/app" />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            {/* Header avec avatar */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white">
                {userInitials}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-sm text-gray-500 mt-1">{roleLabel}</p>
              </div>
            </div>

            {/* Messages d'erreur/succès */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">Profil mis à jour avec succès !</p>
              </div>
            )}

            {/* Informations du profil */}
            <div className="space-y-6">
              {/* Email (non modifiable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {user?.email}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  L'email ne peut pas être modifié
                </p>
              </div>

              {/* Nom complet (modifiable) */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Votre nom complet"
                      disabled={isSaving}
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !fullName.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900">
                      {fullName || 'Non défini'}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Modifier le nom
                    </button>
                  </div>
                )}
              </div>

              {/* Rôle (non modifiable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <div className="space-y-3">
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {roleLabel}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rafraîchir le rôle après un changement manuel dans Supabase"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Rafraîchissement...' : 'Rafraîchir le rôle'}
                    </button>
                    <Link
                      to="/diagnostic-role"
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Diagnostic
                    </Link>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Le rôle ne peut pas être modifié depuis cette page. Utilisez le bouton "Rafraîchir le rôle" si vous avez modifié votre rôle manuellement dans Supabase. 
                  Si le problème persiste, utilisez "Diagnostic" pour identifier la cause.
                </p>
              </div>

              {/* Organisation de rattachement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organisation de rattachement
                </label>
                {loadingOrg ? (
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400">
                    Chargement...
                  </div>
                ) : org ? (
                  <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900 font-medium">{org.name}</span>
                  </div>
                ) : (
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Aucune organisation
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {org 
                    ? 'Vous êtes membre de cette organisation'
                    : 'Vous n\'êtes membre d\'aucune organisation. Contactez un administrateur pour être ajouté à une organisation.'}
                </p>
              </div>

              {/* Date de création */}
              {profile?.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membre depuis
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

