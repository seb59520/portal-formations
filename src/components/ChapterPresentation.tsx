import { useEffect, useState } from 'react'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { useUserSettings } from '../hooks/useUserSettings'
import { X, ChevronLeft, ChevronRight, Maximize2, Settings } from 'lucide-react'

interface ChapterPresentationProps {
  chapters: Chapter[]
  initialIndex: number
  onClose: () => void
}

export function ChapterPresentation({ chapters, initialIndex, onClose }: ChapterPresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateLayoutPreferences } = useUserSettings()

  // Valeurs par défaut pour les tailles
  const defaultTitleSize = 100 // %
  const defaultTextSize = 100 // %

  // Récupérer les tailles sauvegardées ou utiliser les valeurs par défaut
  const titleSize = settings?.layout_preferences?.presentationTitleSize ?? defaultTitleSize
  const textSize = settings?.layout_preferences?.presentationTextSize ?? defaultTextSize

  const currentChapter = chapters[currentIndex]

  const handleTitleSizeChange = (value: number) => {
    // Mise à jour immédiate
    setTitleSizeLocal(value)
    // Sauvegarder en arrière-plan
    updateLayoutPreferences({ presentationTitleSize: value }).catch(console.error)
  }

  const handleTextSizeChange = (value: number) => {
    // Mise à jour immédiate
    setTextSizeLocal(value)
    // Sauvegarder en arrière-plan
    updateLayoutPreferences({ presentationTextSize: value }).catch(console.error)
  }

  // États locaux pour une mise à jour immédiate
  const [titleSizeLocal, setTitleSizeLocal] = useState(titleSize)
  const [textSizeLocal, setTextSizeLocal] = useState(textSize)

  // Synchroniser avec les settings quand ils changent
  useEffect(() => {
    if (settings?.layout_preferences?.presentationTitleSize) {
      setTitleSizeLocal(settings.layout_preferences.presentationTitleSize)
    }
    if (settings?.layout_preferences?.presentationTextSize) {
      setTextSizeLocal(settings.layout_preferences.presentationTextSize)
    }
  }, [settings])

  // Appliquer les styles directement au DOM
  useEffect(() => {
    const applyStyles = () => {
      console.log('Applying styles - titleSize:', titleSizeLocal, 'textSize:', textSizeLocal)
      
      // Appliquer la taille du texte avec transform scale
      const proseMirror = document.querySelector('.chapter-presentation-content .ProseMirror') as HTMLElement
      if (proseMirror) {
        const zoomFactor = textSizeLocal / 100
        console.log('Applying text zoom factor:', zoomFactor)
        proseMirror.style.setProperty('transform', `scale(${zoomFactor})`, 'important')
        proseMirror.style.setProperty('transform-origin', 'top left', 'important')
      } else {
        console.warn('ProseMirror element not found')
      }

      // Appliquer la taille du titre - utiliser une taille de base fixe
      const titleEl = document.querySelector('.presentation-title') as HTMLElement
      if (titleEl) {
        // Taille de base responsive (en px)
        const viewportWidth = window.innerWidth
        let baseSize = 24 // mobile
        
        if (viewportWidth >= 1280) baseSize = 60 // xl
        else if (viewportWidth >= 1024) baseSize = 48 // lg  
        else if (viewportWidth >= 768) baseSize = 36 // md
        else if (viewportWidth >= 640) baseSize = 30 // sm
        
        const newSize = (baseSize * titleSizeLocal) / 100
        console.log('Applying title size:', newSize, 'px (base:', baseSize, 'factor:', titleSizeLocal, '%)')
        titleEl.style.setProperty('font-size', `${newSize}px`, 'important')
      } else {
        console.warn('Title element not found')
      }
    }

    // Appliquer immédiatement et avec des délais
    applyStyles()
    const timeouts = [
      setTimeout(applyStyles, 50),
      setTimeout(applyStyles, 200),
      setTimeout(applyStyles, 500)
    ]
    
    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [textSizeLocal, titleSizeLocal, currentIndex])

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevious()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  // Gestion du plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? chapters.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === chapters.length - 1 ? 0 : prev + 1))
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  if (!currentChapter) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      {/* Contrôles en haut */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-2 md:p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fermer"
            title="Fermer (Échap)"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-medium">
            Chapitre {currentIndex + 1} / {chapters.length}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Paramètres"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Plein écran"
            title="Plein écran (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panneau de paramètres */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-4 min-w-[280px] border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Paramètres d'affichage</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Fermer les paramètres"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Taille du titre */}
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Taille du titre: <span className="font-bold text-white">{titleSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={titleSizeLocal}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  console.log('Title size changed to:', val)
                  handleTitleSizeChange(val)
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Taille du texte */}
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Taille du texte: <span className="font-bold text-white">{textSizeLocal}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={textSizeLocal}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  console.log('Text size changed to:', val)
                  handleTextSizeChange(val)
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div 
        className="h-full flex items-start justify-center pt-20 pb-2 px-4 md:px-6 lg:px-8 overflow-y-auto"
        style={{
          '--title-size': `${titleSizeLocal}%`,
          '--text-size': `${textSizeLocal}%`
        } as React.CSSProperties & { '--title-size': string; '--text-size': string }}
      >
        <div className="w-full max-w-[96%] sm:max-w-[94%] lg:max-w-[92%] xl:max-w-[88%] mx-auto h-full flex flex-col py-2">
          <h1 
            className="font-extrabold mb-4 md:mb-5 text-center chapter-title-highlight flex-shrink-0 px-2 break-words hyphens-auto presentation-title"
            style={{ 
              fontSize: `calc(${titleSizeLocal}% * clamp(1.5rem, 4vw, 3.75rem))`,
              '--title-size': `${titleSizeLocal}%`
            } as React.CSSProperties & { '--title-size': string }}
            ref={(el) => {
              if (el) {
                const baseSize = window.getComputedStyle(el).fontSize
                const baseSizeValue = parseFloat(baseSize) || 48
                const newSize = (baseSizeValue * titleSizeLocal) / 100
                el.style.setProperty('font-size', `${newSize}px`, 'important')
              }
            }}
          >
            {currentChapter.title}
          </h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-5 lg:p-6 flex-1 min-h-0 overflow-y-auto">
            {currentChapter.content ? (
              <div 
                className="chapter-presentation-content prose prose-invert max-w-none presentation-text"
                style={{ 
                  fontSize: `var(--text-size)`
                }}
              >
                <RichTextEditor
                  content={currentChapter.content}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            ) : (
              <p className="text-gray-400 italic text-center text-lg md:text-xl lg:text-2xl">
                Ce chapitre n'a pas encore de contenu.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {chapters.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-lg hover:bg-white/20 transition-colors z-10"
            aria-label="Chapitre précédent"
            title="Précédent (← ou ↑)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-lg hover:bg-white/20 transition-colors z-10"
            aria-label="Chapitre suivant"
            title="Suivant (→ ou ↓)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Indicateurs en bas */}
      {chapters.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-3">
          <div className="flex justify-center space-x-2">
            {chapters.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 w-2 hover:bg-white/60'
                }`}
                aria-label={`Aller au chapitre ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60 hidden md:block">
        <div className="space-y-1">
          <div>← → Navigation</div>
          <div>F Plein écran</div>
          <div>Échap Quitter</div>
        </div>
      </div>
    </div>
  )
}

