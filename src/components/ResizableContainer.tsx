import { useState, useEffect, useRef, useCallback } from 'react'
import { GripVertical } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings'

interface ResizableContainerProps {
  children: React.ReactNode
  storageKey?: string
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
}

export function ResizableContainer({ 
  children, 
  storageKey = 'course-container-width',
  minWidth = 50,
  maxWidth = 100,
  defaultWidth = 95
}: ResizableContainerProps) {
  const { settings, updateLayoutPreferences } = useUserSettings()
  const [width, setWidth] = useState<number>(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeSideRef = useRef<'left' | 'right' | null>(null)

  // Charger la largeur sauvegardée au montage
  useEffect(() => {
    if (settings?.layout_preferences?.[storageKey]) {
      const savedWidth = Number(settings.layout_preferences[storageKey])
      if (savedWidth >= minWidth && savedWidth <= maxWidth) {
        setWidth(savedWidth)
      }
    }
  }, [settings, storageKey, minWidth, maxWidth])

  // Gérer le redimensionnement
  const handleMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    resizeSideRef.current = side
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const parent = containerRef.current.parentElement
    if (!parent) return

    const parentRect = parent.getBoundingClientRect()
    const parentWidth = parent.clientWidth || window.innerWidth
    
    // Calculer la nouvelle largeur en pourcentage basé sur la position de la souris
    // La position de la souris par rapport au parent nous donne la nouvelle largeur
    const mouseX = e.clientX - parentRect.left
    let newWidth = (mouseX / parentWidth) * 100

    // Limiter entre minWidth et maxWidth
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(newWidth)
  }, [isResizing, minWidth, maxWidth])

  const handleMouseUp = useCallback(async () => {
    if (isResizing) {
      setIsResizing(false)
      resizeSideRef.current = null
      // Sauvegarder la préférence
      try {
        await updateLayoutPreferences({ [storageKey]: width })
      } catch (error) {
        console.error('Error saving layout preference:', error)
      }
    }
  }, [isResizing, width, storageKey, updateLayoutPreferences])

  useEffect(() => {
    if (isResizing) {
      // Utiliser capture phase et options pour éviter les warnings
      const options = { capture: false }
      document.addEventListener('mousemove', handleMouseMove, options)
      document.addEventListener('mouseup', handleMouseUp, options)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove, options)
        document.removeEventListener('mouseup', handleMouseUp, options)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div 
      ref={containerRef}
      className="relative"
      style={{ width: `${width}%`, maxWidth: `${width}%` }}
    >
      {/* Poignée de redimensionnement droite */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 hover:bg-blue-500/30 transition-colors flex items-center justify-center ${
          isResizing && resizeSideRef.current === 'right' ? 'bg-blue-500/50' : 'bg-transparent'
        }`}
        style={{ marginRight: '-6px' }}
        title="Glisser pour redimensionner"
      >
        <div className="opacity-50 hover:opacity-100 pointer-events-none">
          <GripVertical className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

