import { useEffect } from 'react'

export function useCarouselInit(deps?: any[]) {
  useEffect(() => {
    // Fonction pour initialiser un carrousel
    const initCarousel = (carousel: Element) => {
      const track = carousel.querySelector('.carousel-track') as HTMLElement
      const prevButton = carousel.querySelector('.carousel-button-prev') as HTMLButtonElement
      const nextButton = carousel.querySelector('.carousel-button-next') as HTMLButtonElement
      const items = carousel.querySelectorAll('.carousel-item')
      
      if (!track || !prevButton || !nextButton || items.length === 0) return
      
      // Vérifier si déjà initialisé
      if (track.hasAttribute('data-initialized')) return
      
      let currentIndex = 0
      track.setAttribute('data-current', '0')
      track.setAttribute('data-initialized', 'true')
      track.style.transform = 'translateX(0%)'
      
      const updateCarousel = () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`
        track.setAttribute('data-current', currentIndex.toString())
      }
      
      const goToPrevious = () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        updateCarousel()
      }
      
      const goToNext = () => {
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        updateCarousel()
      }
      
      // Supprimer les anciens event listeners s'ils existent
      const newPrevButton = prevButton.cloneNode(true) as HTMLButtonElement
      const newNextButton = nextButton.cloneNode(true) as HTMLButtonElement
      prevButton.parentNode?.replaceChild(newPrevButton, prevButton)
      nextButton.parentNode?.replaceChild(newNextButton, nextButton)
      
      newPrevButton.addEventListener('click', goToPrevious)
      newNextButton.addEventListener('click', goToNext)
    }
    
    // Initialiser tous les carrousels dans le document
    const carousels = document.querySelectorAll('[data-carousel="true"]')
    carousels.forEach(initCarousel)
    
    // Utiliser MutationObserver pour détecter les nouveaux carrousels ajoutés dynamiquement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (element.hasAttribute('data-carousel')) {
              initCarousel(element)
            }
            // Vérifier aussi les enfants
            const childCarousels = element.querySelectorAll('[data-carousel="true"]')
            childCarousels.forEach(initCarousel)
          }
        })
      })
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
    
    return () => {
      observer.disconnect()
    }
  }, deps || [])
}

