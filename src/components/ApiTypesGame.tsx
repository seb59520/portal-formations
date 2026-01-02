import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock } from 'lucide-react'

interface ApiType {
  id: string
  name: string
  color: string
  description: string
}

interface Scenario {
  id: number
  text: string
  correctType: string
  explanation: string
}

interface ApiTypesGameProps {
  apiTypes: ApiType[]
  scenarios: Scenario[]
  onScore: (score: number, metadata: { attempts: number; time: number; total: number; correct: number }) => void
  description?: string
}

export function ApiTypesGame({ apiTypes, scenarios, onScore, description }: ApiTypesGameProps) {
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [draggedType, setDraggedType] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [attempts, setAttempts] = useState(0)

  // Timer
  useEffect(() => {
    if (!gameStarted || !startTime || showResults) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, startTime, showResults])

  const startGame = () => {
    setGameStarted(true)
    setStartTime(Date.now())
    setElapsedTime(0)
    setAttempts(0)
    setAssignments({})
    setShowResults(false)
  }

  const handleDragStart = (typeId: string) => {
    if (!gameStarted || showResults) return
    setDraggedType(typeId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (scenarioId: number) => {
    if (!gameStarted || showResults || !draggedType) return
    
    // Compter comme une tentative si on change d'assignation
    if (assignments[scenarioId] !== draggedType) {
      setAttempts(prev => prev + 1)
    }
    
    setAssignments(prev => ({
      ...prev,
      [scenarioId]: draggedType
    }))
    setDraggedType(null)
  }

  const checkResults = () => {
    setShowResults(true)
    if (startTime) {
      const time = Math.floor((Date.now() - startTime) / 1000)
      const correct = getScore()
      calculateScore(time, correct)
    }
  }

  const reset = () => {
    setAssignments({})
    setShowResults(false)
    setGameStarted(false)
    setStartTime(null)
    setElapsedTime(0)
    setAttempts(0)
  }

  const getScore = () => {
    let correct = 0
    scenarios.forEach(scenario => {
      if (assignments[scenario.id] === scenario.correctType) {
        correct++
      }
    })
    return correct
  }

  const calculateScore = (time: number, correct: number) => {
    const total = scenarios.length
    
    // Score basé sur :
    // - Précision : nombre de bonnes réponses (max 1000 points)
    // - Temps : moins de temps = meilleur score (max 1000 points)
    // Score total max : 2000 points
    
    const accuracyScore = Math.floor((correct / total) * 1000)
    const timeScore = Math.max(0, 1000 - (time * 5)) // -5 points par seconde
    const totalScore = Math.max(0, Math.floor(accuracyScore + timeScore))

    onScore(totalScore, {
      attempts,
      time,
      total,
      correct
    })
  }

  const getApiColor = (typeId: string) => {
    return apiTypes.find(t => t.id === typeId)?.color || 'bg-gray-400'
  }

  const getApiName = (typeId: string) => {
    return apiTypes.find(t => t.id === typeId)?.name || ''
  }

  // Valeurs par défaut si non fournies
  const defaultApiTypes: ApiType[] = apiTypes.length > 0 ? apiTypes : [
    {
      id: 'rest',
      name: 'REST API',
      color: 'bg-blue-500',
      description: 'Architecture stateless avec ressources HTTP'
    },
    {
      id: 'graphql',
      name: 'GraphQL',
      color: 'bg-pink-500',
      description: 'Requêtes flexibles avec un seul endpoint'
    },
    {
      id: 'websocket',
      name: 'WebSocket',
      color: 'bg-green-500',
      description: 'Communication bidirectionnelle en temps réel'
    },
    {
      id: 'grpc',
      name: 'gRPC',
      color: 'bg-purple-500',
      description: 'RPC haute performance avec Protocol Buffers'
    }
  ]

  const defaultScenarios: Scenario[] = scenarios.length > 0 ? scenarios : [
    {
      id: 1,
      text: 'Application de chat en temps réel',
      correctType: 'websocket',
      explanation: 'WebSocket permet une communication bidirectionnelle instantanée, idéale pour le chat.'
    },
    {
      id: 2,
      text: 'CRUD simple pour un blog',
      correctType: 'rest',
      explanation: 'REST est parfait pour les opérations CRUD standards et simples.'
    },
    {
      id: 3,
      text: 'Application mobile qui doit minimiser la consommation de données',
      correctType: 'graphql',
      explanation: 'GraphQL permet de requêter exactement les données nécessaires, réduisant le transfert.'
    },
    {
      id: 4,
      text: 'Microservices internes nécessitant haute performance',
      correctType: 'grpc',
      explanation: 'gRPC offre de meilleures performances pour la communication entre services.'
    }
  ]

  const finalApiTypes = defaultApiTypes
  const finalScenarios = defaultScenarios

  if (finalApiTypes.length === 0 || finalScenarios.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les types d'API et les scénarios dans l'éditeur.
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
      {gameStarted && !showResults && (
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
              Assignations: <span className="text-blue-600">{Object.keys(assignments).length}/{finalScenarios.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin de jeu */}
      {showResults && (() => {
        const correct = getScore()
        const total = finalScenarios.length
        const accuracyScore = Math.floor((correct / total) * 1000)
        const timeScore = Math.max(0, 1000 - (elapsedTime * 5))
        const finalScore = Math.max(0, Math.floor(accuracyScore + timeScore))
        
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Résultats</h3>
              <p className="text-green-800 mb-4">
                Score : {correct} / {total} en {elapsedTime} secondes
              </p>
            </div>
            
            {/* Détail du score */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">Détail de votre score</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-700">Points de précision :</span>
                  <span className="font-semibold text-blue-600">
                    {accuracyScore} pts ({correct}/{total} = {Math.floor((correct / total) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-gray-700">Points de temps :</span>
                  <span className="font-semibold text-purple-600">
                    {timeScore} pts ({elapsedTime}s × 5 = -{elapsedTime * 5} pts)
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
                onClick={reset}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Recommencer
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
                <strong>Points de précision (max 1000 pts)</strong> : Basé sur le nombre de bonnes réponses.
                <br />
                <span className="text-indigo-600 italic">Exemple : 3/4 correctes = (3/4) × 1000 = 750 points</span>
              </li>
              <li>
                <strong>Points de temps (max 1000 pts)</strong> : Vous perdez 5 points par seconde écoulée.
                <br />
                <span className="text-indigo-600 italic">Exemple : 30 secondes = 1000 - (30 × 5) = 850 points</span>
              </li>
              <li>
                <strong>Score total</strong> = Points de précision + Points de temps
                <br />
                <span className="text-indigo-600 italic">Exemple : 750 + 850 = 1600 points</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-indigo-100 rounded">
              <p className="font-semibold text-indigo-900">💡 Astuce :</p>
              <p className="text-indigo-700">
                Pour maximiser votre score, soyez précis ET rapide ! Chaque seconde compte.
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

      {/* Contenu du jeu */}
      {gameStarted && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Quel type d'API utiliser ?</h1>
            <p className="text-gray-600">Glissez le type d'API approprié pour chaque scénario</p>
          </div>

          {/* Types d'API */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Types d'API disponibles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {finalApiTypes.map(type => (
                <div
                  key={type.id}
                  draggable={!showResults}
                  onDragStart={() => handleDragStart(type.id)}
                  className={`${type.color} text-white p-4 rounded-lg cursor-move hover:opacity-80 transition-opacity shadow-lg ${
                    showResults ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="font-bold text-lg mb-1">{type.name}</div>
                  <div className="text-sm opacity-90">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scénarios */}
          <div className="grid md:grid-cols-2 gap-4">
            {finalScenarios.map(scenario => {
              const isAssigned = assignments[scenario.id]
              const isCorrect = assignments[scenario.id] === scenario.correctType
              
              return (
                <div
                  key={scenario.id}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(scenario.id)}
                  className={`bg-white rounded-xl p-5 shadow-lg transition-all ${
                    !isAssigned ? 'border-2 border-dashed border-gray-300' : ''
                  } ${showResults ? (isCorrect ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400') : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center font-bold">
                      {scenario.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium mb-3">{scenario.text}</p>
                      
                      {isAssigned ? (
                        <div className={`${getApiColor(assignments[scenario.id])} text-white px-4 py-2 rounded-lg inline-flex items-center gap-2`}>
                          {getApiName(assignments[scenario.id])}
                          {showResults && (
                            isCorrect ? 
                              <CheckCircle className="w-5 h-5" /> : 
                              <XCircle className="w-5 h-5" />
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">Déposez un type d'API ici...</div>
                      )}

                      {showResults && (
                        <div className={`mt-3 p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                          {!isCorrect && (
                            <div className="text-sm font-semibold text-red-800 mb-1">
                              ✓ Réponse correcte : {getApiName(scenario.correctType)}
                            </div>
                          )}
                          <div className={`text-sm ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>
                            {scenario.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Boutons d'action */}
          {!showResults && (
            <div className="flex justify-center">
              <button
                onClick={checkResults}
                disabled={Object.keys(assignments).length < finalScenarios.length}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                Vérifier mes réponses
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

