import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock, FileJson } from 'lucide-react'
import { BaseGameProps } from '../lib/gameRegistry'

interface JsonFileType {
  id: string
  name: string
  description: string
  icon?: string
  color: string
}

interface JsonFileExample {
  id: number
  content: string
  correctType: string
  explanation: string
  context?: string
}

interface JsonFileTypesGameProps extends BaseGameProps {
  fileTypes?: JsonFileType[]
  examples?: JsonFileExample[]
}

export function JsonFileTypesGame({ 
  fileTypes = [], 
  examples = [], 
  onScore, 
  description 
}: JsonFileTypesGameProps) {
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [draggedType, setDraggedType] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [selectedExample, setSelectedExample] = useState<number | null>(null)

  // Timer
  useEffect(() => {
    if (!gameStarted || !startTime || showResults) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, startTime, showResults])

  // Types de fichiers par défaut
  const defaultFileTypes: JsonFileType[] = fileTypes.length > 0 ? fileTypes : [
    {
      id: 'package.json',
      name: 'package.json',
      description: 'Gestion des dépendances et scripts npm',
      color: 'bg-red-500'
    },
    {
      id: 'tsconfig.json',
      name: 'tsconfig.json',
      description: 'Configuration TypeScript',
      color: 'bg-blue-500'
    },
    {
      id: 'eslintrc.json',
      name: '.eslintrc.json',
      description: 'Configuration ESLint',
      color: 'bg-purple-500'
    },
    {
      id: 'package-lock.json',
      name: 'package-lock.json',
      description: 'Verrouillage des versions npm',
      color: 'bg-orange-500'
    },
    {
      id: 'tsconfig.node.json',
      name: 'tsconfig.node.json',
      description: 'Configuration TypeScript pour Node.js',
      color: 'bg-cyan-500'
    },
    {
      id: 'vite.config.json',
      name: 'vite.config.json',
      description: 'Configuration Vite',
      color: 'bg-green-500'
    },
    {
      id: 'tailwind.config.json',
      name: 'tailwind.config.json',
      description: 'Configuration Tailwind CSS',
      color: 'bg-teal-500'
    },
    {
      id: 'netlify.toml',
      name: 'netlify.toml',
      description: 'Configuration Netlify (peut être JSON)',
      color: 'bg-pink-500'
    }
  ]

  // Exemples par défaut
  const defaultExamples: JsonFileExample[] = examples.length > 0 ? examples : [
    {
      id: 1,
      content: '{\n  "name": "mon-projet",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite"\n  },\n  "dependencies": {\n    "react": "^18.0.0"\n  }\n}',
      correctType: 'package.json',
      explanation: 'Ce fichier contient les métadonnées du projet (name, version), les scripts et les dépendances. C\'est un package.json.',
      context: 'Fichier à la racine d\'un projet Node.js'
    },
    {
      id: 2,
      content: '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "ESNext",\n    "strict": true\n  },\n  "include": ["src"]\n}',
      correctType: 'tsconfig.json',
      explanation: 'Ce fichier configure le compilateur TypeScript avec les options du compilateur et les fichiers à inclure. C\'est un tsconfig.json.',
      context: 'Fichier de configuration TypeScript'
    },
    {
      id: 3,
      content: '{\n  "extends": ["eslint:recommended"],\n  "rules": {\n    "no-console": "warn"\n  },\n  "env": {\n    "browser": true\n  }\n}',
      correctType: 'eslintrc.json',
      explanation: 'Ce fichier configure ESLint avec des règles et un environnement. C\'est un .eslintrc.json.',
      context: 'Fichier de configuration du linter'
    },
    {
      id: 4,
      content: '{\n  "name": "mon-projet",\n  "lockfileVersion": 3,\n  "packages": {\n    "": {\n      "name": "mon-projet",\n      "version": "1.0.0"\n    }\n  }\n}',
      correctType: 'package-lock.json',
      explanation: 'Ce fichier verrouille les versions exactes des dépendances installées. C\'est un package-lock.json.',
      context: 'Généré automatiquement par npm'
    },
    {
      id: 5,
      content: '{\n  "compilerOptions": {\n    "composite": true,\n    "module": "CommonJS"\n  },\n  "include": ["vite.config.ts"]\n}',
      correctType: 'tsconfig.node.json',
      explanation: 'Configuration TypeScript spécifique pour les fichiers Node.js (comme vite.config.ts). C\'est un tsconfig.node.json.',
      context: 'Configuration TypeScript pour Node.js'
    },
    {
      id: 6,
      content: '{\n  "build": {\n    "command": "npm run build",\n    "publish": "dist"\n  },\n  "redirects": [\n    { "from": "/*", "to": "/index.html" }\n  ]\n}',
      correctType: 'netlify.toml',
      explanation: 'Configuration pour le déploiement Netlify avec commandes de build et redirections. C\'est un netlify.toml (peut être en JSON).',
      context: 'Fichier de configuration de déploiement'
    }
  ]

  const finalFileTypes = defaultFileTypes
  const finalExamples = defaultExamples

  const startGame = () => {
    setGameStarted(true)
    setStartTime(Date.now())
    setElapsedTime(0)
    setAttempts(0)
    setAssignments({})
    setShowResults(false)
    setSelectedExample(null)
  }

  const handleDragStart = (typeId: string) => {
    if (!gameStarted || showResults) return
    setDraggedType(typeId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (exampleId: number) => {
    if (!gameStarted || showResults || !draggedType) return
    
    if (assignments[exampleId] !== draggedType) {
      setAttempts(prev => prev + 1)
    }
    
    setAssignments(prev => ({
      ...prev,
      [exampleId]: draggedType
    }))
    setDraggedType(null)
  }

  const checkResults = () => {
    setShowResults(true)
    if (startTime && onScore) {
      const time = Math.floor((Date.now() - startTime) / 1000)
      const correct = getScore()
      const total = finalExamples.length
      
      // Score basé sur précision et temps
      const accuracyScore = Math.floor((correct / total) * 1000)
      const timeScore = Math.max(0, 1000 - (time * 5))
      const totalScore = Math.max(0, Math.floor(accuracyScore + timeScore))
      
      onScore(totalScore, {
        attempts,
        time,
        total,
        correct
      })
    }
  }

  const reset = () => {
    setAssignments({})
    setShowResults(false)
    setGameStarted(false)
    setStartTime(null)
    setElapsedTime(0)
    setAttempts(0)
    setSelectedExample(null)
  }

  const getScore = () => {
    let correct = 0
    finalExamples.forEach(example => {
      if (assignments[example.id] === example.correctType) {
        correct++
      }
    })
    return correct
  }

  const getFileTypeColor = (typeId: string) => {
    return finalFileTypes.find(t => t.id === typeId)?.color || 'bg-gray-400'
  }

  const getFileTypeName = (typeId: string) => {
    return finalFileTypes.find(t => t.id === typeId)?.name || ''
  }

  const getFileTypeDescription = (typeId: string) => {
    return finalFileTypes.find(t => t.id === typeId)?.description || ''
  }

  if (finalFileTypes.length === 0 || finalExamples.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Configuration incomplète. Veuillez configurer les types de fichiers et les exemples dans l'éditeur.
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
            <FileJson className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Assignations: <span className="text-blue-600">{Object.keys(assignments).length}/{finalExamples.length}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message de fin de jeu */}
      {showResults && (() => {
        const correct = getScore()
        const total = finalExamples.length
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
              </li>
              <li>
                <strong>Points de temps (max 1000 pts)</strong> : Vous perdez 5 points par seconde écoulée.
              </li>
              <li>
                <strong>Score total</strong> = Points de précision + Points de temps
              </li>
            </ul>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Types de fichiers JSON</h1>
            <p className="text-gray-600">Glissez le type de fichier approprié pour chaque exemple</p>
          </div>

          {/* Types de fichiers disponibles */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Types de fichiers disponibles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {finalFileTypes.map(type => (
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

          {/* Exemples de fichiers */}
          <div className="grid md:grid-cols-2 gap-4">
            {finalExamples.map(example => {
              const isAssigned = assignments[example.id]
              const isCorrect = assignments[example.id] === example.correctType
              
              return (
                <div
                  key={example.id}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(example.id)}
                  className={`bg-white rounded-xl p-5 shadow-lg transition-all ${
                    !isAssigned ? 'border-2 border-dashed border-gray-300' : ''
                  } ${showResults ? (isCorrect ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400') : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center font-bold">
                      {example.id}
                    </div>
                    <div className="flex-1">
                      {example.context && (
                        <p className="text-xs text-gray-500 mb-2 italic">{example.context}</p>
                      )}
                      
                      <div className="mb-3">
                        <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                          <code>{example.content}</code>
                        </pre>
                      </div>
                      
                      {isAssigned ? (
                        <div className={`${getFileTypeColor(assignments[example.id])} text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 mb-3`}>
                          {getFileTypeName(assignments[example.id])}
                          {showResults && (
                            isCorrect ? 
                              <CheckCircle className="w-5 h-5" /> : 
                              <XCircle className="w-5 h-5" />
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic mb-3">Déposez un type de fichier ici...</div>
                      )}

                      {showResults && (
                        <div className={`mt-3 p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                          {!isCorrect && (
                            <div className="text-sm font-semibold text-red-800 mb-1">
                              ✓ Réponse correcte : {getFileTypeName(example.correctType)}
                            </div>
                          )}
                          <div className={`text-sm ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>
                            {example.explanation}
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
                disabled={Object.keys(assignments).length < finalExamples.length}
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

