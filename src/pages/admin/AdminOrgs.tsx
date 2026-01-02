import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Org, OrgMember, Profile } from '../../types/database'
import { Plus, Edit, Trash2, Users, Search, X, Building2, UserPlus, UserMinus } from 'lucide-react'

interface OrgWithMembers extends Org {
  member_count: number
}

interface CreateOrgForm {
  name: string
  slug: string
}

export function AdminOrgs() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<OrgWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null)
  const [orgMembers, setOrgMembers] = useState<Array<OrgMember & { profile: Profile }>>([])
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [formData, setFormData] = useState<CreateOrgForm>({
    name: '',
    slug: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchOrgs()
    }
  }, [profile])

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orgs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Compter les membres pour chaque org
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          const { count, error: countError } = await supabase
            .from('org_members')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id)

          if (countError) {
            console.error('Error counting members:', countError)
          }

          return {
            ...org,
            member_count: count || 0,
          }
        })
      )

      setOrgs(orgsWithCounts)
    } catch (error: any) {
      console.error('Error fetching orgs:', error)
      setError('Erreur lors du chargement des organisations.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrgMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          profile:profiles!user_id(*)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformer les données pour avoir un format cohérent
      const members = (data || []).map((member: any) => ({
        ...member,
        profile: member.profile || null,
      }))

      setOrgMembers(members)
    } catch (error: any) {
      console.error('Error fetching org members:', error)
      setError('Erreur lors du chargement des membres.')
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      // Générer un slug à partir du nom si non fourni
      const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const { data, error } = await supabase
        .from('orgs')
        .insert({
          name: formData.name,
          slug: slug,
        })
        .select()
        .single()

      if (error) throw error

      setSuccess('Organisation créée avec succès !')
      setFormData({ name: '', slug: '' })
      setShowCreateForm(false)
      fetchOrgs()
    } catch (error: any) {
      console.error('Error creating org:', error)
      setError(error.message || 'Erreur lors de la création de l\'organisation.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette organisation ? Tous les membres et sessions associés seront également supprimés.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('orgs')
        .delete()
        .eq('id', orgId)

      if (error) throw error

      setSuccess('Organisation supprimée avec succès !')
      fetchOrgs()
    } catch (error: any) {
      console.error('Error deleting org:', error)
      setError(error.message || 'Erreur lors de la suppression de l\'organisation.')
    }
  }

  const handleViewMembers = async (org: Org) => {
    setSelectedOrg(org)
    setShowMembersModal(true)
    await fetchOrgMembers(org.id)
  }

  const handleAddMember = async (userId: string, role: OrgMember['role']) => {
    if (!selectedOrg) return

    try {
      const { error } = await supabase
        .from('org_members')
        .insert({
          org_id: selectedOrg.id,
          user_id: userId,
          role: role,
        })

      if (error) throw error

      setSuccess('Membre ajouté avec succès !')
      await fetchOrgMembers(selectedOrg.id)
      fetchOrgs()
    } catch (error: any) {
      console.error('Error adding member:', error)
      setError(error.message || 'Erreur lors de l\'ajout du membre.')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'organisation ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setSuccess('Membre retiré avec succès !')
      if (selectedOrg) {
        await fetchOrgMembers(selectedOrg.id)
        fetchOrgs()
      }
    } catch (error: any) {
      console.error('Error removing member:', error)
      setError(error.message || 'Erreur lors du retrait du membre.')
    }
  }

  const filteredOrgs = orgs.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - masqué dans AdminUnified */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez les organisations et leurs membres</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle organisation
            </button>
          </div>
        </div>
      </header>
      
      {/* Header simplifié pour AdminUnified */}
      <div className="admin-unified-header max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Organisations</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les organisations et leurs membres</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle organisation
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Orgs list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créée le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{org.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {org.member_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewMembers(org)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Users className="w-4 h-4" />
                        Membres
                      </button>
                      <button
                        onClick={() => handleDeleteOrg(org.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrgs.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune organisation</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Aucune organisation ne correspond à votre recherche.' : 'Commencez par créer une nouvelle organisation.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Org Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nouvelle organisation</h2>
            <form onSubmit={handleCreateOrg}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Généré automatiquement si vide"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Identifiant unique (minuscules, tirets uniquement)</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ name: '', slug: '' })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedOrg && (
        <OrgMembersModal
          org={selectedOrg}
          members={orgMembers}
          onClose={() => {
            setShowMembersModal(false)
            setSelectedOrg(null)
            setOrgMembers([])
          }}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  )
}

interface OrgMembersModalProps {
  org: Org
  members: Array<OrgMember & { profile: Profile | null }>
  onClose: () => void
  onAddMember: (userId: string, role: OrgMember['role']) => void
  onRemoveMember: (memberId: string) => void
}

function OrgMembersModal({ org, members, onClose, onAddMember, onRemoveMember }: OrgMembersModalProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<OrgMember['role']>('student')
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (showAddForm) {
      fetchAvailableUsers()
    }
  }, [showAddForm])

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      // Récupérer tous les utilisateurs qui ne sont pas déjà membres
      const memberUserIds = members.map(m => m.user_id)
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (allUsersError) throw allUsersError

      // Filtrer manuellement les utilisateurs qui ne sont pas déjà membres
      const availableUsers = memberUserIds.length > 0
        ? (allUsers || []).filter(user => !memberUserIds.includes(user.id))
        : (allUsers || [])

      setUsers(availableUsers)
    } catch (error: any) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    onAddMember(selectedUserId, selectedRole)
    setShowAddForm(false)
    setSelectedUserId('')
    setSelectedRole('student')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Membres de {org.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un membre
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Ajouter un membre</h3>
            <form onSubmit={handleSubmitAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={loadingUsers}
                >
                  <option value="">Sélectionner un utilisateur...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as OrgMember['role'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="student">Étudiant</option>
                  <option value="trainer">Formateur</option>
                  <option value="admin">Administrateur</option>
                  <option value="auditor">Auditeur</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedUserId('')
                    setSelectedRole('student')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ajouté le
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.profile?.full_name || member.user_id}
                  </div>
                  {member.profile?.email && (
                    <div className="text-sm text-gray-500">{member.profile.email}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun membre</h3>
            <p className="mt-1 text-sm text-gray-500">Ajoutez des membres à cette organisation.</p>
          </div>
        )}
      </div>
    </div>
  )
}

