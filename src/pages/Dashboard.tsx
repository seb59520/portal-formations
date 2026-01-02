import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { withRetry, withTimeout, isAuthError } from '../lib/supabaseHelpers'
import { getUserOrg } from '../lib/queries/userQueries'
import { Course, Enrollment, Program, ProgramEnrollment, Org } from '../types/database'
import { AppHeader } from '../components/AppHeader'
import { LayoutGrid, List, Calendar, BookOpen, Layers, Building2 } from 'lucide-react'

interface CourseWithEnrollment extends Course {
  enrollment?: Enrollment
  type?: 'course'
}

interface ProgramWithEnrollment extends Program {
  enrollment?: ProgramEnrollment
  type?: 'program'
}

type LibraryItem = CourseWithEnrollment | ProgramWithEnrollment

type ViewMode = 'grid' | 'list'

export function Dashboard() {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [programs, setPrograms] = useState<ProgramWithEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<Org | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Récupérer le mode de vue depuis localStorage
    const saved = localStorage.getItem('dashboard-view-mode')
    return (saved as ViewMode) || 'grid'
  })

  // Sauvegarder le mode de vue dans localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('dashboard-view-mode', mode)
  }

  useEffect(() => {
    fetchLibraryItems()
  }, [])

  useEffect(() => {
    async function loadOrg() {
      if (!user?.id || profile?.role === 'admin') return; // Pas besoin pour les admins
      
      const { org: userOrg } = await getUserOrg(user.id)
      setOrg(userOrg)
    }
    
    loadOrg()
  }, [user?.id, profile?.role])

  const fetchLibraryItems = async () => {
    try {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const allItems: LibraryItem[] = []

      // Récupérer les formations où l'utilisateur est inscrit
      const { data: enrollments, error: enrollmentsError } = await withRetry(
        () => withTimeout(
          supabase
            .from('enrollments')
            .select(`
              *,
              courses (*)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active'),
          5000,
          'Enrollments fetch timeout'
        ),
        { maxRetries: 1, initialDelay: 500 }
      )

      if (enrollmentsError && enrollmentsError.code !== 'PGRST116') {
        console.error('Error fetching enrollments:', enrollmentsError)
        if (isAuthError(enrollmentsError)) {
          console.error('Auth error, user may need to reconnect')
          return
        }
      }

      const enrolledCourses: CourseWithEnrollment[] = (enrollments?.map(e => ({
        ...e.courses,
        enrollment: e,
        type: 'course' as const
      })) || [])

      allItems.push(...enrolledCourses)

      // Récupérer les programmes où l'utilisateur est inscrit
      const { data: programEnrollments, error: programEnrollmentsError } = await withRetry(
        () => withTimeout(
          supabase
            .from('program_enrollments')
            .select(`
              *,
              programs (*)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active'),
          5000,
          'Program enrollments fetch timeout'
        ),
        { maxRetries: 1, initialDelay: 500 }
      )

      if (programEnrollmentsError && programEnrollmentsError.code !== 'PGRST116') {
        console.error('Error fetching program enrollments:', programEnrollmentsError)
        if (isAuthError(programEnrollmentsError)) {
          console.error('Auth error fetching programs')
        }
      } else {
        const enrolledPrograms: ProgramWithEnrollment[] = (programEnrollments?.map(e => ({
          ...e.programs,
          enrollment: e,
          type: 'program' as const
        })) || [])

        allItems.push(...enrolledPrograms)
      }

      // Si admin, récupérer aussi toutes les formations et programmes (pour gestion)
      if (profile?.role === 'admin') {
        const [coursesResult, programsResult] = await Promise.all([
          withRetry(
            () => withTimeout(
              supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false }),
              5000,
              'Courses fetch timeout'
            ),
            { maxRetries: 1, initialDelay: 500 }
          ),
          withRetry(
            () => withTimeout(
              supabase
                .from('programs')
                .select('*')
                .order('created_at', { ascending: false }),
              5000,
              'Programs fetch timeout'
            ),
            { maxRetries: 1, initialDelay: 500 }
          )
        ])

        // Créer des maps pour éviter les doublons
        const courseMap = new Map<string, CourseWithEnrollment>()
        const programMap = new Map<string, ProgramWithEnrollment>()

        // Ajouter les éléments déjà récupérés
        allItems.forEach(item => {
          if (item.type === 'course') {
            courseMap.set(item.id, item as CourseWithEnrollment)
          } else if (item.type === 'program') {
            programMap.set(item.id, item as ProgramWithEnrollment)
          }
        })

        // Ajouter toutes les formations (admin voit tout)
        if (coursesResult.data) {
          coursesResult.data.forEach(course => {
            if (!courseMap.has(course.id)) {
              courseMap.set(course.id, { ...course, type: 'course' as const })
            }
          })
        }

        // Ajouter tous les programmes (admin voit tout)
        if (programsResult.data) {
          programsResult.data.forEach(program => {
            if (!programMap.has(program.id)) {
              programMap.set(program.id, { ...program, type: 'program' as const })
            }
          })
        }

        // Reconstruire allItems avec tous les éléments
        allItems.length = 0
        allItems.push(...Array.from(courseMap.values()), ...Array.from(programMap.values()))
      }

      // Séparer les cours et les programmes
      const coursesList: CourseWithEnrollment[] = []
      const programsList: ProgramWithEnrollment[] = []

      allItems.forEach(item => {
        if (item.type === 'course') {
          coursesList.push(item as CourseWithEnrollment)
        } else if (item.type === 'program') {
          programsList.push(item as ProgramWithEnrollment)
        }
      })

      // Trier par date de création (plus récent en premier)
      coursesList.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      programsList.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      setItems(allItems)
      setCourses(coursesList)
      setPrograms(programsList)
    } catch (error) {
      console.error('Error fetching library items:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* Hero Section - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {profile?.role === 'admin' 
                  ? 'Gérez vos formations et suivez les apprenants'
                  : 'Découvrez et suivez vos formations'}
              </p>
              {org && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>Organisation: <span className="font-medium text-gray-700">{org.name}</span></span>
                </div>
              )}
            </div>
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Créer une formation
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-8">
          {/* Section Formations */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {profile?.role === 'admin' ? 'Toutes les formations' : 'Mes formations'}
                </h2>
                {courses.length > 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {courses.length}
                  </span>
                )}
              </div>
              {courses.length > 0 && (
                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Vue grille"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Vue liste"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="max-w-md mx-auto">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-base mb-2">
                  {profile?.role === 'admin'
                    ? 'Aucune formation créée pour le moment.'
                    : 'Vous n\'êtes inscrit à aucune formation.'}
                </p>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="btn-primary inline-flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une formation
                  </Link>
                )}
              </div>
            </div>
            ) : viewMode === 'grid' ? (
              /* Vue Grille - Formations */
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {course.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {course.description || 'Aucune description disponible.'}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.access_type === 'paid' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                          </span>
                        )}
                        {course.access_type === 'free' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Gratuit
                          </span>
                        )}
                      </div>

                      <div className="mt-auto">
                        {profile?.role === 'admin' ? (
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Gérer la formation
                          </Link>
                        ) : (
                          <Link
                            to={`/courses/${course.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Accéder à la formation
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vue Liste - Formations */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {course.title}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                course.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {course.status === 'published' ? 'Publié' : 'Brouillon'}
                              </span>
                              {course.access_type === 'paid' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                                </span>
                              )}
                              {course.access_type === 'free' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Gratuit
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {course.description || 'Aucune description disponible.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 sm:ml-4">
                          {profile?.role === 'admin' ? (
                            <Link
                              to={`/admin/courses/${course.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Gérer
                            </Link>
                          ) : (
                            <Link
                              to={`/courses/${course.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Accéder
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section Programmes */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {profile?.role === 'admin' ? 'Tous les programmes' : 'Mes programmes'}
                </h2>
                {programs.length > 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {programs.length}
                  </span>
                )}
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="max-w-md mx-auto">
                  <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 text-base mb-2">
                    {profile?.role === 'admin'
                      ? 'Aucun programme créé pour le moment.'
                      : 'Vous n\'êtes inscrit à aucun programme.'}
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* Vue Grille - Programmes */
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {programs.map((program) => (
                  <div key={program.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-semibold text-gray-900 break-words flex-1 pr-2 line-clamp-2">
                          {program.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          program.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {program.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {program.description || 'Aucune description disponible.'}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {program.access_type === 'paid' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            💰 {program.price_cents ? `${program.price_cents / 100}€` : 'Prix à définir'}
                          </span>
                        )}
                        {program.access_type === 'free' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Gratuit
                          </span>
                        )}
                      </div>

                      <div className="mt-auto">
                        {profile?.role === 'admin' ? (
                          <Link
                            to={`/admin/programs/${program.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Gérer le programme
                          </Link>
                        ) : (
                          <Link
                            to={`/programs/${program.id}`}
                            className="btn-primary text-sm w-full text-center block"
                          >
                            Accéder au programme
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Vue Liste - Programmes */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {programs.map((program) => (
                    <div 
                      key={program.id} 
                      className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {program.title}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                program.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {program.status === 'published' ? 'Publié' : 'Brouillon'}
                              </span>
                              {program.access_type === 'paid' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  💰 {program.price_cents ? `${program.price_cents / 100}€` : 'Prix à définir'}
                                </span>
                              )}
                              {program.access_type === 'free' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Gratuit
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {program.description || 'Aucune description disponible.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 sm:ml-4">
                          {profile?.role === 'admin' ? (
                            <Link
                              to={`/admin/programs/${program.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Gérer
                            </Link>
                          ) : (
                            <Link
                              to={`/programs/${program.id}`}
                              className="btn-primary text-sm inline-flex items-center"
                            >
                              Accéder
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
