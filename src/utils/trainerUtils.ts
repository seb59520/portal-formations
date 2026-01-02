/**
 * Utilitaires pour le dashboard Formateur
 */

/**
 * Formate une date relative (ex: "il y a 2 jours")
 */
export function formatRelativeDate(date: string | null): string {
  if (!date) return 'Jamais';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 7) {
    return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } else if (diffDays > 0) {
    return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'à l\'instant';
  }
}

/**
 * Formate un pourcentage avec 1 décimale
 */
export function formatPercent(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate un score sur 100
 */
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}/100`;
}

/**
 * Formate une durée en minutes
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
}

/**
 * Calcule le nombre de jours depuis une date
 */
export function daysSince(date: string | null): number {
  if (!date) return Infinity;
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si une date est dans les 7 derniers jours
 */
export function isWithin7Days(date: string | null): boolean {
  return daysSince(date) <= 7;
}

/**
 * Obtient une couleur selon un pourcentage (vert/orange/rouge)
 */
export function getPercentColor(percent: number | null): string {
  if (percent === null || percent === undefined) return 'gray';
  if (percent >= 80) return 'green';
  if (percent >= 60) return 'yellow';
  return 'red';
}

/**
 * Obtient une couleur selon un score (vert/orange/rouge)
 */
export function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

/**
 * Formate un nom d'utilisateur (fallback sur email si pas de display_name)
 */
export function formatUserName(displayName: string | null, email: string | null): string {
  return displayName || email || 'Utilisateur inconnu';
}

