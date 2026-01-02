import { useEffect } from 'react'

/**
 * Hook pour initialiser les blocs HTML après le rendu
 * S'assure que le HTML est bien interprété même si addNodeView n'est pas utilisé
 */
export function useHtmlBlockInit(dependencies: any[] = []) {
  useEffect(() => {
    const initHtmlBlocks = () => {
      // Trouver tous les blocs HTML
      const htmlBlocks = document.querySelectorAll('[data-html-block="true"]')
      
      htmlBlocks.forEach((block) => {
        let contentDiv = block.querySelector('.html-block-content') as HTMLElement
        
        // Si le div de contenu n'existe pas, le créer
        if (!contentDiv) {
          contentDiv = document.createElement('div')
          contentDiv.className = 'html-block-content'
          block.appendChild(contentDiv)
        }
        
        // Récupérer le contenu HTML depuis l'attribut
        const htmlContent = contentDiv.getAttribute('data-html-content') || 
                          block.getAttribute('data-html-content') || ''
        
        // Si on a du contenu et que le div est vide ou ne contient que le placeholder
        if (htmlContent && htmlContent.trim()) {
          const currentContent = contentDiv.innerHTML.trim()
          // Vérifier si le contenu n'est pas déjà rendu
          if (!currentContent || currentContent === '' || currentContent.includes('data-html-content')) {
            try {
              contentDiv.innerHTML = htmlContent
              // Marquer comme rendu
              contentDiv.setAttribute('data-rendered', 'true')
            } catch (error) {
              console.error('Error rendering HTML block:', error)
              contentDiv.textContent = 'Erreur lors du rendu du HTML'
            }
          }
        }
      })
    }

    // Initialiser immédiatement
    initHtmlBlocks()

    // Réinitialiser après un court délai pour s'assurer que le DOM est prêt
    const timeout = setTimeout(initHtmlBlocks, 100)
    
    // Utiliser MutationObserver pour détecter les nouveaux blocs HTML ajoutés
    const observer = new MutationObserver(() => {
      initHtmlBlocks()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, dependencies)
}
