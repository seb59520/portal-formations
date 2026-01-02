import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Program, ProgramCourseWithCourse, Course } from '../types/database'
import { AppHeader } from '../components/AppHeader'
import { ArrowLeft, Layers, BookOpen, ChevronRight } from 'lucide-react'

export function ProgramView() {
  const { programId } = useParams<{ programId: string }>()
  const { user, profile } = useAuth()
  const [program, setProgram] = useState<Program | null>(null)
  const [programCourses, setProgramCourses] = useState<ProgramCourseWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (programId && user) {
      fetchProgram()
    }
  }, [programId, user])

  const fetchProgram = async () => {
    try {
      setError('')

      // Récupérer le programme
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (programError) {
        if (programError.code === 'PGRST116') {
          setError('Programme introuvable.')
        } else {
          throw programError
        }
        return
      }

      setProgram(programData)

      // Vérifier l'accès au programme (seulement si pas admin)
      if (profile?.role !== 'admin' && user?.id && programData) {
        // Vérifier si l'utilisateur est le créateur
        if (programData.created_by === user.id) {
          // Le créateur a toujours accès
        }
        // Vérifier si le programme est gratuit et publié
        else if (programData.access_type === 'free' && programData.status === 'published') {
          // Les programmes gratuits et publiés sont accessibles à tous
        }
        // Sinon, vérifier l'inscription
        else {
          const { data: enrollment } = await supabase
            .from('program_enrollments')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('program_id', programId)
            .eq('status', 'active')
            .single()

          if (!enrollment) {
            setError('Vous n\'avez pas accès à ce programme.')
            return
          }
        }
      }

      // Récupérer les formations du programme dans l'ordre
      // On récupère d'abord les program_courses, puis les courses séparément pour éviter les problèmes RLS
      const { data: programCoursesData, error: programCoursesError } = await supabase
        .from('program_courses')
        .select('*')
        .eq('program_id', programId)
        .order('position', { ascending: true })

      console.log('Program courses data:', programCoursesData)
      console.log('Program courses error:', programCoursesError)

      if (programCoursesError) {
        console.error('Error fetching program courses:', programCoursesError)
        setError(`Erreur lors du chargement des formations du programme: ${programCoursesError.message || 'Erreur inconnue'}`)
        setProgramCourses([])
      } else if (!programCoursesData || programCoursesData.length === 0) {
        console.log('No program courses found for program:', programId)
        setProgramCourses([])
      } else {
        // Récupérer les détails des formations séparément
        const courseIds = programCoursesData.map(pc => pc.course_id)
        console.log('Course IDs to fetch:', courseIds)
        
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds)

        console.log('Courses data:', coursesData)
        console.log('Courses error:', coursesError)

        if (coursesError) {
          console.error('Error fetching courses:', coursesError)
          setError(`Erreur lors du chargement des formations: ${coursesError.message || 'Erreur inconnue'}`)
        }

        // Créer un map pour accéder rapidement aux courses
        const coursesMap = new Map((coursesData || []).map(c => [c.id, c]))
        console.log('Courses map:', Array.from(coursesMap.entries()))

        // Combiner les données
        const formatted = programCoursesData.map((pc: any) => {
          const course = coursesMap.get(pc.course_id) || null
          console.log(`Program course ${pc.id}: course_id=${pc.course_id}, found=${!!course}`)
          return {
            ...pc,
            courses: course
          }
        }).filter((pc: any) => pc.courses !== null) // Filtrer les formations qui n'existent plus

        console.log('Formatted program courses:', formatted)
        setProgramCourses(formatted)
      }

    } catch (error) {
      console.error('Error fetching program:', error)
      setError(`Erreur lors du chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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

  if (error && !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            to="/app"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la bibliothèque
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      {/* Header du programme */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/app"
            className="inline-flex items-center text-purple-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la bibliothèque
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8" />
            <span className="text-purple-200 text-sm font-medium">Programme</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {program?.title}
          </h1>
          {program?.description && (
            <p className="text-xl text-purple-100 max-w-3xl">
              {program.description}
            </p>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {programCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Ce programme ne contient aucune formation pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Formations du programme ({programCourses.length})
              </h2>
              <p className="text-gray-600 mb-6">
                Les formations sont présentées dans l'ordre recommandé. Suivez-les dans l'ordre pour une progression optimale.
              </p>

              <div className="space-y-4">
                {programCourses.map((pc, index) => {
                  const course = pc.courses as Course | null
                  
                  // Si la formation n'existe pas, ne pas l'afficher
                  if (!course || !course.id) {
                    return null
                  }
                  
                  return (
                    <div
                      key={pc.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {course.title || 'Formation sans titre'}
                              </h3>
                              {course.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  course.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                </span>
                                {course.access_type === 'free' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Gratuit
                                  </span>
                                )}
                                {course.access_type === 'paid' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    💰 {course.price_cents ? `${course.price_cents / 100}€` : 'Payant'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link
                              to={`/courses/${course.id}`}
                              className="btn-primary inline-flex items-center space-x-2 flex-shrink-0"
                            >
                              <span>Accéder</span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

