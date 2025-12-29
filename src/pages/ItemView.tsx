import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Item, Submission } from '../types/database'
import { ItemRenderer } from '../components/ItemRenderer'
import { ChapterViewer } from '../components/ChapterViewer'
import { RichTextEditor } from '../components/RichTextEditor'

export function ItemView() {
  const { itemId } = useParams<{ itemId: string }>()
  const { user, profile } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
  }, [itemId])

  const fetchItem = async () => {
    try {
      setError('')

      // Récupérer l'item avec vérification d'accès
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          modules (
            course_id,
            courses (
              id,
              title,
              access_type,
              status,
              created_by
            )
          )
        `)
        .eq('id', itemId)
        .eq('published', true)
        .single()

      if (itemError) throw itemError

      // Vérifier l'accès à la formation (seulement si pas admin)
      const courseId = itemData.modules?.courses?.id
      const courseData = itemData.modules?.courses
      
      if (courseId && profile?.role !== 'admin' && user?.id && courseData) {
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

          if (accessError || !accessCheck) {
            setError('Vous n\'avez pas accès à cet élément.')
            setLoading(false)
            return
          }
        }
      }

      setItem(itemData)

      // Récupérer la soumission existante si c'est un exercice ou TP
      if ((itemData.type === 'exercise' || itemData.type === 'tp') && user?.id) {
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .single()

        setSubmission(submissionData)
      }
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Erreur lors du chargement de l\'élément.')
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

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Élément non trouvé'}
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
                to={`/courses/${item.modules?.courses?.id}`}
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour à la formation
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                <p className="text-sm text-gray-600">
                  Formation: {item.modules?.courses?.title}
                </p>
              </div>
            </div>
            {profile?.role === 'admin' && (
              <Link
                to={`/admin/items/${item.id}/edit`}
                className="btn-secondary text-sm"
              >
                Modifier
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {/* Contenu principal de l'item */}
          {item.content?.body && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contenu</h2>
              <RichTextEditor
                content={item.content.body}
                onChange={() => {}} // Lecture seule
                editable={false}
              />
            </div>
          )}

          {/* Chapitres */}
          <div className="bg-white rounded-lg shadow p-6">
            <ChapterViewer itemId={item.id} />
          </div>

          {/* Contenu spécifique selon le type (exercices, TP, etc.) */}
          <div className="bg-white rounded-lg shadow p-6">
            <ItemRenderer
              item={item}
              submission={submission}
              onSubmissionUpdate={setSubmission}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
