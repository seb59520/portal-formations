import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Profile, Enrollment, Course } from '../../types/database'
import { Users, Search, Plus, X } from 'lucide-react'

interface EnrollmentWithProfile extends Enrollment {
  profiles: Profile
}

export function AdminCourseEnrollments() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentWithProfile[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [modalSearchTerm, setModalSearchTerm] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchEnrollments()
      fetchAllUsers()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement de la formation.')
    }
  }

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles (*)
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false })

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setError('Erreur lors du chargement des inscriptions.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      setAllUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      // Ne pas bloquer si on ne peut pas charger tous les utilisateurs
    }
  }

  const handleAddEnrollments = async () => {
    if (selectedUserIds.length === 0) {
      setError('Veuillez sélectionner au moins une personne.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Vérifier les inscriptions existantes
      const { data: existing } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', courseId)
        .in('user_id', selectedUserIds)

      const existingUserIds = existing?.map(e => e.user_id) || []
      const newUserIds = selectedUserIds.filter(id => !existingUserIds.includes(id))

      if (newUserIds.length === 0) {
        setError('Toutes les personnes sélectionnées sont déjà inscrites.')
        setSaving(false)
        return
      }

      // Créer les nouvelles inscriptions
      const enrollmentsToCreate = newUserIds.map(userId => ({
        user_id: userId,
        course_id: courseId,
        status: 'active' as const,
        source: 'manual' as const
      }))

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollmentsToCreate)

      if (insertError) throw insertError

      // Recharger les inscriptions
      await fetchEnrollments()
      setShowAddModal(false)
      setSelectedUserIds([])
      setModalSearchTerm('')
    } catch (error) {
      console.error('Error adding enrollments:', error)
      setError(`Erreur lors de l'ajout: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (enrollmentId: string, newStatus: 'active' | 'pending' | 'revoked') => {
    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status: newStatus })
        .eq('id', enrollmentId)

      if (error) throw error

      await fetchEnrollments()
    } catch (error) {
      console.error('Error updating enrollment:', error)
      setError(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette personne de la formation ?')) return

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error

      await fetchEnrollments()
    } catch (error) {
      console.error('Error removing enrollment:', error)
      setError(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  // Filtrer les utilisateurs disponibles (non inscrits)
  const enrolledUserIds = enrollments.map(e => e.user_id)
  const availableUsers = allUsers.filter(user => !enrolledUserIds.includes(user.id))

  // Filtrer selon la recherche (modal)
  const filteredAvailableUsers = availableUsers.filter(user =>
    user.full_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(modalSearchTerm.toLowerCase())
  )

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.profiles?.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des inscriptions
                </h1>
                {course && (
                  <p className="text-sm text-gray-600 mt-1">
                    {course.title}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter des personnes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une personne..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Liste des inscriptions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Personnes inscrites ({filteredEnrollments.length})
              </h2>
            </div>

            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  {searchTerm ? 'Aucune personne ne correspond à votre recherche.' : 'Aucune personne inscrite pour le moment.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {enrollment.profiles?.full_name || 'Utilisateur sans nom'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enrollment.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : enrollment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {enrollment.status === 'active' ? 'Actif' :
                             enrollment.status === 'pending' ? 'En attente' : 'Révoqué'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          Rôle: {enrollment.profiles?.role || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Changer le statut */}
                        <select
                          value={enrollment.status}
                          onChange={(e) => handleUpdateStatus(enrollment.id, e.target.value as 'active' | 'pending' | 'revoked')}
                          disabled={saving}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="active">Actif</option>
                          <option value="pending">En attente</option>
                          <option value="revoked">Révoqué</option>
                        </select>

                        <button
                          onClick={() => handleRemoveEnrollment(enrollment.id)}
                          disabled={saving}
                          className="text-red-400 hover:text-red-600 p-1 rounded disabled:opacity-50"
                          title="Retirer de la formation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Ajouter des personnes à la formation
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedUserIds([])
                  setModalSearchTerm('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder="Rechercher une personne..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded-md">
              {filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {modalSearchTerm ? 'Aucune personne ne correspond à votre recherche.' : 'Toutes les personnes sont déjà inscrites.'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredAvailableUsers.map((user) => (
                    <li key={user.id} className="px-4 py-3 hover:bg-gray-50">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id])
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Utilisateur sans nom'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Rôle: {user.role} • ID: {user.id.substring(0, 8)}...
                          </p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedUserIds([])
                  setModalSearchTerm('')
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleAddEnrollments}
                disabled={saving || selectedUserIds.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Ajout en cours...' : `Ajouter ${selectedUserIds.length} personne(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

