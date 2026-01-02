import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Profile, UserRole } from '../../types/database'
import { Plus, Edit, Trash2, UserPlus, Search, X } from 'lucide-react'

interface CreateUserForm {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export function AdminUsers() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      // Étape 1: Créer l'utilisateur via signUp
      // Note: Cela nécessite que l'email confirmation soit désactivée dans Supabase
      // ou que vous utilisiez une Edge Function avec l'API Admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          email_redirect_to: undefined,
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erreur lors de la création de l\'utilisateur')
      }

      // Étape 2: Mettre à jour le profil avec le rôle spécifié
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: formData.role,
          full_name: formData.fullName,
        })
        .eq('id', authData.user.id)

      if (profileError) {
        // Si la mise à jour échoue, essayer d'utiliser la fonction RPC
        const { error: rpcError } = await supabase.rpc('create_profile_with_role', {
          user_id: authData.user.id,
          user_role: formData.role,
          user_full_name: formData.fullName,
        })

        if (rpcError) {
          console.error('RPC Error:', rpcError)
          // Essayer une insertion directe
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              role: formData.role,
              full_name: formData.fullName,
            })

          if (insertError) {
            throw insertError
          }
        }
      }

      setSuccess(`Utilisateur ${formData.email} créé avec succès avec le rôle ${formData.role}`)
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'student',
      })
      setShowCreateForm(false)
      await fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      setError(error.message || 'Erreur lors de la création de l\'utilisateur.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Êtes-vous sûr de vouloir changer le rôle en ${newRole} ?`)) return

    try {
      // Essayer d'abord avec la fonction RPC
      const { error: rpcError } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      })

      if (rpcError) {
        // Fallback: mise à jour directe
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId)

        if (error) throw error
      }

      setSuccess('Rôle mis à jour avec succès')
      await fetchUsers()
    } catch (error: any) {
      console.error('Error updating role:', error)
      setError(error.message || 'Erreur lors de la mise à jour du rôle.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return

    try {
      // Note: La suppression de l'utilisateur dans auth.users se fait via l'API Admin
      // Ici, on supprime seulement le profil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setSuccess('Profil supprimé avec succès')
      await fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Erreur lors de la suppression.')
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'instructor':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Utilisateurs</h2>
              <p className="text-sm text-gray-500 mt-0.5">Gérez les utilisateurs et leurs rôles</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Créer un utilisateur
            </button>
          </div>

          {/* Messages de succès/erreur */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              {success}
              <button
                onClick={() => setSuccess('')}
                className="float-right text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
              <button
                onClick={() => setError('')}
                className="float-right text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Formulaire de création */}
          {showCreateForm && (
            <div className="mb-6 p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Créer un nouvel utilisateur</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field w-full"
                      placeholder="exemple@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-field w-full"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input-field w-full"
                      placeholder="Nom complet"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="input-field w-full"
                    >
                      <option value="student">Étudiant</option>
                      <option value="instructor">Formateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary disabled:opacity-50"
                  >
                    {creating ? 'Création...' : 'Créer l\'utilisateur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormData({ email: '', password: '', fullName: '', role: 'student' })
                    }}
                    className="btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Sans nom'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono text-xs">
                          {user.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                          className={`text-xs font-semibold px-2 py-1 rounded ${getRoleBadgeColor(user.role)} border-0 cursor-pointer`}
                        >
                          <option value="student">Étudiant</option>
                          <option value="instructor">Formateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Total: {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

