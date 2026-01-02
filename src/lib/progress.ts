// Utilitaires pour sauvegarder et récupérer la progression du jeu dans Supabase

import { supabase } from './supabaseClient'
import type { ScoreResult } from './scoring'

export interface GameAttempt {
  id?: string
  user_id: string
  game_type: string
  level: number
  score: number
  total: number
  percentage: number
  badge: string | null
  wrong_ids: string[]
  created_at?: string
}

export interface GameProgress {
  id?: string
  user_id: string
  game_type: string
  level: number
  best_score: number | null
  best_badge: string | null
  last_score: number | null
  last_badge: string | null
  updated_at?: string
}

/**
 * Sauvegarde une tentative de jeu
 * @param attempt Données de la tentative
 * @returns L'ID de la tentative créée
 */
export async function saveGameAttempt(attempt: Omit<GameAttempt, 'id' | 'created_at'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('game_attempts')
      .insert([attempt])
      .select('id')
      .single()

    if (error) {
      console.error('Error saving game attempt:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error saving game attempt:', error)
    return null
  }
}

/**
 * Met à jour ou crée la progression d'un niveau
 * @param progress Données de progression
 * @returns true si la sauvegarde a réussi
 */
export async function saveGameProgress(progress: Omit<GameProgress, 'id' | 'updated_at'>): Promise<boolean> {
  try {
    // Vérifier si une progression existe déjà
    const { data: existing } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', progress.user_id)
      .eq('game_type', progress.game_type)
      .eq('level', progress.level)
      .single()

    if (existing) {
      // Mettre à jour la progression existante
      const updateData: Partial<GameProgress> = {
        last_score: progress.last_score,
        last_badge: progress.last_badge
      }

      // Mettre à jour le meilleur score si nécessaire
      if (progress.best_score !== null && (existing.best_score === null || progress.best_score > existing.best_score)) {
        updateData.best_score = progress.best_score
        updateData.best_badge = progress.best_badge
      }

      const { error } = await supabase
        .from('game_progress')
        .update(updateData)
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating game progress:', error)
        return false
      }
    } else {
      // Créer une nouvelle progression
      const { error } = await supabase
        .from('game_progress')
        .insert([progress])

      if (error) {
        console.error('Error creating game progress:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error saving game progress:', error)
    return false
  }
}

/**
 * Récupère la progression d'un utilisateur pour un niveau donné
 * @param userId ID de l'utilisateur
 * @param gameType Type de jeu
 * @param level Niveau
 * @returns La progression ou null
 */
export async function getGameProgress(
  userId: string,
  gameType: string,
  level: number
): Promise<GameProgress | null> {
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .eq('level', level)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune progression trouvée
        return null
      }
      console.error('Error fetching game progress:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching game progress:', error)
    return null
  }
}

/**
 * Récupère toutes les tentatives d'un utilisateur pour un niveau
 * @param userId ID de l'utilisateur
 * @param gameType Type de jeu
 * @param level Niveau
 * @returns Liste des tentatives
 */
export async function getGameAttempts(
  userId: string,
  gameType: string,
  level: number
): Promise<GameAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('game_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .eq('level', level)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching game attempts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching game attempts:', error)
    return []
  }
}

/**
 * Sauvegarde complète : tentative + progression
 * @param userId ID de l'utilisateur
 * @param gameType Type de jeu
 * @param level Niveau
 * @param scoreResult Résultat du score
 * @param wrongIds IDs des questions ratées
 * @returns true si la sauvegarde a réussi
 */
export async function saveCompleteProgress(
  userId: string,
  gameType: string,
  level: number,
  scoreResult: ScoreResult,
  wrongIds: string[]
): Promise<boolean> {
  // Sauvegarder la tentative
  const attemptId = await saveGameAttempt({
    user_id: userId,
    game_type: gameType,
    level,
    score: scoreResult.score,
    total: scoreResult.total,
    percentage: scoreResult.percentage,
    badge: scoreResult.badge,
    wrong_ids: wrongIds
  })

  if (!attemptId) {
    console.error('Failed to save game attempt')
    return false
  }

  // Récupérer la progression existante pour déterminer le meilleur score
  const existingProgress = await getGameProgress(userId, gameType, level)
  const bestScore = existingProgress?.best_score !== null && existingProgress.best_score! > scoreResult.score
    ? existingProgress.best_score!
    : scoreResult.score
  const bestBadge = existingProgress?.best_score !== null && existingProgress.best_score! > scoreResult.score
    ? existingProgress.best_badge
    : scoreResult.badge

  // Sauvegarder/mettre à jour la progression
  const progressSaved = await saveGameProgress({
    user_id: userId,
    game_type: gameType,
    level,
    best_score: bestScore,
    best_badge: bestBadge,
    last_score: scoreResult.score,
    last_badge: scoreResult.badge
  })

  return progressSaved
}

