import { extractGameContent, gameRegistry, type BaseGameProps } from '../lib/gameRegistry'
import { GameErrorBoundary } from './GameErrorBoundary'

interface GameRendererProps {
  gameContent: any
  onScore?: (score: number, metadata?: any) => void
}

/**
 * Composant générique pour rendre n'importe quel jeu enregistré dans le registre
 * 
 * Ce composant :
 * 1. Extrait et normalise le game_content
 * 2. Trouve le jeu correspondant dans le registre
 * 3. Valide la configuration si une fonction de validation existe
 * 4. Rend le composant du jeu avec les props appropriées
 */
export function GameRenderer({ gameContent, onScore }: GameRendererProps) {
  // Extraire le game_content réel (gère les cas imbriqués)
  const actualGameContent = extractGameContent(gameContent)

  if (!actualGameContent) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium mb-2">⚠️ Jeu non configuré</p>
        <p className="text-yellow-700 text-sm mb-2">
          Le champ game_content est vide ou invalide. Il doit contenir un objet avec un champ "gameType".
        </p>
        <details className="mt-3">
          <summary className="text-sm text-yellow-700 cursor-pointer">Détails techniques</summary>
          <pre className="text-xs bg-yellow-100 p-3 rounded overflow-auto mt-2">
            {JSON.stringify({ 
              gameContent, 
              actualGameContent,
              hasGameContent: !!gameContent 
            }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  const gameType = actualGameContent.gameType

  // Vérifier si le jeu est enregistré
  const registeredGame = gameRegistry.get(gameType)

  if (!registeredGame) {
    const availableGames = gameRegistry.getGameTypes().join(', ')
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">❌ Type de jeu non reconnu</p>
        <p className="text-red-700 text-sm mb-2">
          Le type de jeu "<strong>{gameType}</strong>" n'est pas pris en charge.
        </p>
        <p className="text-red-600 text-sm mb-2">
          Types de jeux disponibles : <strong>{availableGames || 'aucun'}</strong>
        </p>
        <details className="mt-3">
          <summary className="text-sm text-red-700 cursor-pointer">Détails techniques</summary>
          <pre className="text-xs bg-red-100 p-3 rounded overflow-auto mt-2">
            {JSON.stringify({ 
              gameType,
              actualGameContent,
              availableGames: gameRegistry.getGameTypes()
            }, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  // Valider la configuration si une fonction de validation existe
  if (registeredGame.validateConfig && !registeredGame.validateConfig(actualGameContent)) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-orange-800 font-medium mb-2">⚠️ Configuration invalide</p>
        <p className="text-orange-700 text-sm mb-2">
          La configuration du jeu "<strong>{registeredGame.name}</strong>" est invalide.
        </p>
        <p className="text-orange-600 text-sm">
          Vérifiez que tous les champs requis sont présents et correctement formatés.
        </p>
        <details className="mt-3">
          <summary className="text-sm text-orange-700 cursor-pointer">Configuration reçue</summary>
          <pre className="text-xs bg-orange-100 p-3 rounded overflow-auto mt-2">
            {JSON.stringify(actualGameContent, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  // Rendre le composant du jeu
  const GameComponent = registeredGame.component

  // Préparer les props communes
  const commonProps: BaseGameProps = {
    onScore,
    description: actualGameContent.description,
    instructions: actualGameContent.instructions
  }

  // Extraire les props spécifiques au jeu (tout sauf gameType, description, instructions)
  const { gameType: _, description: __, instructions: ___, ...gameSpecificProps } = actualGameContent

  // Fusionner les props communes avec les props spécifiques
  const gameProps = {
    ...commonProps,
    ...gameSpecificProps
  }

  // Debug: log des props pour le débogage
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GameRenderer] Rendering game "${gameType}" with props:`, {
      gameType,
      hasDescription: !!gameProps.description,
      hasInstructions: !!gameProps.instructions,
      specificProps: Object.keys(gameSpecificProps),
      allProps: Object.keys(gameProps),
      actualGameContent: actualGameContent,
      fileTypes: actualGameContent.fileTypes ? `Array(${actualGameContent.fileTypes.length})` : 'undefined',
      examples: actualGameContent.examples ? `Array(${actualGameContent.examples.length})` : 'undefined'
    })
  }

  // Rendre le composant avec Error Boundary pour capturer les erreurs React
  return (
    <GameErrorBoundary>
      <GameComponent {...gameProps} />
    </GameErrorBoundary>
  )
}

