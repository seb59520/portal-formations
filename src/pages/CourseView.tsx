import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Module, Item } from '../types/database'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, profile } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setError('')

      // Vérifier l'accès à la formation
      const { data: accessCheck, error: accessError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user?.id)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single()

      // Si pas d'inscription active et pas admin
      if (accessError && profile?.role !== 'admin') {
        setError('Vous n\'avez pas accès à cette formation.')
        setLoading(false)
        return
      }

      // Récupérer les détails de la formation
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Récupérer les modules avec leurs items
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          items (*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (modulesError) throw modulesError

      // Trier les items dans chaque module
      const sortedModules = modulesData?.map(module => ({
        ...module,
        items: module.items?.sort((a: Item, b: Item) => a.position - b.position) || []
      })) || []

      setModules(sortedModules)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement de la formation.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Formation non trouvée'}
          </h2>
          <Link to="/app" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>
            </div>
            {profile?.role === 'admin' && (
              <Link
                to={`/admin/courses/${course.id}`}
                className="btn-secondary text-sm"
              >
                Modifier
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Cette formation ne contient aucun module pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {modules.map((module) => (
                <div key={module.id} className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {module.title}
                  </h2>

                  {module.items.length === 0 ? (
                    <p className="text-gray-500">Aucun élément dans ce module.</p>
                  ) : (
                    <div className="space-y-3">
                      {module.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              item.type === 'resource' ? 'bg-blue-500' :
                              item.type === 'slide' ? 'bg-green-500' :
                              item.type === 'exercise' ? 'bg-yellow-500' :
                              item.type === 'tp' ? 'bg-purple-500' :
                              'bg-red-500'
                            }`} />
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-500 capitalize">
                                {item.type === 'resource' ? 'Ressource' :
                                 item.type === 'slide' ? 'Support' :
                                 item.type === 'exercise' ? 'Exercice' :
                                 item.type === 'tp' ? 'TP' : 'Jeu'}
                              </p>
                            </div>
                          </div>

                          <Link
                            to={`/items/${item.id}`}
                            className="btn-primary text-sm"
                          >
                            Accéder
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
