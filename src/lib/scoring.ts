// Utilitaires pour le calcul du score et des badges

export interface ScoreResult {
  score: number
  total: number
  percentage: number
  badge: string | null
}

/**
 * Calcule le score, le pourcentage et attribue un badge
 * @param score Nombre de bonnes réponses
 * @param total Nombre total de questions
 * @returns ScoreResult avec score, total, percentage et badge
 */
export function calculateScore(score: number, total: number): ScoreResult {
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      percentage: 0,
      badge: null
    }
  }

  const percentage = Math.round((score / total) * 100)

  let badge: string | null = null
  if (percentage >= 90) {
    badge = '🥇 Or'
  } else if (percentage >= 75) {
    badge = '🥈 Argent'
  } else if (percentage >= 60) {
    badge = '🥉 Bronze'
  }

  return {
    score,
    total,
    percentage,
    badge
  }
}

/**
 * Valide une réponse selon le type de question
 * @param userAnswer Réponse de l'utilisateur
 * @param correctAnswer Réponse correcte
 * @param questionType Type de question
 * @returns true si la réponse est correcte
 */
export function validateAnswer(
  userAnswer: string | boolean,
  correctAnswer: string | boolean,
  questionType: string
): boolean {
  // Pour les questions de type json-valid, comparer les booléens
  if (questionType === 'json-valid') {
    return userAnswer === correctAnswer
  }

  // Pour les questions fix-json-editor, comparer les strings normalisées
  if (questionType === 'fix-json-editor') {
    const normalize = (str: string) => str.trim().replace(/\s+/g, ' ')
    return normalize(String(userAnswer)) === normalize(String(correctAnswer))
  }

  // Pour les autres types, comparer les strings (case-insensitive)
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
}

/**
 * Valide un JSON en utilisant JSON.parse
 * @param jsonString String JSON à valider
 * @returns true si le JSON est valide, false sinon
 */
export function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString)
    return true
  } catch (error) {
    return false
  }
}

