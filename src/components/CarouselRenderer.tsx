import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselItem {
  type: 'text' | 'image' | 'video' | 'content'
  content: string
  title?: string
  imageUrl?: string
  videoUrl?: string
}

interface CarouselRendererProps {
  items: CarouselItem[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function CarouselRenderer({ 
  items, 
  autoPlay = false, 
  autoPlayInterval = 5000 
}: CarouselRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  if (!items || items.length === 0) {
    return null
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }, [items.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused || items.length <= 1) return

    const interval = setInterval(() => {
      goToNext()
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, isPaused, items.length, goToNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  return (
    <div 
      className="carousel-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-container">
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="carousel-button carousel-button-prev"
              aria-label="Slide précédente"
              type="button"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            
            <button
              onClick={goToNext}
              className="carousel-button carousel-button-next"
              aria-label="Slide suivante"
              type="button"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </>
        )}
        
        <div 
          className="carousel-track" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          role="region"
          aria-label="Carrousel"
        >
          {items.map((item, index) => (
            <div 
              key={index} 
              className="carousel-item"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} sur ${items.length}`}
            >
              {item.type === 'image' && item.imageUrl ? (
                <div className="carousel-item-image">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title || `Image ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  {item.title && (
                    <div className="carousel-item-content">
                      <h3 className="carousel-item-title">{item.title}</h3>
                    </div>
                  )}
                </div>
              ) : item.type === 'video' && item.videoUrl ? (
                <div className="carousel-item-video">
                  <iframe
                    src={item.videoUrl}
                    frameBorder="0"
                    allowFullScreen
                    title={item.title || `Vidéo ${index + 1}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  {item.title && (
                    <div className="carousel-item-content">
                      <h3 className="carousel-item-title">{item.title}</h3>
                    </div>
                  )}
                </div>
              ) : (
                <div className="carousel-item-content">
                  {item.title && <h3 className="carousel-item-title">{item.title}</h3>}
                  <div 
                    className="carousel-item-body prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs de pagination */}
      {items.length > 1 && (
        <div className="carousel-indicators" role="tablist" aria-label="Indicateurs de pagination">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Aller à la slide ${index + 1}`}
              aria-selected={index === currentIndex}
              role="tab"
              type="button"
            />
          ))}
        </div>
      )}

      {/* Compteur de slides */}
      {items.length > 1 && (
        <div className="carousel-counter">
          <span className="carousel-counter-text">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      )}
    </div>
  )
}

