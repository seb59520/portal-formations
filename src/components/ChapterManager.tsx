import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface ChapterManagerProps {
  itemId: string
  onChaptersChange?: (chapters: Chapter[]) => void
}

export function ChapterManager({ itemId, onChaptersChange }: ChapterManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null)
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (itemId && !itemId.startsWith('temp-')) {
      fetchChapters()
    } else {
      setLoading(false)
    }
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
      // Ouvrir tous les chapitres par défaut
      setExpandedChapters(new Set(data?.map(c => c.id) || []))
      onChaptersChange?.(data || [])
    } catch (error) {
      console.error('Error fetching chapters:', error)
    } finally {
      setLoading(false)
    }
  }

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `temp-${Date.now()}`,
      item_id: itemId,
      title: 'Nouveau chapitre',
      content: null,
      position: chapters.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updatedChapters = [...chapters, newChapter]
    setChapters(updatedChapters)
    setExpandedChapters(new Set([...expandedChapters, newChapter.id]))
    onChaptersChange?.(updatedChapters)
  }

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = chapters.map(c =>
      c.id === chapterId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
    )
    setChapters(updatedChapters)
    onChaptersChange?.(updatedChapters)
  }

  const saveChapter = async (chapter: Chapter) => {
    if (chapter.id.startsWith('temp-')) {
      // Créer un nouveau chapitre
      setSaving(new Set([...saving, chapter.id]))
      try {
        const { data, error } = await supabase
          .from('chapters')
          .insert({
            item_id: chapter.item_id,
            title: chapter.title,
            content: chapter.content,
            position: chapter.position,
          })
          .select()
          .single()

        if (error) throw error

        const updatedChapters = chapters.map(c =>
          c.id === chapter.id ? data : c
        )
        setChapters(updatedChapters)
        onChaptersChange?.(updatedChapters)
      } catch (error) {
        console.error('Error saving chapter:', error)
      } finally {
        setSaving(new Set([...saving].filter(id => id !== chapter.id)))
      }
    } else {
      // Mettre à jour un chapitre existant
      setSaving(new Set([...saving, chapter.id]))
      try {
        const { error } = await supabase
          .from('chapters')
          .update({
            title: chapter.title,
            content: chapter.content,
            position: chapter.position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chapter.id)

        if (error) throw error
      } catch (error) {
        console.error('Error updating chapter:', error)
      } finally {
        setSaving(new Set([...saving].filter(id => id !== chapter.id)))
      }
    }
  }

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Supprimer ce chapitre ?')) return

    if (chapterId.startsWith('temp-')) {
      const updatedChapters = chapters.filter(c => c.id !== chapterId)
      setChapters(updatedChapters)
      onChaptersChange?.(updatedChapters)
      return
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error

      const updatedChapters = chapters.filter(c => c.id !== chapterId)
      setChapters(updatedChapters)
      onChaptersChange?.(updatedChapters)
    } catch (error) {
      console.error('Error deleting chapter:', error)
    }
  }

  const moveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const index = chapters.findIndex(c => c.id === chapterId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= chapters.length) return

    const updatedChapters = [...chapters]
    const [moved] = updatedChapters.splice(index, 1)
    updatedChapters.splice(newIndex, 0, moved)

    // Mettre à jour les positions
    updatedChapters.forEach((c, i) => {
      c.position = i
      if (!c.id.startsWith('temp-')) {
        saveChapter({ ...c })
      }
    })

    setChapters(updatedChapters)
    onChaptersChange?.(updatedChapters)
  }

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedChapterId(chapterId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', chapterId)
    // Ajouter un style pour l'élément en cours de drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedChapterId(null)
    setDragOverChapterId(null)
    // Restaurer l'opacité
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedChapterId && draggedChapterId !== chapterId) {
      setDragOverChapterId(chapterId)
    }
  }

  const handleDragLeave = () => {
    setDragOverChapterId(null)
  }

  const handleDrop = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault()
    setDragOverChapterId(null)

    if (!draggedChapterId || draggedChapterId === targetChapterId) {
      setDraggedChapterId(null)
      return
    }

    const draggedIndex = chapters.findIndex(c => c.id === draggedChapterId)
    const targetIndex = chapters.findIndex(c => c.id === targetChapterId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChapterId(null)
      return
    }

    const updatedChapters = [...chapters]
    const [moved] = updatedChapters.splice(draggedIndex, 1)
    updatedChapters.splice(targetIndex, 0, moved)

    // Mettre à jour les positions
    updatedChapters.forEach((c, i) => {
      c.position = i
      if (!c.id.startsWith('temp-')) {
        saveChapter({ ...c })
      }
    })

    setChapters(updatedChapters)
    onChaptersChange?.(updatedChapters)
    setDraggedChapterId(null)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Chapitres</h3>
        <button
          onClick={addChapter}
          className="btn-secondary inline-flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un chapitre</span>
        </button>
      </div>

      {chapters.length === 0 ? (
        <p className="text-gray-500 text-sm italic py-4">
          Aucun chapitre. Cliquez sur "Ajouter un chapitre" pour commencer.
        </p>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              draggable
              onDragStart={(e) => handleDragStart(e, chapter.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, chapter.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, chapter.id)}
              className={`border rounded-lg bg-white transition-all cursor-move ${
                draggedChapterId === chapter.id
                  ? 'opacity-50 border-blue-400 scale-95'
                  : dragOverChapterId === chapter.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move hover:text-gray-600" />
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => {
                      updateChapter(chapter.id, { title: e.target.value })
                      // Auto-save après 1 seconde d'inactivité
                      setTimeout(() => {
                        if (!chapter.id.startsWith('temp-')) {
                          saveChapter({ ...chapter, title: e.target.value })
                        }
                      }, 1000)
                    }}
                    className="flex-1 text-base font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                    placeholder="Titre du chapitre"
                  />
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {index > 0 && (
                    <button
                      onClick={() => moveChapter(chapter.id, 'up')}
                      className="p-1 text-gray-600 hover:text-gray-900"
                      title="Déplacer vers le haut"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                  {index < chapters.length - 1 && (
                    <button
                      onClick={() => moveChapter(chapter.id, 'down')}
                      className="p-1 text-gray-600 hover:text-gray-900"
                      title="Déplacer vers le bas"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="p-1 text-gray-600 hover:text-gray-900"
                    title={expandedChapters.has(chapter.id) ? 'Réduire' : 'Développer'}
                  >
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteChapter(chapter.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedChapters.has(chapter.id) && (
                <div className="p-4">
                  <RichTextEditor
                    content={chapter.content}
                    onChange={(content) => {
                      updateChapter(chapter.id, { content })
                      // Auto-save après 2 secondes d'inactivité
                      setTimeout(() => {
                        if (!chapter.id.startsWith('temp-')) {
                          saveChapter({ ...chapter, content })
                        }
                      }, 2000)
                    }}
                    placeholder="Écrivez le contenu de ce chapitre..."
                  />
                  {saving.has(chapter.id) && (
                    <p className="text-xs text-gray-500 mt-2">Sauvegarde...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

