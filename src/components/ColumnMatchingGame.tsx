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
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

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

  // Handlers pour drag and drop
  const handleDragStart = (e: React.DragEvent, itemId: string, isLeft: boolean) => {
    if (!gameStarted || gameFinished) return
    if (isLeft && matchedPairs.has(itemId)) return // Déjà associé
    if (!isLeft && rightItems.find(item => item.id === itemId)?.matchedId) return // Déjà associé

    setDraggedItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId, isLeft }))
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItemId(null)
    setDragOverItemId(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, itemId: string, isLeft: boolean) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (!draggedItemId) return
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
      // Ne permettre le drop que si on drag depuis l'autre colonne
      if (dragData.isLeft !== isLeft) {
        setDragOverItemId(itemId)
      }
    } catch {
      // Si pas de données, vérifier avec draggedItemId
      const draggedIsLeft = draggedItemId.startsWith('left-')
      if (draggedIsLeft !== isLeft) {
        setDragOverItemId(itemId)
      }
    }
  }

  const handleDragLeave = () => {
    setDragOverItemId(null)
  }

  const handleDrop = (e: React.DragEvent, targetItemId: string, isLeft: boolean) => {
    e.preventDefault()
    setDragOverItemId(null)

    if (!draggedItemId) return

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
      const draggedItemId = dragData.itemId
      const draggedIsLeft = dragData.isLeft

      // Vérifier que le drop est sur l'autre colonne
      if (draggedIsLeft === isLeft) {
        setDraggedItemId(null)
        return
      }

      // Vérifier que les éléments ne sont pas déjà associés
      if (draggedIsLeft) {
        if (matchedPairs.has(draggedItemId)) {
          setDraggedItemId(null)
          return
        }
      } else {
        if (rightItems.find(item => item.id === draggedItemId)?.matchedId) {
          setDraggedItemId(null)
          return
        }
      }

      // Vérifier la correspondance
      if (draggedIsLeft) {
        checkMatch(draggedItemId, targetItemId)
      } else {
        checkMatch(targetItemId, draggedItemId)
      }
    } catch {
      // Fallback si les données ne sont pas disponibles
      const draggedIsLeft = draggedItemId.startsWith('left-')
      if (draggedIsLeft !== isLeft) {
        if (draggedIsLeft) {
          checkMatch(draggedItemId, targetItemId)
        } else {
          checkMatch(targetItemId, draggedItemId)
        }
      }
    }

    setDraggedItemId(null)
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
      {gameFinished && (() => {
        const totalMatches = correctMatches.length
        const timeScore = Math.max(0, 1000 - (elapsedTime * 5))
        const attemptsScore = Math.max(0, 1000 - ((attempts - totalMatches) * 100))
        const finalScore = Math.max(0, Math.floor(timeScore + attemptsScore))
        const excessAttempts = Math.max(0, attempts - totalMatches)
        
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Félicitations !</h3>
              <p className="text-green-800 mb-4">
                Vous avez associé toutes les correspondances en {elapsedTime} secondes avec {attempts} tentatives.
              </p>
            </div>
            
            {/* Détail du score */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">Détail de votre score</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-700">Points de temps :</span>
                  <span className="font-semibold text-blue-600">
                    {timeScore} pts ({elapsedTime}s × 5 = -{elapsedTime * 5} pts)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-gray-700">Points de précision :</span>
                  <span className="font-semibold text-purple-600">
                    {attemptsScore} pts ({excessAttempts} tentatives en trop × 100 = -{excessAttempts * 100} pts)
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-100 rounded border-2 border-green-300">
                  <span className="font-bold text-gray-900">Score total :</span>
                  <span className="font-bold text-green-700 text-lg">{finalScore} / 2000 pts</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="btn-primary"
              >
                Rejouer
              </button>
            </div>
          </div>
        )
      })()}

      {/* Règles du scoring */}
      {!gameStarted && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Comment fonctionne le scoring ?
          </h4>
          <div className="space-y-3 text-sm text-indigo-800">
            <p className="font-medium">Votre score final est calculé sur 2000 points maximum :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Points de temps (max 1000 pts)</strong> : Vous perdez 5 points par seconde écoulée.
                <br />
                <span className="text-indigo-600 italic">Exemple : 40 secondes = 1000 - (40 × 5) = 800 points</span>
              </li>
              <li>
                <strong>Points de précision (max 1000 pts)</strong> : Vous perdez 100 points par tentative en trop (au-delà du nombre minimum de correspondances).
                <br />
                <span className="text-indigo-600 italic">Exemple : {correctMatches.length} correspondances trouvées en {correctMatches.length + 2} tentatives = 1000 - (2 × 100) = 800 points</span>
              </li>
              <li>
                <strong>Score total</strong> = Points de temps + Points de précision
                <br />
                <span className="text-indigo-600 italic">Exemple : 800 + 800 = 1600 points</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-indigo-100 rounded">
              <p className="font-semibold text-indigo-900">💡 Astuce :</p>
              <p className="text-indigo-700">
                Pour maximiser votre score, soyez rapide ET précis ! Le nombre minimum de tentatives est égal au nombre de correspondances ({correctMatches.length}).
              </p>
            </div>
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
              const isDragged = draggedItemId === item.id
              const isDragOver = dragOverItemId === item.id && draggedItemId && draggedItemId.startsWith('right-')
              
              return (
                <button
                  key={item.id}
                  draggable={!isMatched && gameStarted && !gameFinished}
                  onDragStart={(e) => handleDragStart(e, item.id, true)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, item.id, true)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id, true)}
                  onClick={() => handleLeftClick(item.id)}
                  disabled={isMatched || gameFinished}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-200
                    ${isMatched
                      ? 'bg-green-200 text-green-900 border-2 border-green-400 cursor-default'
                      : isDragged
                      ? 'opacity-50 scale-95'
                      : isDragOver
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-lg scale-105'
                      : isSelected
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-md'
                      : isFeedback
                      ? feedback?.correct
                        ? 'bg-green-100 text-green-900 border-2 border-green-400'
                        : 'bg-red-100 text-red-900 border-2 border-red-400'
                      : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-move'
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
              const isDragged = draggedItemId === item.id
              const isDragOver = dragOverItemId === item.id && draggedItemId && draggedItemId.startsWith('left-')
              
              return (
                <button
                  key={item.id}
                  draggable={!isMatched && gameStarted && !gameFinished}
                  onDragStart={(e) => handleDragStart(e, item.id, false)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, item.id, false)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id, false)}
                  onClick={() => handleRightClick(item.id)}
                  disabled={isMatched || gameFinished}
                  className={`
                    w-full p-4 rounded-lg text-left transition-all duration-200
                    ${isMatched
                      ? 'bg-green-200 text-green-900 border-2 border-green-400 cursor-default'
                      : isDragged
                      ? 'opacity-50 scale-95'
                      : isDragOver
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-lg scale-105'
                      : isSelected
                      ? 'bg-blue-200 text-blue-900 border-2 border-blue-500 shadow-md'
                      : isFeedback
                      ? feedback?.correct
                        ? 'bg-green-100 text-green-900 border-2 border-green-400'
                        : 'bg-red-100 text-red-900 border-2 border-red-400'
                      : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-move'
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
            <strong>Instructions :</strong> Cliquez sur un élément de la colonne 1, puis sur l'élément correspondant de la colonne 2, ou <strong>glissez-déposez</strong> un élément d'une colonne vers l'élément correspondant de l'autre colonne.
          </p>
        </div>
      )}
    </div>
  )
}

