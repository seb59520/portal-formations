import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Program } from '../../types/database'
import { Plus, Edit, Trash2, Users, Layers } from 'lucide-react'

export function AdminProgramsContent() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Erreur lors du chargement des programmes.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) return

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId)

      if (error) throw error

      setPrograms(programs.filter(p => p.id !== programId))
    } catch (error) {
      console.error('Error deleting program:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const handleDuplicateProgram = async (program: Program) => {
    try {
      const newProgram = {
        ...program,
        id: undefined,
        title: `${program.title} (Copie)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined
      }

      const { data, error } = await supabase
        .from('programs')
        .insert(newProgram)
        .select()
        .single()

      if (error) throw error

      setPrograms([data, ...programs])
    } catch (error) {
      console.error('Error duplicating program:', error)
      setError('Erreur lors de la duplication.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Programmes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos programmes de formation</p>
        </div>
        <Link
          to="/admin/programs/new"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau programme
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            Aucun programme créé pour le moment.
          </p>
          <Link to="/admin/programs/new" className="btn-primary">
            Créer le premier programme
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {programs.map((program) => (
              <li key={program.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 break-words">
                        {program.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {program.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.access_type === 'free'
                          ? 'bg-blue-100 text-blue-800'
                          : program.access_type === 'paid'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {program.access_type === 'free' ? 'Gratuit' :
                         program.access_type === 'paid' ? 'Payant' : 'Sur invitation'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>Créé le {new Date(program.created_at).toLocaleDateString('fr-FR')}</span>
                      {program.price_cents && (
                        <span className="ml-4">
                          Prix: {(program.price_cents / 100).toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/programs/${program.id}/enrollments`}
                      className="btn-secondary text-sm inline-flex items-center space-x-1"
                      title="Gérer les accès"
                    >
                      <Users className="w-4 h-4" />
                      <span>Accès</span>
                    </Link>

                    <Link
                      to={`/admin/programs/${program.id}`}
                      className="btn-primary text-sm inline-flex items-center space-x-1"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifier</span>
                    </Link>

                    <button
                      onClick={() => handleDuplicateProgram(program)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Dupliquer"
                    >
                      📋
                    </button>

                    <button
                      onClick={() => handleDeleteProgram(program.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

