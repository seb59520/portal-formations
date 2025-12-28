import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course } from '../../types/database'
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'

export function AdminCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Erreur lors du chargement des formations.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const handleDuplicateCourse = async (course: Course) => {
    try {
      const newCourse = {
        ...course,
        id: undefined,
        title: `${course.title} (Copie)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse)
        .select()
        .single()

      if (error) throw error

      setCourses([data, ...courses])
    } catch (error) {
      console.error('Error duplicating course:', error)
      setError('Erreur lors de la duplication.')
    }
  }

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
                to="/app"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Administration des formations</h1>
            </div>
            <Link
              to="/admin/courses/new"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle formation</span>
            </Link>
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

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                Aucune formation créée pour le moment.
              </p>
              <Link to="/admin/courses/new" className="btn-primary">
                Créer la première formation
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {courses.map((course) => (
                  <li key={course.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {course.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.access_type === 'free'
                              ? 'bg-blue-100 text-blue-800'
                              : course.access_type === 'paid'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.access_type === 'free' ? 'Gratuit' :
                             course.access_type === 'paid' ? 'Payant' : 'Sur invitation'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Créé le {new Date(course.created_at).toLocaleDateString('fr-FR')}</span>
                          {course.price_cents && (
                            <span className="ml-4">
                              Prix: {(course.price_cents / 100).toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/courses/${course.id}`}
                          className="btn-secondary text-sm inline-flex items-center space-x-1"
                          title="Voir la formation"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Voir</span>
                        </Link>

                        <Link
                          to={`/admin/courses/${course.id}`}
                          className="btn-primary text-sm inline-flex items-center space-x-1"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Modifier</span>
                        </Link>

                        <button
                          onClick={() => handleDuplicateCourse(course)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          title="Dupliquer"
                        >
                          📋
                        </button>

                        <button
                          onClick={() => handleDeleteCourse(course.id)}
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
      </main>
    </div>
  )
}
