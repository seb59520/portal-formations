import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { CourseJson } from '../types/courseJson'
import { ChevronDown, ChevronUp, BookOpen, FileText, Presentation, PenTool, Gamepad2, X } from 'lucide-react'

interface CourseSidebarProps {
  courseJson: CourseJson
  onClose?: () => void
}

export function CourseSidebar({ courseJson, onClose }: CourseSidebarProps) {
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [expandedLexique, setExpandedLexique] = useState(false)

  // Ouvrir tous les modules par défaut
  useEffect(() => {
    if (expandedModules.size === 0 && courseJson.modules.length > 0) {
      setExpandedModules(new Set(courseJson.modules.map((_, index) => index)))
    }
  }, [courseJson.modules.length, expandedModules.size])

  // Détecter si on est sur la page du cours ou sur une page d'item individuel
  const isCourseView = location.pathname.includes('/courses/') && !location.pathname.includes('/items/')
  const currentItemId = location.pathname.includes('/items/') 
    ? location.pathname.split('/items/')[1] 
    : undefined

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModules(newExpanded)
  }

  // Trouver le lexique
  const lexiqueItem = courseJson.modules
    .flatMap(m => m.items)
    .find(item => item.title.toLowerCase().includes('lexique') || item.content?.isLexique)

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'resource':
        return <FileText className="w-4 h-4" />
      case 'slide':
        return <Presentation className="w-4 h-4" />
      case 'exercise':
        return <PenTool className="w-4 h-4" />
      case 'tp':
        return <FileText className="w-4 h-4" />
      case 'game':
        return <Gamepad2 className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case 'resource':
        return 'text-blue-600'
      case 'slide':
        return 'text-green-600'
      case 'exercise':
        return 'text-yellow-600'
      case 'tp':
        return 'text-purple-600'
      case 'game':
        return 'text-pink-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="w-full bg-white border-r border-gray-200 h-full flex flex-col shadow-lg">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Table des matières
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Lexique */}
        {lexiqueItem && (
          <div className="mb-4">
            <button
              onClick={() => setExpandedLexique(!expandedLexique)}
              className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {lexiqueItem.title}
                </span>
              </div>
              {expandedLexique ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {expandedLexique && (
              <div className="ml-6 mt-1">
                <Link
                  to={`/courses/${courseId}#lexique`}
                  className="block text-xs text-gray-600 hover:text-blue-600 py-1"
                  onClick={(e) => {
                    e.preventDefault()
                    // Scroll vers le lexique dans la page
                    const lexiqueElement = document.getElementById('lexique')
                    if (lexiqueElement) {
                      lexiqueElement.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Voir le lexique
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Modules */}
        <div className="space-y-1">
          {courseJson.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(moduleIndex)
            
            // Filtrer les items (exclure le lexique s'il est affiché séparément)
            const moduleItems = lexiqueItem 
              ? module.items.filter(item => 
                  !(item.title.toLowerCase().includes('lexique') || item.content?.isLexique) && item.published !== false
                )
              : module.items.filter(item => item.published !== false)

            if (moduleItems.length === 0) {
              return null
            }

            return (
              <div key={moduleIndex} className="mb-2">
                <button
                  onClick={() => toggleModule(moduleIndex)}
                  className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-50 rounded transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 truncate flex-1">
                    {module.title}
                  </span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      ({moduleItems.length})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-2 mt-1 space-y-1">
                    {moduleItems.map((item, itemIndex) => {
                      // Utiliser l'ID de l'item s'il est disponible
                      const itemId = item.id
                      const isActive = currentItemId === itemId
                      
                      // Créer un ID d'ancre basé sur le titre de l'item
                      const anchorId = `item-${moduleIndex}-${itemIndex}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                      
                      // Pour les exercices et TP, toujours naviguer vers la page individuelle pour permettre la soumission
                      // Pour les autres types, utiliser des ancres si on est en mode course view
                      const isExerciseOrTp = item.type === 'exercise' || item.type === 'tp'
                      
                      const handleClick = (e: React.MouseEvent) => {
                        // Si c'est un exercice ou TP avec un ID, laisser le lien naturel fonctionner
                        if (isExerciseOrTp && itemId) {
                          // Fermer la sidebar sur mobile après navigation
                          if (onClose && window.innerWidth < 1024) {
                            setTimeout(() => onClose(), 300)
                          }
                          return // Laisser le Link gérer la navigation
                        }
                        
                        // Pour les autres types en mode course view, faire un scroll
                        if (isCourseView && !isExerciseOrTp) {
                          e.preventDefault()
                          const element = document.getElementById(anchorId)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            // Fermer la sidebar sur mobile après navigation
                            if (onClose && window.innerWidth < 1024) {
                              setTimeout(() => onClose(), 300)
                            }
                          }
                        }
                      }
                      
                      // Pour les exercices/TP avec ID, toujours aller vers la page individuelle
                      // Sinon, utiliser des ancres si on est en mode course view
                      const linkTo = (isExerciseOrTp && itemId)
                        ? `/items/${itemId}`
                        : isCourseView 
                          ? `#${anchorId}`
                          : itemId 
                            ? `/items/${itemId}`
                            : `/courses/${courseId}#${anchorId}`
                      
                      return (
                        <a
                          key={itemIndex}
                          href={linkTo}
                          onClick={handleClick}
                          className={`flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className={getItemColor(item.type)}>
                            {getItemIcon(item.type)}
                          </span>
                          <span className="truncate flex-1">{item.title}</span>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}

