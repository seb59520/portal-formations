import { ComponentType } from 'react'
import { CardMatchingGame } from '../components/CardMatchingGame'
import { ColumnMatchingGame } from '../components/ColumnMatchingGame'
import { ApiTypesGame } from '../components/ApiTypesGame'
import { FormatFilesGame } from '../components/FormatFilesGame'
import { JsonFileTypesGame } from '../components/JsonFileTypesGame'

/**
 * Interface pour les props communes à tous les jeux
 */
export interface BaseGameProps {
  onScore?: (score: number, metadata?: any) => void
  description?: string
  instructions?: string
}

/**
 * Type pour les données de configuration d'un jeu
 */
export type GameConfig = {
  gameType: string
  [key: string]: any
}

/**
 * Interface pour un jeu enregistré dans le registre
 */
export interface RegisteredGame {
  /** Type unique du jeu (ex: 'api-types', 'format-files') */
  gameType: string
  /** Nom affiché du jeu */
  name: string
  /** Description du jeu */
  description: string
  /** Composant React du jeu */
  component: ComponentType<any>
  /** Fonction de validation pour vérifier que la config est valide */
  validateConfig?: (config: GameConfig) => boolean
}

/**
 * Registre centralisé des jeux
 */
class GameRegistry {
  private games: Map<string, RegisteredGame> = new Map()

  /**
   * Enregistre un nouveau jeu dans le registre
   */
  register(game: RegisteredGame): void {
    if (this.games.has(game.gameType)) {
      console.warn(`Le jeu "${game.gameType}" est déjà enregistré. Il sera remplacé.`)
    }
    this.games.set(game.gameType, game)
    console.log(`✅ Jeu "${game.name}" (${game.gameType}) enregistré avec succès`)
  }

  /**
   * Récupère un jeu par son type
   */
  get(gameType: string): RegisteredGame | undefined {
    return this.games.get(gameType)
  }

  /**
   * Vérifie si un type de jeu est enregistré
   */
  has(gameType: string): boolean {
    return this.games.has(gameType)
  }

  /**
   * Liste tous les jeux enregistrés
   */
  list(): RegisteredGame[] {
    return Array.from(this.games.values())
  }

  /**
   * Récupère tous les types de jeux disponibles
   */
  getGameTypes(): string[] {
    return Array.from(this.games.keys())
  }
}

// Instance singleton du registre
export const gameRegistry = new GameRegistry()

// Enregistrement des jeux existants
gameRegistry.register({
  gameType: 'matching',
  name: 'Jeu de correspondance (cartes)',
  description: 'Associez les cartes par paires',
  component: CardMatchingGame,
  validateConfig: (config) => {
    return Array.isArray(config.pairs) && config.pairs.length > 0
  }
})

gameRegistry.register({
  gameType: 'column-matching',
  name: 'Jeu de correspondance (colonnes)',
  description: 'Associez les éléments des deux colonnes',
  component: ColumnMatchingGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.leftColumn) &&
      Array.isArray(config.rightColumn) &&
      Array.isArray(config.correctMatches) &&
      config.leftColumn.length > 0 &&
      config.rightColumn.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'api-types',
  name: 'Quel type d\'API utiliser ?',
  description: 'Choisissez le type d\'API approprié pour chaque scénario',
  component: ApiTypesGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.apiTypes) &&
      Array.isArray(config.scenarios) &&
      config.apiTypes.length > 0 &&
      config.scenarios.length > 0
    )
  }
})

gameRegistry.register({
  gameType: 'format-files',
  name: 'Formats de fichiers (JSON/XML/Protobuf)',
  description: 'Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf',
  component: FormatFilesGame,
  validateConfig: (config) => {
    return Array.isArray(config.levels) && config.levels.length > 0
  }
})

gameRegistry.register({
  gameType: 'json-file-types',
  name: 'Types de fichiers JSON',
  description: 'Apprenez à reconnaître les différents types de fichiers JSON (package.json, tsconfig.json, etc.)',
  component: JsonFileTypesGame,
  validateConfig: (config) => {
    return (
      Array.isArray(config.fileTypes) &&
      Array.isArray(config.examples) &&
      config.fileTypes.length > 0 &&
      config.examples.length > 0
    )
  }
})

/**
 * Fonction utilitaire pour extraire le game_content réel
 * (gère les cas où game_content est imbriqué)
 */
export function extractGameContent(gameContent: any): GameConfig | null {
  if (!gameContent) return null

  // Si game_content est une chaîne JSON, la parser
  if (typeof gameContent === 'string') {
    try {
      gameContent = JSON.parse(gameContent)
    } catch (e) {
      console.error('Erreur lors du parsing de game_content:', e)
      return null
    }
  }

  // Si game_content contient un objet avec game_content à l'intérieur (structure imbriquée)
  if (gameContent.game_content && typeof gameContent.game_content === 'object') {
    return extractGameContent(gameContent.game_content)
  }

  // Vérifier que gameType existe
  if (!gameContent.gameType) {
    return null
  }

  return gameContent as GameConfig
}

