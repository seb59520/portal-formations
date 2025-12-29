import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ChapterViewerProps {
  itemId: string
}

export function ChapterViewer({ itemId }: ChapterViewerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchChapters()
  }, [itemId])

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('item_id', itemId)
        .order('position', { ascending: true })

      if (error) throw error
      setChapters(data || [])
      // Ouvrir le premier chapitre par défaut
      if (data && data.length > 0) {
        setExpandedChapters(new Set([data[0].id]))
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  if (loading) {
    return <div className="text-gray-500">Chargement des chapitres...</div>
  }

  if (chapters.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapitres</h2>
      <div className="space-y-3">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className="border border-gray-200 rounded-lg bg-white shadow-sm"
          >
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
              </div>
              {expandedChapters.has(chapter.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedChapters.has(chapter.id) && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="pt-4">
                  {chapter.content ? (
                    <RichTextEditor
                      content={chapter.content}
                      onChange={() => {}} // Lecture seule
                      editable={false}
                    />
                  ) : (
                    <p className="text-gray-500 italic">Ce chapitre n'a pas encore de contenu.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

