import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course, Submission, Item, Profile } from '../../types/database'
import { FileText, Search, Download, CheckCircle, Clock, XCircle, File, Eye } from 'lucide-react'
import { RichTextEditor } from '../../components/RichTextEditor'

interface SubmissionWithDetails extends Submission {
  profiles: Profile
  items: (Item & {
    modules?: {
      id: string
      title: string
      course_id: string
    } | {
      id: string
      title: string
      course_id: string
    }[]
  } | null) | null
}

export function AdminCourseSubmissions() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'exercise' | 'tp'>('all')
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null)
  const [gradeValue, setGradeValue] = useState<number>(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchSubmissions()
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

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      
      // Récupérer tous les items du cours (exercices et TPs)
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          id,
          items (
            id,
            type,
            title,
            module_id
          )
        `)
        .eq('course_id', courseId)

      if (modulesError) throw modulesError

      const allItems = modulesData?.flatMap(m => m.items || []) || []
      const exerciseAndTpItems = allItems.filter(item => 
        item.type === 'exercise' || item.type === 'tp'
      )
      const itemIds = exerciseAndTpItems.map(item => item.id)

      if (itemIds.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // Récupérer les soumissions avec les profils et les items
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (*),
          items (
            id,
            type,
            title,
            module_id,
            modules (
              id,
              title,
              course_id
            )
          )
        `)
        .in('item_id', itemIds)
        .order('submitted_at', { ascending: false })

      if (submissionsError) throw submissionsError

      // Transformer les données pour correspondre à l'interface
      const transformedSubmissions = (submissionsData || []).map(sub => {
        let moduleData = null
        if (sub.items) {
          if (Array.isArray(sub.items.modules) && sub.items.modules.length > 0) {
            moduleData = sub.items.modules[0]
          } else if (sub.items.modules && !Array.isArray(sub.items.modules)) {
            moduleData = sub.items.modules
          }
        }
        
        return {
          ...sub,
          items: sub.items ? {
            ...sub.items,
            modules: moduleData
          } : null
        }
      })

      setSubmissions(transformedSubmissions as SubmissionWithDetails[])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      setError('Erreur lors du chargement des soumissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async (submissionId: string) => {
    if (gradeValue < 0 || gradeValue > 100) {
      setError('La note doit être entre 0 et 100.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          grade: gradeValue,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      await fetchSubmissions()
      setGradingSubmission(null)
      setGradeValue(0)
      setFeedback('')
    } catch (error) {
      console.error('Error grading submission:', error)
      setError(`Erreur lors de la notation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const getFileUrl = (filePath: string | null) => {
    if (!filePath) return null
    const { data } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  // Filtrer les soumissions
  const filteredSubmissions = submissions.filter(submission => {
    // Filtre par recherche (nom étudiant, titre exercice)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesName = submission.profiles?.full_name?.toLowerCase().includes(search)
      const matchesTitle = submission.items?.title?.toLowerCase().includes(search)
      if (!matchesName && !matchesTitle) return false
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (submission.status !== statusFilter) return false
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      if (submission.items?.type !== typeFilter) return false
    }

    return true
  })

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
                  Soumissions des étudiants
                </h1>
                {course && (
                  <p className="text-sm text-gray-600 mt-1">
                    {course.title}
                  </p>
                )}
              </div>
            </div>
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

          {/* Filtres */}
          <div className="mb-6 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par étudiant ou exercice..."
                className="input-field pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'submitted' | 'graded')}
                  className="input-field"
                >
                  <option value="all">Tous</option>
                  <option value="submitted">Soumis</option>
                  <option value="graded">Noté</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'exercise' | 'tp')}
                  className="input-field"
                >
                  <option value="all">Tous</option>
                  <option value="exercise">Exercices</option>
                  <option value="tp">Travaux pratiques</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des soumissions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Soumissions ({filteredSubmissions.length})
              </h2>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Aucune soumission ne correspond à vos critères.'
                    : 'Aucune soumission pour le moment.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <li key={submission.id} className="px-6 py-4">
                    <div className="space-y-4">
                      {/* En-tête */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {submission.items?.title || 'Exercice sans titre'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              submission.items?.type === 'exercise'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {submission.items?.type === 'exercise' ? 'Exercice' : 'TP'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              submission.status === 'graded'
                                ? 'bg-green-100 text-green-800'
                                : submission.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.status === 'graded' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Noté
                                </>
                              ) : submission.status === 'submitted' ? (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Soumis
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Brouillon
                                </>
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            Étudiant: <span className="font-medium">{submission.profiles?.full_name || 'Sans nom'}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {submission.grade !== null && (
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              Note: {submission.grade}/100
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {submission.file_path && (
                            <a
                              href={getFileUrl(submission.file_path) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setExpandedSubmission(
                                expandedSubmission === submission.id ? null : submission.id
                              )
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {expandedSubmission === submission.id ? 'Masquer' : 'Voir'}
                          </button>
                          {submission.status === 'submitted' && (
                            <button
                              onClick={() => {
                                setGradingSubmission(submission.id)
                                setGradeValue(submission.grade || 0)
                              }}
                              className="btn-primary"
                            >
                              Noter
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Contenu détaillé */}
                      {expandedSubmission === submission.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          {/* Réponse texte */}
                          {submission.answer_text && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Réponse de l'étudiant</h4>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{submission.answer_text}</p>
                              </div>
                            </div>
                          )}

                          {/* Fichier soumis */}
                          {submission.file_path && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Fichier soumis</h4>
                              <div className="flex items-center space-x-2">
                                <File className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-600">{submission.file_path.split('/').pop()}</span>
                                <a
                                  href={getFileUrl(submission.file_path) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  Ouvrir
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Lien vers l'exercice */}
                          <div>
                            <Link
                              to={`/items/${submission.item_id}`}
                              className="text-blue-600 hover:text-blue-500 text-sm"
                            >
                              Voir l'exercice →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Formulaire de notation */}
                      {gradingSubmission === submission.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Noter cette soumission</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Note (0-100)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(parseInt(e.target.value) || 0)}
                                className="input-field w-32"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setGradingSubmission(null)
                                  setGradeValue(0)
                                }}
                                className="btn-secondary"
                                disabled={saving}
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleGradeSubmission(submission.id)}
                                disabled={saving}
                                className="btn-primary disabled:opacity-50"
                              >
                                {saving ? 'Enregistrement...' : 'Enregistrer la note'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

