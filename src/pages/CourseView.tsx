import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Module, Item } from '../types/database'
import { CourseFeaturesTiles } from '../components/CourseFeaturesTiles'
import { Progress } from '../components/Progress'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filterType = searchParams.get('filter') as Item['type'] | null
  const viewMode = searchParams.get('view')

  useEffect(() => {
    if (courseId && user) {
      fetchCourse()
    }
  }, [courseId, user])

  const fetchCourse = async () => {
    try {
      setError('')

      // Récupérer les détails de la formation d'abord
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Vérifier l'accès à la formation (seulement si pas admin)
      if (profile?.role !== 'admin' && user?.id && courseData) {
        // Vérifier si l'utilisateur est le créateur de la formation
        if (courseData.created_by === user.id) {
          // Le créateur a toujours accès
        }
        // Vérifier si la formation est gratuite et publiée
        else if (courseData.access_type === 'free' && courseData.status === 'published') {
          // Les formations gratuites et publiées sont accessibles à tous
          // Créer automatiquement un enrollment si nécessaire
          const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle()

          if (!existingEnrollment) {
            // Créer automatiquement l'enrollment pour les formations gratuites
            await supabase
              .from('enrollments')
              .insert({
                user_id: user.id,
                course_id: courseId,
                status: 'active',
                source: 'manual'
              })
          }
        }
        // Pour les autres cas, vérifier l'enrollment
        else {
          const { data: accessCheck, error: accessError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .maybeSingle()

          // Si pas d'inscription active
          if (accessError || !accessCheck) {
            setError('Vous n\'avez pas accès à cette formation.')
            setLoading(false)
            return
          }
        }
      }
      setCourse(courseData)

      // Continuer le chargement même si on a créé un enrollment

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

      // Collecter tous les items pour les tuiles
      const allItemsList = sortedModules.flatMap(module => module.items || [])
      setAllItems(allItemsList)
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
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                {course.description ? (
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {typeof course.description === 'string' && course.description.includes('**') ? (
                      // Si le texte contient du markdown simple, le formater
                      <div className="whitespace-pre-wrap">
                        {course.description.split('\n').map((line, i) => {
                          if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                            return <p key={i} className="font-semibold my-2">{line.replace(/\*\*/g, '')}</p>
                          }
                          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                            return <p key={i} className="ml-4 my-1">• {line.replace(/^[-*]\s+/, '')}</p>
                          }
                          if (line.trim() === '') {
                            return <br key={i} />
                          }
                          return <p key={i} className="my-1">{line}</p>
                        })}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {course.description}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {viewMode !== 'progress' && (
                <Link
                  to={`/courses/${courseId}?view=progress`}
                  className="btn-secondary text-sm"
                >
                  Voir la progression
                </Link>
              )}
              {viewMode === 'progress' && (
                <Link
                  to={`/courses/${courseId}`}
                  className="btn-secondary text-sm"
                >
                  Retour au contenu
                </Link>
              )}
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
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Vue de progression */}
          {viewMode === 'progress' ? (
            <Progress />
          ) : (
            <>
          {/* Description détaillée si présente et longue */}
          {course.description && course.description.length > 150 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                {typeof course.description === 'string' && (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {course.description.split('\n').map((line, i) => {
                      const trimmed = line.trim()
                      // Détecter les titres avec **texte**
                      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                        return <h3 key={i} className="font-semibold text-gray-900 my-4 text-base">{trimmed.replace(/\*\*/g, '')}</h3>
                      }
                      // Détecter les listes avec - ou *
                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        return <p key={i} className="ml-6 my-2 text-gray-700">• {trimmed.replace(/^[-*]\s+/, '')}</p>
                      }
                      // Lignes vides
                      if (trimmed === '') {
                        return <br key={i} />
                      }
                      // Paragraphes normaux
                      return <p key={i} className="my-2 text-gray-700">{line}</p>
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tuiles de fonctionnalités */}
          {course && allItems.length > 0 && (
            <CourseFeaturesTiles 
              course={course} 
              items={allItems} 
              courseId={courseId!} 
            />
          )}

          {modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Cette formation ne contient aucun module pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {modules.map((module) => {
                // Filtrer les items si un filtre est actif
                const filteredItems = filterType 
                  ? module.items.filter(item => item.type === filterType)
                  : module.items

                if (filteredItems.length === 0 && filterType) {
                  return null
                }

                return (
                  <div key={module.id} className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {module.title}
                    </h2>

                    {filteredItems.length === 0 ? (
                      <p className="text-gray-500">Aucun élément dans ce module.</p>
                    ) : (
                      <div className="space-y-3">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                item.type === 'resource' ? 'bg-blue-500' :
                                item.type === 'slide' ? 'bg-green-500' :
                                item.type === 'exercise' ? 'bg-yellow-500' :
                                item.type === 'tp' ? 'bg-purple-500' :
                                'bg-red-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 break-words">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-gray-500 capitalize mt-1">
                                  {item.type === 'resource' ? 'Ressource' :
                                   item.type === 'slide' ? 'Support' :
                                   item.type === 'exercise' ? 'Exercice' :
                                   item.type === 'tp' ? 'TP' : 'Jeu'}
                                </p>
                              </div>
                            </div>

                            <Link
                              to={`/items/${item.id}`}
                              className="btn-primary text-sm flex-shrink-0 ml-4"
                            >
                              Accéder
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Message si aucun résultat avec le filtre */}
          {filterType && modules.every(module => {
            const filtered = module.items.filter(item => item.type === filterType)
            return filtered.length === 0
          }) && (
            <div className="text-center py-12 bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-lg">
                Aucun élément de type "{filterType}" dans cette formation.
              </p>
              <Link 
                to={`/courses/${courseId}`}
                className="btn-primary mt-4 inline-block"
              >
                Voir tous les éléments
              </Link>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
