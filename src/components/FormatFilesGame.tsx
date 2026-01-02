import { useState, useEffect } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, ArrowRight, ArrowLeft, BookOpen, ArrowUp } from 'lucide-react'
import { formatFilesLevels, type Level, type Question } from '../data/formatFilesLevels'
import { calculateScore, validateAnswer, isValidJSON } from '../lib/scoring'
import { saveCompleteProgress, getGameProgress, type GameProgress } from '../lib/progress'
import { useAuth } from '../hooks/useAuth'

interface FormatFilesGameProps {
  levels?: Level[]
  onScore?: (score: number, metadata: any) => void
  description?: string
}

type GameState = 'menu' | 'playing' | 'results' | 'revision'

export function FormatFilesGame({ levels: propsLevels, onScore, description }: FormatFilesGameProps) {
  const { user } = useAuth()
  // Utiliser les niveaux fournis ou les niveaux par défaut
  const levels = (propsLevels && propsLevels.length > 0) ? propsLevels : formatFilesLevels
  
  // Debug initial
  useEffect(() => {
    console.log('FormatFilesGame initialized')
    console.log('Props levels:', propsLevels)
    console.log('Using levels:', levels)
    console.log('Levels count:', levels.length)
    if (levels && levels.length > 0) {
      levels.forEach((level, idx) => {
        console.log(`Level ${idx + 1}:`, level.level, level.name, 'Questions:', level.questions?.length || 0)
      })
    } else {
      console.warn('FormatFilesGame: No levels provided and no default levels available')
    }
  }, [propsLevels, levels])
  
  // Vérification de sécurité : si aucun niveau n'est disponible, afficher un message
  if (!levels || levels.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-medium mb-2">⚠️ Aucun niveau disponible</p>
        <p className="text-yellow-700 text-sm">
          Le jeu n'a pas de niveaux configurés. Vérifiez que le champ "levels" dans game_content contient des données.
        </p>
        <pre className="mt-4 text-xs bg-yellow-100 p-3 rounded overflow-auto">
          {JSON.stringify({ propsLevels, hasDefaultLevels: formatFilesLevels.length > 0 }, null, 2)}
        </pre>
      </div>
    )
  }

  // États du jeu
  const [gameState, setGameState] = useState<GameState>('menu')
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [userAnswers, setUserAnswers] = useState<Map<string, string | boolean>>(new Map())
  const [showExplanation, setShowExplanation] = useState(false)
  const [isRevisionMode, setIsRevisionMode] = useState(false)
  const [revisionQuestions, setRevisionQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Question actuelle
  const activeLevel = levels.find(l => l.level === currentLevel)
  const questionsToUse = isRevisionMode ? revisionQuestions : (activeLevel?.questions || [])
  const currentQuestion = questionsToUse[currentQuestionIndex]

  // Debug: log pour vérifier les niveaux et questions
  useEffect(() => {
    if (gameState === 'playing') {
      console.log('Game State:', gameState)
      console.log('Current Level:', currentLevel)
      console.log('Active Level:', activeLevel)
      console.log('Questions to use:', questionsToUse)
      console.log('Current Question Index:', currentQuestionIndex)
      console.log('Current Question:', currentQuestion)
    }
  }, [gameState, currentLevel, activeLevel, questionsToUse, currentQuestionIndex, currentQuestion])

  // Charger la progression au montage
  useEffect(() => {
    if (user && currentLevel) {
      loadProgress()
    }
  }, [user, currentLevel])

  // Gérer l'affichage du bouton scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const loadProgress = async () => {
    if (!user) return
    try {
      const progressData = await getGameProgress(user.id, 'format-files', currentLevel)
      if (progressData) {
        setProgress(progressData)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  // Démarrer un niveau
  const startLevel = (level: number) => {
    console.log('Starting level:', level)
    console.log('Available levels:', levels)
    const selectedLevel = levels.find(l => l.level === level)
    console.log('Selected level:', selectedLevel)
    
    if (!selectedLevel || !selectedLevel.questions || selectedLevel.questions.length === 0) {
      alert(`Aucune question disponible pour le niveau ${level}`)
      return
    }
    
    setCurrentLevel(level)
    setCurrentQuestionIndex(0)
    setScore(0)
    setWrongIds([])
    setUserAnswers(new Map())
    setShowExplanation(false)
    setIsRevisionMode(false)
    setRevisionQuestions([])
    setGameState('playing')
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Démarrer le mode révision
  const startRevision = async () => {
    if (!user || wrongIds.length === 0) return

    // Récupérer les questions ratées depuis tous les niveaux
    const allQuestions = levels.flatMap(l => l.questions)
    const failedQuestions = allQuestions.filter(q => wrongIds.includes(q.id))

    if (failedQuestions.length === 0) {
      alert('Aucune question à réviser !')
      return
    }

    setRevisionQuestions(failedQuestions)
    setCurrentQuestionIndex(0)
    setScore(0)
    setUserAnswers(new Map())
    setShowExplanation(false)
    setIsRevisionMode(true)
    setGameState('playing')
  }

  // Gérer la réponse
  const handleAnswer = (answer: string | boolean) => {
    if (!currentQuestion) return

    const isCorrect = validateAnswer(answer, currentQuestion.answer, currentQuestion.type)
    
    // Pour fix-json-editor, on valide aussi avec JSON.parse si c'est un JSON
    let finalIsCorrect = isCorrect
    if (currentQuestion.type === 'fix-json-editor' && typeof answer === 'string') {
      // Vérifier que le JSON corrigé est valide
      const isValid = isValidJSON(answer)
      finalIsCorrect = isCorrect && isValid
    }

    setUserAnswers(prev => new Map(prev).set(currentQuestion.id, answer))

    if (finalIsCorrect) {
      setScore(prev => prev + 1)
    } else {
      setWrongIds(prev => [...prev, currentQuestion.id])
    }

    setShowExplanation(true)
  }

  // Question suivante
  const handleNext = () => {
    if (currentQuestionIndex < questionsToUse.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowExplanation(false)
    } else {
      // Fin du niveau
      finishLevel()
    }
  }

  // Finir le niveau
  const finishLevel = async () => {
    const total = questionsToUse.length
    const scoreResult = calculateScore(score, total)

    // Sauvegarder la progression
    if (user && !isRevisionMode) {
      await saveCompleteProgress(
        user.id,
        'format-files',
        currentLevel,
        scoreResult,
        wrongIds
      )
    }

    // Appeler le callback onScore si fourni
    if (onScore) {
      onScore(scoreResult.score, {
        total: scoreResult.total,
        percentage: scoreResult.percentage,
        badge: scoreResult.badge,
        level: currentLevel,
        wrongIds
      })
    }

    setGameState('results')
  }

  // Rendu du menu
  const renderMenu = () => {
    // Utiliser les niveaux fournis ou les niveaux par défaut
    const displayLevels = (levels && levels.length > 0) ? levels : formatFilesLevels
    
    if (displayLevels.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Aucun niveau disponible pour ce jeu.</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        {description && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">{description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayLevels.map(level => (
            <button
              key={level.level}
              onClick={() => startLevel(level.level)}
              className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">Niveau {level.level}</h3>
                <span className="text-sm text-gray-500">{level.questions.length} questions</span>
              </div>
              <p className="text-gray-600 font-medium">{level.name}</p>
            </button>
          ))}
        </div>

        {wrongIds.length > 0 && (
          <div className="mt-6">
            <button
              onClick={startRevision}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Réviser mes erreurs ({wrongIds.length} questions)</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Rendu de la question
  const renderQuestion = () => {
    // Vérifier si on a des questions
    if (questionsToUse.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 mb-4">
            Aucune question disponible pour le niveau {currentLevel}.
          </p>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au menu
          </button>
        </div>
      )
    }
    
    if (!currentQuestion) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 mb-4">
            Erreur : Question introuvable (index {currentQuestionIndex} sur {questionsToUse.length}).
          </p>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au menu
          </button>
        </div>
      )
    }

    const userAnswer = userAnswers.get(currentQuestion.id)
    const isAnswered = userAnswer !== undefined
    const isCorrect = isAnswered && validateAnswer(userAnswer, currentQuestion.answer, currentQuestion.type)

    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isRevisionMode ? 'Mode Révision' : `Niveau ${currentLevel} - ${activeLevel?.name}`}
            </h3>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} / {questionsToUse.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Score actuel</p>
            <p className="text-2xl font-bold text-blue-600">{score} / {questionsToUse.length}</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.prompt}</h4>

          {/* Snippet de code */}
          {currentQuestion.snippet && (
            <div className="bg-gray-900 rounded-lg mb-4 overflow-hidden border border-gray-700">
              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                <span className="text-gray-400 text-xs font-medium">Code</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentQuestion.snippet || '')
                  }}
                  className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
                  title="Copier le code"
                >
                  📋 Copier
                </button>
              </div>
              <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-green-400 font-mono text-sm leading-relaxed whitespace-pre m-0" style={{ whiteSpace: 'pre' }}>
                  <code className="block" style={{ fontFamily: 'monospace' }}>
                    {currentQuestion.snippet}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {/* Réponses */}
          {!isAnswered && (
            <div className="space-y-3">
              {currentQuestion.type === 'json-valid' ? (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    ✅ Valide
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    ❌ Invalide
                  </button>
                </div>
              ) : currentQuestion.type === 'fix-json-editor' ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Corrigez le JSON ici..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none"
                    rows={10}
                    onChange={(e) => {
                      // On stocke la réponse mais on ne valide qu'au clic sur "Valider"
                    }}
                    id="json-editor"
                  />
                  <button
                    onClick={() => {
                      const editor = document.getElementById('json-editor') as HTMLTextAreaElement
                      if (editor) {
                        handleAnswer(editor.value)
                      }
                    }}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Valider ma correction
                  </button>
                </div>
              ) : currentQuestion.options ? (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Feedback et explication */}
          {isAnswered && (
            <div className="mt-4">
              <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-800 font-semibold">Bonne réponse !</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="text-red-800 font-semibold">Mauvaise réponse</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Explication :</p>
                  <p>{currentQuestion.explanation}</p>
                  {!isCorrect && (
                    <p className="mt-2 text-gray-600">
                      <strong>Réponse correcte :</strong> {String(currentQuestion.answer)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <span>{currentQuestionIndex < questionsToUse.length - 1 ? 'Question suivante' : 'Voir les résultats'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Rendu des résultats
  const renderResults = () => {
    const total = questionsToUse.length
    const scoreResult = calculateScore(score, total)

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-2">Niveau terminé !</h3>
          {scoreResult.badge && (
            <div className="text-4xl mb-4">{scoreResult.badge}</div>
          )}
          <div className="text-5xl font-bold mb-2">{scoreResult.percentage}%</div>
          <p className="text-xl">
            {scoreResult.score} / {scoreResult.total} bonnes réponses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setGameState('menu')}
            className="p-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour au menu</span>
          </button>
          {wrongIds.length > 0 && (
            <button
              onClick={startRevision}
              className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Réviser mes erreurs ({wrongIds.length})</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Rendu principal
  return (
    <>
      <div className="format-files-game space-y-6">
        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderQuestion()}
        {gameState === 'results' && renderResults()}
      </div>

      {/* Bouton pour remonter en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Remonter en haut"
          title="Remonter en haut"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </>
  )
}

