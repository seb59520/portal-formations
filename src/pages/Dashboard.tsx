import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Enrollment } from '../types/database'

interface CourseWithEnrollment extends Course {
  enrollment?: Enrollment
}

export function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

  const fetchEnrolledCourses = async () => {
    try {
      if (!user?.id) {
        setLoading(false)
        return
      }

      // Récupérer les formations où l'utilisateur est inscrit
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
        // Ne pas bloquer si erreur, juste logger
        if (enrollmentsError.code !== 'PGRST116') {
          throw enrollmentsError
        }
      }

      const enrolledCourses = enrollments?.map(e => ({
        ...e.courses,
        enrollment: e
      })) || []

      // Si admin, récupérer aussi toutes les formations (pour gestion)
      if (profile?.role === 'admin') {
        const { data: allCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })

        if (coursesError) throw coursesError

        // Fusionner les formations (éviter les doublons)
        const courseMap = new Map()
        enrolledCourses.forEach(course => courseMap.set(course.id, course))
        allCourses?.forEach(course => {
          if (!courseMap.has(course.id)) {
            courseMap.set(course.id, course)
          }
        })

        setCourses(Array.from(courseMap.values()))
      } else {
        setCourses(enrolledCourses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await signOut()
      // La redirection est gérée dans useAuth, mais on peut aussi le faire ici
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error signing out:', error)
      // Même en cas d'erreur, rediriger vers la page de connexion
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Portail Formations</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {profile?.full_name || user?.email}
              </span>
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="btn-secondary text-sm"
                >
                  Administration
                </Link>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {profile?.role === 'admin' ? 'Toutes les formations' : 'Mes formations'}
          </h2>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {profile?.role === 'admin'
                  ? 'Aucune formation créée pour le moment.'
                  : 'Vous n\'êtes inscrit à aucune formation.'}
              </p>
              {profile?.role === 'admin' && (
                <Link to="/admin" className="btn-primary mt-4 inline-block">
                  Créer une formation
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div key={course.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {course.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {course.access_type === 'paid' && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Payant - {course.price_cents ? `${course.price_cents / 100}€` : 'Prix à définir'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    {profile?.role === 'admin' ? (
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="btn-primary text-sm"
                      >
                        Gérer
                      </Link>
                    ) : (
                      <Link
                        to={`/courses/${course.id}`}
                        className="btn-primary text-sm"
                      >
                        Accéder
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
