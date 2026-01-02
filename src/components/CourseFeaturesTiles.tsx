import { Link } from 'react-router-dom'
import { Item, Course } from '../types/database'
import { BookOpen, FileText, Presentation, PenTool, Code, Gamepad2, BarChart3 } from 'lucide-react'

interface CourseFeaturesTilesProps {
  course: Course
  items: Item[]
  courseId: string
}

interface FeatureTile {
  type: Item['type'] | 'overview' | 'progress'
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  count?: number
  link?: string
}

export function CourseFeaturesTiles({ course, items, courseId }: CourseFeaturesTilesProps) {
  // Compter les items par type
  const itemsByType = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {} as Record<Item['type'], number>)

  // Définir les tuiles de fonctionnalités
  const features: FeatureTile[] = [
    {
      type: 'overview',
      label: 'Vue d\'ensemble',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      link: `/courses/${courseId}`
    },
    {
      type: 'resource',
      label: 'Ressources',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      count: itemsByType.resource || 0,
      link: `/courses/${courseId}?filter=resource`
    },
    {
      type: 'slide',
      label: 'Supports',
      icon: <Presentation className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      count: itemsByType.slide || 0,
      link: `/courses/${courseId}?filter=slide`
    },
    {
      type: 'exercise',
      label: 'Exercices',
      icon: <PenTool className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
      count: itemsByType.exercise || 0,
      link: `/courses/${courseId}?filter=exercise`
    },
    {
      type: 'tp',
      label: 'Travaux pratiques',
      icon: <Code className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      count: itemsByType.tp || 0,
      link: `/courses/${courseId}?filter=tp`
    },
    {
      type: 'game',
      label: 'Mini-jeux',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      count: itemsByType.game || 0,
      link: `/courses/${courseId}?filter=game`
    },
    {
      type: 'progress',
      label: 'Progression',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      link: `/courses/${courseId}?view=progress`
    }
  ]

  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Fonctionnalités</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {features.map((feature) => {
          const content = (
            <div
              className={`${feature.bgColor} ${feature.color} rounded-lg p-4 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-gray-300`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={feature.color}>
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  {feature.count !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      {feature.count} {feature.count === 1 ? 'élément' : 'éléments'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )

          if (feature.link) {
            return (
              <Link key={feature.type} to={feature.link}>
                {content}
              </Link>
            )
          }

          return <div key={feature.type}>{content}</div>
        })}
      </div>
    </div>
  )
}

