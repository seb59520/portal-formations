import { useState, useEffect } from 'react'
import { RotateCcw, Trophy, Clock } from 'lucide-react'

interface Card {
  id: string
  text: string
  pairId: string
  flipped: boolean
  matched: boolean
}

interface CardMatchingGameProps {
  pairs: Array<{ term: string; definition: string }>
  onScore: (score: number, metadata: { attempts: number; time: number; pairs: number }) => void
  description?: string
}

export function CardMatchingGame({ pairs, onScore, description }: CardMatchingGameProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [attempts, setAttempts] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Initialiser le jeu
  useEffect(() => {
    if (pairs.length === 0) return

    const newCards: Card[] = []
    
    // Créer les cartes pour chaque paire
    pairs.forEach((pair, index) => {
      const pairId = `pair-${index}`
      // Carte terme
      newCards.push({
        id: `term-${index}`,
        text: pair.term,
        pairId,
        flipped: false,
        matched: false
      })
      // Carte définition
      newCards.push({
        id: `def-${index}`,
        text: pair.definition,
        pairId,
        flipped: false,
        matched: false
      })
    })

    // Mélanger les cartes
    const shuffled = newCards.sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [pairs])

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
    setMatchedPairs(0)
    setGameFinished(false)
    setFlippedCards([])
    // Réinitialiser les cartes
    setCards(prev => prev.map(card => ({ ...card, flipped: false, matched: false })))
  }

  const handleCardClick = (cardId: string) => {
    if (!gameStarted || gameFinished) return
    if (flippedCards.length >= 2) return

    const card = cards.find(c => c.id === cardId)
    if (!card || card.flipped || card.matched) return

    // Retourner la carte
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    ))

    const newFlippedCards = [...flippedCards, cardId]

    if (newFlippedCards.length === 2) {
      // Deux cartes retournées, vérifier si elles correspondent
      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find(c => c.id === firstId)
      const secondCard = cards.find(c => c.id === secondId)

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match trouvé !
        setCards(prev => prev.map(c => 
          c.pairId === firstCard.pairId ? { ...c, matched: true, flipped: true } : c
        ))
        setMatchedPairs(prev => prev + 1)
        setFlippedCards([])
      } else {
        // Pas de match, retourner les cartes après un délai
        setAttempts(prev => prev + 1)
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            newFlippedCards.includes(c.id) && !c.matched 
              ? { ...c, flipped: false } 
              : c
          ))
          setFlippedCards([])
        }, 1000)
      }
    } else {
      setFlippedCards(newFlippedCards)
    }
  }

  // Vérifier si le jeu est terminé
  useEffect(() => {
    if (matchedPairs === pairs.length && pairs.length > 0 && gameStarted) {
      setGameFinished(true)
      calculateScore()
    }
  }, [matchedPairs, pairs.length, gameStarted])

  const calculateScore = () => {
    if (!startTime) return

    const time = Math.floor((Date.now() - startTime) / 1000)
    const totalPairs = pairs.length
    
    // Score basé sur :
    // - Temps : moins de temps = meilleur score (max 1000 points pour le temps)
    // - Tentatives : moins de tentatives = meilleur score (max 1000 points pour les tentatives)
    // Score total max : 2000 points
    
    const timeScore = Math.max(0, 1000 - (time * 10)) // -10 points par seconde
    const attemptsScore = Math.max(0, 1000 - (attempts * 50)) // -50 points par tentative
    const totalScore = Math.max(0, Math.floor(timeScore + attemptsScore))

    onScore(totalScore, {
      attempts,
      time,
      pairs: totalPairs
    })
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameFinished(false)
    setFlippedCards([])
    setMatchedPairs(0)
    setAttempts(0)
    setElapsedTime(0)
    setStartTime(null)
    // Réinitialiser les cartes
    setCards(prev => prev.map(card => ({ ...card, flipped: false, matched: false })))
  }

  if (pairs.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Aucune paire de cartes configurée. Veuillez configurer le jeu dans l'éditeur.
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
              Paires: <span className="text-blue-600">{matchedPairs}/{pairs.length}</span>
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
            Vous avez trouvé toutes les paires en {elapsedTime} secondes avec {attempts} tentatives.
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

      {/* Grille de cartes */}
      {gameStarted && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched || flippedCards.length >= 2}
              className={`
                aspect-square rounded-lg p-4 font-medium text-sm transition-all duration-300
                ${card.matched 
                  ? 'bg-green-200 text-green-900 cursor-default' 
                  : card.flipped
                  ? 'bg-blue-100 text-blue-900 shadow-md transform scale-105'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 shadow'
                }
                ${!card.matched && !card.flipped ? 'hover:scale-105' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {card.flipped || card.matched ? (
                <div className="h-full flex items-center justify-center text-center">
                  {card.text}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-2xl">?</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

