import { useState, useEffect } from 'react'
import { RotateCcw, Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface MatchItem {
  id: string
  text: string
  matchedId: string | null
}

interface ColumnMatchingGameProps {
  leftColumn: string[]
  rightColumn: string[]
  correctMatches: Array<{ left: number; right: number }>
  onScore: (score: number, metadata: { attempts: number; time: number; totalMatches: number }) => void
  description?: string
}

export function ColumnMatchingGame({ 
  leftColumn, 
  rightColumn, 
  correctMatches, 
  onScore, 
  description 
}: ColumnMatchingGameProps) {
  const [leftItems, setLeftItems] = useState<MatchItem[]>([])
  const [rightItems, setRightItems] = useState<MatchItem[]>([])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [attempts, setAttempts] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [feedback, setFeedback] = useState<{ left: string; right: string; correct: boolean } | null>(null)

  // Initialiser les items
  useEffect(() => {
    if (leftColumn.length === 0 || rightColumn.length === 0) return

    const left: MatchItem[] = leftColumn.map((text, index) => ({
      id: `left-${index}`,
      text,
      matchedId: null
    }))

    const right: MatchItem[] = rightColumn.map((text, index) => ({
      id: `right-${index}`,
      text,
      matchedId: null
    }))

    setLeftItems(left)
    setRightItems(right)
  }, [leftColumn, rightColumn])

  // Timer
  useEffect(() => {
    if (!gameStarted || gameFinished) return

    const interval = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, gameFinished, startTime])

  const startGame = () => {
    setGameStarted(true)
    setStartTime(Date.now())
    setElapsedTime(0)
    setAttempts(0)
    setMatchedPairs(new Set())
    setGameFinished(false)
    setSelectedLeft(null)
    setSelectedRight(null)
    setFeedback(null)
    // Réinitialiser les items
    setLeftItems(prev => prev.map(item => ({ ...item, matchedId: null })))
    setRightItems(prev => prev.map(item => ({ ...item, matchedId: null })))
  }

  const handleLeftClick = (itemId: string) => {
    if (!gameStarted || gameFinished) return
    if (matchedPairs.has(itemId)) return // Déjà associé

    if (selectedLeft === itemId) {
      setSelectedLeft(null)
      setFeedback(null)
    } else {
      setSelectedLeft(itemId)
      setSelectedRight(null)
      setFeedback(null)
      
      // Si une droite est déjà sélectionnée, vérifier la correspondance
      if (selectedRight) {
        checkMatch(itemId, selectedRight)
      }
    }
  }

  const handleRightClick = (itemId: string) => {
    if (!gameStarted || gameFinished) return
    if (rightItems.find(item => item.id === itemId)?.matchedId) return // Déjà associé

    if (selectedRight === itemId) {
      setSelectedRight(null)
      setFeedback(null)
    } else {
      setSelectedRight(itemId)
      setSelectedLeft(null)
      setFeedback(null)
      
      // Si une gauche est déjà sélectionnée, vérifier la correspondance
      if (selectedLeft) {
        checkMatch(selectedLeft, itemId)
      }
    }
  }

  const checkMatch = (leftId: string, rightId: string) => {
    const leftIndex = parseInt(leftId.split('-')[1])
    const rightIndex = parseInt(rightId.split('-')[1])
    
    // Vérifier si cette correspondance est correcte
    const isCorrect = correctMatches.some(
      match => match.left === leftIndex && match.right === rightIndex
    )

    setAttempts(prev => prev + 1)
    setFeedback({ left: leftId, right: rightId, correct: isCorrect })

    if (isCorrect) {
      // Association correcte
      setMatchedPairs(prev => new Set([...prev, leftId, rightId]))
      setLeftItems(prev => prev.map(item => 
        item.id === leftId ? { ...item, matchedId: rightId } : item
      ))
      setRightItems(prev => prev.map(item => 
        item.id === rightId ? { ...item, matchedId: leftId } : item
      ))
      setSelectedLeft(null)
      setSelectedRight(null)
      
      // Effacer le feedback après 1 seconde
      setTimeout(() => setFeedback(null), 1000)
    } else {
      // Association incorrecte
      setSelectedLeft(null)
      setSelectedRight(null)
      
      // Effacer le feedback après 1.5 secondes
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  // Vérifier si le jeu est terminé
  useEffect(() => {
    if (matchedPairs.size === correctMatches.length * 2 && correctMatches.length > 0 && gameStarted) {
      setGameFinished(true)
      calculateScore()
    }
  }, [matchedPairs.size, correctMatches.length, gameStarted])

  const calculateScore = () => {
    if (!startTime) return

    const time = Math.floor((Date.now() - startTime) / 1000)
    const totalMatches = correctMatches.length
    
    // Score basé sur :
    // - Temps : moins de temps = meilleur score (max 1000 points)
    // - Tentatives : moins de tentatives = meilleur score (max 1000 points)
    // Score total max : 2000 points
    
    const timeScore = Math.max(0, 1000 - (time * 5)) // -5 points par seconde
    const attemptsScore = Math.max(0, 1000 - ((attempts - totalMatches) * 100)) // -100 points par tentative en trop
    const totalScore = Math.max(0, Math.floor(timeScore + attemptsScore))

    onScore(totalScore, {
      attempts,
      time,
      totalMatches
    })
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameFinished(false)
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatchedPairs(new Set())
    setAttempts(0)
    setElapsedTime(0)
    setStartTime(null)
    setFeedback(null)
    // Réinitialiser les items
    setLeftItems(prev => prev.map(item => ({ ...item, matchedId: null })))
    setRightItems(prev => prev.map(item => ({ ...item, matchedId: null })))
  }

  if (leftColumn.length === 0 || rightColumn.length === 0 || correctMatches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les colonnes et les correspondances dans l'éditeur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}

      {/* Statistiques du jeu */}
      {gameStarted && (
        <div className="flex items-center justify-center gap-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Temps: <span className="text-blue-600">{elapsedTime}s</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Tentatives: <span className="text-blue-600">{attempts}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Associations: <span className="text-blue-600">{matchedPairs.size / 2}/{correctMatches.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin de jeu */}
      {gameFinished && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Félicitations !</h3>
          <p className="text-green-800 mb-4">
            Vous avez associé toutes les correspondances en {elapsedTime} secondes avec {attempts} tentatives.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetGame}
              className="btn-primary"
            >
              Rejouer
            </button>
          </div>
        </div>
      )}

      {/* Bouton de démarrage */}
      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={startGame}
            className="btn-primary text-lg px-8 py-3"
          >
            Commencer le jeu
          </button>
        </div>
      )}

      {/* Grille de correspondance */}
      {gameStarted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
              Colonne 1
            </h3>
            {leftItems.map((item) => {
              const isMatched = matchedPairs.has(item.id)
              const isSelected = selectedLeft === item.id
              const isFeedback = feedback?.left === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleLeftClick(item.id)}
                  disabled={isMatched || gameFinished}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-200
                    ${isMatched
                      ? 'bg-green-200 text-green-900 border-2 border-green-400 cursor-default'
                      : isSelected
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-md'
                      : isFeedback
                      ? feedback?.correct
                        ? 'bg-green-100 text-green-900 border-2 border-green-400'
                        : 'bg-red-100 text-red-900 border-2 border-red-400'
                      : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.text}</span>
                    {isMatched && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {isFeedback && !feedback?.correct && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Colonne droite */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
              Colonne 2
            </h3>
            {rightItems.map((item) => {
              const isMatched = item.matchedId !== null
              const isSelected = selectedRight === item.id
              const isFeedback = feedback?.right === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleRightClick(item.id)}
                  disabled={isMatched || gameFinished}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-200
                    ${isMatched
                      ? 'bg-green-200 text-green-900 border-2 border-green-400 cursor-default'
                      : isSelected
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-md'
                      : isFeedback
                      ? feedback?.correct
                        ? 'bg-green-100 text-green-900 border-2 border-green-400'
                        : 'bg-red-100 text-red-900 border-2 border-red-400'
                      : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.text}</span>
                    {isMatched && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {isFeedback && !feedback?.correct && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {gameStarted && !gameFinished && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 text-center">
            <strong>Instructions :</strong> Cliquez sur un élément de la colonne 1, puis sur l'élément correspondant de la colonne 2.
          </p>
        </div>
      )}
    </div>
  )
}

