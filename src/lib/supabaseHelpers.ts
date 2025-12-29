import { PostgrestError } from '@supabase/supabase-js'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
  retryableErrors: ['network', 'timeout', 'fetch', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
}

/**
 * Vérifie si une erreur est retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = (error.message || '').toLowerCase()
  const errorCode = (error.code || '').toLowerCase()
  
  // Erreurs réseau
  if (DEFAULT_RETRY_OPTIONS.retryableErrors.some(keyword => 
    errorMessage.includes(keyword) || errorCode.includes(keyword)
  )) {
    return true
  }
  
  // Erreurs HTTP 5xx (erreurs serveur)
  if (error.status >= 500 && error.status < 600) {
    return true
  }
  
  // Erreurs HTTP 429 (rate limit)
  if (error.status === 429) {
    return true
  }
  
  return false
}

/**
 * Calcule le délai avant le prochain retry avec backoff exponentiel
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt)
  return Math.min(delay, options.maxDelay)
}

/**
 * Retry une fonction avec backoff exponentiel
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: any = null
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Si ce n'est pas la dernière tentative et que l'erreur est retryable
      if (attempt < opts.maxRetries && isRetryableError(error)) {
        const delay = calculateDelay(attempt, opts)
        console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms:`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Si l'erreur n'est pas retryable ou qu'on a épuisé les tentatives
      throw error
    }
  }
  
  throw lastError
}

/**
 * Vérifie si l'erreur est une erreur d'authentification
 */
export function isAuthError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = (error.message || '').toLowerCase()
  const errorCode = (error.code || '').toLowerCase()
  
  return (
    errorMessage.includes('jwt') ||
    errorMessage.includes('token') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorCode === '401' ||
    error.status === 401
  )
}

/**
 * Vérifie si l'erreur est une erreur de permission
 */
export function isPermissionError(error: any): boolean {
  if (!error) return false
  
  const errorCode = (error.code || '').toLowerCase()
  return errorCode === '42501' || errorCode === 'pgrst116'
}

/**
 * Crée un timeout pour une promesse
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

