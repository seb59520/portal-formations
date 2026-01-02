import { useState, useEffect, useRef, useCallback } from 'react'
import { GripVertical } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings'

interface ResizableSidebarProps {
  children: React.ReactNode
  storageKey?: string
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  side?: 'left' | 'right'
}

export function ResizableSidebar({ 
  children, 
  storageKey = 'course-sidebar-width',
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 256,
  side = 'left'
}: ResizableSidebarProps) {
  const { settings, updateLayoutPreferences } = useUserSettings()
  const [width, setWidth] = useState<number>(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = side === 'left' 
      ? e.clientX 
      : window.innerWidth - e.clientX

    // Limiter entre minWidth et maxWidth
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(clampedWidth)
  }, [isResizing, minWidth, maxWidth, side])

  const handleMouseUp = useCallback(async () => {
    if (isResizing) {
      setIsResizing(false)
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

  // Mettre à jour la variable CSS pour que le contenu principal s'adapte
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`)
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width')
    }
  }, [width])

  return (
    <div 
      ref={sidebarRef}
      className="relative h-full"
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      {/* Poignée de redimensionnement */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute ${
          side === 'left' ? 'right-0' : 'left-0'
        } top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-blue-500/50 transition-colors flex items-center justify-center ${
          isResizing ? 'bg-blue-500/70' : 'bg-transparent'
        }`}
        style={{ 
          [side === 'left' ? 'marginRight' : 'marginLeft']: '-4px',
          width: '8px'
        }}
        title="Glisser pour redimensionner"
      >
        <div className={`absolute ${side === 'left' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 pointer-events-none`}>
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  )
}

