import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Détection de nouvelle version et rechargement automatique (en production uniquement)
if (import.meta.env.PROD) {
  // Vérifier périodiquement si une nouvelle version est disponible
  setInterval(async () => {
    try {
      // Charger index.html avec un timestamp pour bypasser le cache
      const response = await fetch(`/?v=${Date.now()}`, { 
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      // Vérifier si le contenu a changé via le header Last-Modified ou ETag
      const lastModified = response.headers.get('last-modified')
      const etag = response.headers.get('etag')
      const storedLastModified = sessionStorage.getItem('app-last-modified')
      const storedEtag = sessionStorage.getItem('app-etag')
      
      // Si Last-Modified a changé, c'est une nouvelle version
      if (lastModified && storedLastModified && lastModified !== storedLastModified) {
        console.log('Nouvelle version détectée (Last-Modified), rechargement...')
        sessionStorage.setItem('app-last-modified', lastModified)
        window.location.reload()
        return
      }
      
      // Si ETag a changé, c'est une nouvelle version
      if (etag && storedEtag && etag !== storedEtag) {
        console.log('Nouvelle version détectée (ETag), rechargement...')
        sessionStorage.setItem('app-etag', etag)
        window.location.reload()
        return
      }
      
      // Stocker les valeurs si elles n'existent pas encore
      if (lastModified && !storedLastModified) {
        sessionStorage.setItem('app-last-modified', lastModified)
      }
      if (etag && !storedEtag) {
        sessionStorage.setItem('app-etag', etag)
      }
    } catch (error) {
      // Ignorer les erreurs de réseau silencieusement
      console.debug('Erreur lors de la vérification de mise à jour:', error)
    }
  }, 300000) // Vérifier toutes les 5 minutes
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
