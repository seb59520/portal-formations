import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Course, Module, Item, Submission, GameScore } from '../types/database'
import { CheckCircle2, Circle, Trophy, FileText, Clock, BarChart3 } from 'lucide-react'

interface ModuleWithItems extends Module {
  items: Item[]
}

interface ItemProgress {
  item: Item
  completed: boolean
  submission?: Submission | null
  gameScore?: GameScore | null
  bestGameScore?: number
}

interface ModuleProgress {
  module: ModuleWithItems
  itemsProgress: ItemProgress[]
  completedCount: number
  totalCount: number
  progressPercent: number
}

export function Progress() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modulesProgress, setModulesProgress] = useState<ModuleProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const [totalGameScores, setTotalGameScores] = useState(0)
  const [averageGameScore, setAverageGameScore] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)

  useEffect(() => {
    if (courseId && user?.id) {
      fetchProgress()
    }
  }, [courseId, user?.id])

  const fetchProgress = async () => {
    try {
      setLoading(true)

      // Récupérer la formation
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

      // Récupérer toutes les soumissions de l'utilisateur pour cette formation
      const allItems = modulesData?.flatMap(m => m.items || []) || []
      const itemIds = allItems.map(item => item.id)

      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .in('item_id', itemIds)

      if (submissionsError) throw submissionsError

      // Récupérer tous les scores de jeux de l'utilisateur pour cette formation
      const { data: gameScores, error: gameScoresError } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (gameScoresError) throw gameScoresError

      // Organiser les données de progression
      const modulesWithProgress: ModuleProgress[] = (modulesData || []).map(module => {
        const items = (module.items || []).sort((a: Item, b: Item) => a.position - b.position)
        
        const itemsProgress: ItemProgress[] = items.map(item => {
          const submission = submissions?.find(s => s.item_id === item.id)
          const itemGameScores = gameScores?.filter(gs => gs.item_id === item.id) || []
          const bestGameScore = itemGameScores.length > 0 
            ? Math.max(...itemGameScores.map(gs => gs.score))
            : undefined

          // Un item est complété si :
          // - C'est un exercice/TP et il y a une soumission
          // - C'est un jeu et il y a un score
          // - C'est une ressource/slide (considéré comme complété s'il a été consulté)
          const completed = item.type === 'exercise' || item.type === 'tp'
            ? !!submission && submission.status !== 'draft'
            : item.type === 'game'
            ? itemGameScores.length > 0
            : false // Pour les ressources/slides, on pourrait tracker les vues plus tard

          return {
            item,
            completed,
            submission,
            gameScore: itemGameScores[0] || null,
            bestGameScore
          }
        })

        const completedCount = itemsProgress.filter(ip => ip.completed).length
        const totalCount = itemsProgress.length
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

        return {
          module: { ...module, items },
          itemsProgress,
          completedCount,
          totalCount,
          progressPercent
        }
      })

      setModulesProgress(modulesWithProgress)

      // Calculer les statistiques globales
      const allItemsProgress = modulesWithProgress.flatMap(mp => mp.itemsProgress)
      const total = allItemsProgress.length
      const completed = allItemsProgress.filter(ip => ip.completed).length
      const overall = total > 0 ? Math.round((completed / total) * 100) : 0

      setTotalItems(total)
      setCompletedItems(completed)
      setOverallProgress(overall)

      // Statistiques des jeux
      const allGameScores = gameScores || []
      setTotalGameScores(allGameScores.length)
      if (allGameScores.length > 0) {
        const avg = allGameScores.reduce((sum, gs) => sum + gs.score, 0) / allGameScores.length
        setAverageGameScore(Math.round(avg))
      }

      // Statistiques des soumissions
      const allSubmissions = submissions?.filter(s => s.status !== 'draft') || []
      setTotalSubmissions(allSubmissions.length)
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
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
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progression globale</p>
                <p className="text-3xl font-bold text-blue-600">{overallProgress}%</p>
              </div>
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Éléments complétés</p>
                <p className="text-3xl font-bold text-green-600">
                  {completedItems}/{totalItems}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jeux joués</p>
                <p className="text-3xl font-bold text-purple-600">{totalGameScores}</p>
              </div>
              <Trophy className="w-10 h-10 text-purple-600" />
            </div>
            {averageGameScore > 0 && (
              <p className="text-xs text-gray-600 mt-1">Moyenne: {averageGameScore} pts</p>
            )}
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Soumissions</p>
                <p className="text-3xl font-bold text-yellow-600">{totalSubmissions}</p>
              </div>
              <FileText className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progression par module */}
      <div className="space-y-4">
        {modulesProgress.map((moduleProgress) => (
          <div key={moduleProgress.module.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {moduleProgress.module.title}
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {moduleProgress.completedCount}/{moduleProgress.totalCount} complétés
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {moduleProgress.progressPercent}%
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${moduleProgress.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {moduleProgress.itemsProgress.map((itemProgress) => (
                <div
                  key={itemProgress.item.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {itemProgress.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {itemProgress.item.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          itemProgress.item.type === 'resource' ? 'bg-blue-100 text-blue-800' :
                          itemProgress.item.type === 'slide' ? 'bg-green-100 text-green-800' :
                          itemProgress.item.type === 'exercise' ? 'bg-yellow-100 text-yellow-800' :
                          itemProgress.item.type === 'tp' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {itemProgress.item.type === 'resource' ? 'Ressource' :
                           itemProgress.item.type === 'slide' ? 'Support' :
                           itemProgress.item.type === 'exercise' ? 'Exercice' :
                           itemProgress.item.type === 'tp' ? 'TP' : 'Jeu'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        {itemProgress.item.type === 'exercise' || itemProgress.item.type === 'tp' ? (
                          itemProgress.submission ? (
                            <>
                              <span className="flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                {itemProgress.submission.status === 'submitted' ? 'Soumis' :
                                 itemProgress.submission.status === 'graded' ? 'Noté' : 'Brouillon'}
                              </span>
                              {itemProgress.submission.grade !== null && (
                                <span className="font-semibold text-gray-700">
                                  Note: {itemProgress.submission.grade}/100
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">Non soumis</span>
                          )
                        ) : itemProgress.item.type === 'game' ? (
                          itemProgress.bestGameScore !== undefined ? (
                            <span className="flex items-center">
                              <Trophy className="w-3 h-3 mr-1" />
                              Meilleur score: {itemProgress.bestGameScore} pts
                            </span>
                          ) : (
                            <span className="text-gray-400">Non joué</span>
                          )
                        ) : (
                          <span className="text-gray-400">Consultation libre</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques détaillées des jeux */}
      {totalGameScores > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-purple-600" />
            Scores des jeux
          </h3>
          <div className="space-y-3">
            {modulesProgress.flatMap(mp => mp.itemsProgress)
              .filter(ip => ip.item.type === 'game' && ip.bestGameScore !== undefined)
              .map(ip => (
                <div key={ip.item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{ip.item.title}</span>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-600">{ip.bestGameScore} pts</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

