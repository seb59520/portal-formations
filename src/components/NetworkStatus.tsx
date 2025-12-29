import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { WifiOff, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

export function NetworkStatus() {
  const { isOnline, wasOffline } = useNetworkStatus()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true)
    } else if (wasOffline) {
      // Afficher un message de reconnexion pendant 3 secondes
      setShowBanner(true)
      const timer = setTimeout(() => {
        setShowBanner(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowBanner(false)
    }
  }, [isOnline, wasOffline])

  if (!showBanner) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-4 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Connexion rétablie</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">Connexion perdue - Vérifiez votre connexion Internet</span>
          </>
        )}
      </div>
    </div>
  )
}

