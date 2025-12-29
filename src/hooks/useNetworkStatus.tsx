import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored')
      setIsOnline(true)
      setWasOffline(true)
      // Réessayer après 1 seconde pour laisser le temps à la connexion de se stabiliser
      setTimeout(() => {
        setWasOffline(false)
      }, 1000)
    }

    const handleOffline = () => {
      console.warn('Network connection lost')
      setIsOnline(false)
      setWasOffline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}

