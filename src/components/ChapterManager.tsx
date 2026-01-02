import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Chapter } from '../types/database'
import { RichTextEditor } from './RichTextEditor'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Code, Gamepad2, Eye, EyeOff } from 'lucide-react'

interface ChapterManagerProps {
  itemId: string
  onChaptersChange?: (chapters: Chapter[]) => void
}

export function ChapterManager({ itemId, onChaptersChange }: ChapterManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null)
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null)
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null)
  const saveTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    let isMounted = true

    const fetchChapters = async () => {
      try {
        if (!isMounted) return
        
        setError(null)
        setLoading(true)
        
        console.log('=== ChapterManager: Fetching chapters ===')
        console.log('Item ID:', itemId)
        
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('item_id', itemId)
          .order('position', { ascending: true })

        // Vérifier si le composant est toujours monté avant de mettre à jour l'état
        if (!isMounted) {
          console.log('⚠️ Composant démonté, ignore la réponse de la requête')
          return
        }

        console.log('ChapterManager query result:')
        console.log('  - Data:', data)
        console.log('  - Data length:', data?.length || 0)
        console.log('  - Error:', error)
        console.log('  - Error code:', error?.code)
        console.log('  - Error message:', error?.message)
        console.log('  - Error details:', error?.details)
        console.log('  - Error hint:', error?.hint)

        if (error) {
          // Ignorer les erreurs d'annulation (AbortError) - c'est normal si le composant se démonte
          // ou si la requête est annulée par le timeout du fetch personnalisé
          if (
            error.message?.includes('AbortError') || 
            error.message?.includes('aborted') ||
            error.message?.includes('signal is aborted')
          ) {
            console.log('⚠️ Requête annulée (composant démonté, itemId changé, ou timeout)')
            return
          }
          
          console.error('❌ ChapterManager: Error fetching chapters:', error)
          
          // Extraire le message d'erreur de manière détaillée
          let errorMessage = 'Erreur lors du chargement des chapitres'
          
          if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
            errorMessage = 'Erreur de permissions. Vérifiez que vous avez accès à ce cours.'
            console.error('⚠️ Problème de permissions RLS détecté dans ChapterManager!')
          } else if (error.code === '57014' || error.message?.includes('timeout')) {
            errorMessage = 'Le chargement prend trop de temps. Vérifiez votre connexion Internet.'
          } else if (error.message) {
            errorMessage = `Erreur: ${error.message}`
          }
          
          if (error.code) {
            errorMessage += ` (Code: ${error.code})`
          }
          
          if (error.details) {
            errorMessage += ` - ${error.details}`
          }
          
          setError(errorMessage)
          return
        }
        
        setChapters(data || [])
        // Ouvrir tous les chapitres par défaut
        setExpandedChapters(new Set(data?.map(c => c.id) || []))
        onChaptersChange?.(data || [])
      } catch (error: any) {
        // Ignorer les erreurs d'annulation
        if (
          error?.name === 'AbortError' || 
          error?.message?.includes('aborted') ||
          error?.message?.includes('signal is aborted')
        ) {
          console.log('⚠️ Requête annulée (catch block)')
          return
        }
        
        console.error('Error fetching chapters (catch block):', error)
        if (isMounted) {
          setError('Erreur inconnue lors du chargement des chapitres.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (itemId && !itemId.startsWith('temp-')) {
      fetchChapters()
    } else {
      setLoading(false)
    }

    // Cleanup: marquer le composant comme démonté
    return () => {
      isMounted = false
    }
  }, [itemId])

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `temp-${Date.now()}`,
      item_id: itemId,
      title: 'Nouveau chapitre',
      content: null,
      type: 'content',
      position: chapters.length,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updatedChapters = [...chapters, newChapter]
    setChapters(updatedChapters)
    setExpandedChapters(new Set([...expandedChapters, newChapter.id]))
    onChaptersChange?.(updatedChapters)
  }

  const addGameChapter = () => {
    const newChapter: Chapter = {
      id: `temp-${Date.now()}`,
      item_id: itemId,
      title: 'Nouveau jeu',
      content: null,
      type: 'game',
      game_content: {
        gameType: 'matching',
        pairs: []
      },
      position: chapters.length,
      published: true,
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
        // Récupérer la position actuelle depuis l'état local pour éviter de perdre l'ordre
        const currentChapter = chapters.find(c => c.id === chapter.id)
        const positionToSave = currentChapter?.position ?? chapter.position ?? chapters.length

        // S'assurer que le type est valide ('content' ou 'game')
        const validType = (chapter.type === 'content' || chapter.type === 'game') ? chapter.type : 'content'
        
        const { data, error } = await supabase
          .from('chapters')
          .insert({
            item_id: chapter.item_id,
            title: chapter.title || 'Nouveau chapitre',
            content: chapter.content,
            type: validType,
            game_content: chapter.game_content || null,
            position: positionToSave,
            published: chapter.published !== undefined ? chapter.published : true,
          })
          .select()
          .single()

        if (error) {
          console.error('Error saving chapter:', error)
          throw error
        }

        if (!data) {
          console.error('No data returned from insert')
          throw new Error('No data returned from insert')
        }

        // Remplacer le chapitre temporaire par le chapitre sauvegardé
        const updatedChapters = chapters.map(c =>
          c.id === chapter.id ? data : c
        )
        setChapters(updatedChapters)
        onChaptersChange?.(updatedChapters)
        
        // Rafraîchir depuis la base pour être sûr
        await fetchChapters()
      } catch (error) {
        console.error('Error saving chapter:', error)
        alert('Erreur lors de la sauvegarde du chapitre. Vérifiez la console pour plus de détails.')
      } finally {
        setSaving(prev => {
          const newSet = new Set(prev)
          newSet.delete(chapter.id)
          return newSet
        })
      }
    } else {
      // Mettre à jour un chapitre existant
      setSaving(new Set([...saving, chapter.id]))
      try {
        // Récupérer la position actuelle depuis l'état local pour préserver l'ordre
        const currentChapter = chapters.find(c => c.id === chapter.id)
        const positionToSave = currentChapter?.position ?? chapter.position

        // S'assurer que le type est valide ('content' ou 'game')
        const validType = (chapter.type === 'content' || chapter.type === 'game') ? chapter.type : 'content'
        
        const { error } = await supabase
          .from('chapters')
          .update({
            title: chapter.title,
            content: chapter.content,
            type: validType,
            game_content: chapter.game_content || null,
            position: positionToSave, // Toujours utiliser la position de l'état local
            published: chapter.published !== undefined ? chapter.published : true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chapter.id)

        if (error) {
          console.error('Error updating chapter:', error)
          throw error
        }
        
        // Ne pas rafraîchir automatiquement pour éviter de perdre l'ordre
        // Le rafraîchissement sera fait par saveChapterPositions si nécessaire
      } catch (error) {
        console.error('Error updating chapter:', error)
        alert('Erreur lors de la mise à jour du chapitre. Vérifiez la console pour plus de détails.')
      } finally {
        setSaving(prev => {
          const newSet = new Set(prev)
          newSet.delete(chapter.id)
          return newSet
        })
      }
    }
  }

  const handleDeleteClick = (chapterId: string) => {
    console.log('handleDeleteClick called with chapterId:', chapterId)
    if (!chapterId) {
      console.error('handleDeleteClick: chapterId is missing')
      alert('Erreur: ID du chapitre manquant')
      return
    }
    setChapterToDelete(chapterId)
  }

  const confirmDelete = async () => {
    if (!chapterToDelete) return
    
    const chapterId = chapterToDelete
    setChapterToDelete(null)
    
    console.log('confirmDelete called with chapterId:', chapterId)
    console.log('confirmDelete: proceeding with deletion...')

    if (chapterId.startsWith('temp-')) {
      // Supprimer un chapitre temporaire (non sauvegardé)
      console.log('confirmDelete: deleting temporary chapter')
      const updatedChapters = chapters.filter(c => c.id !== chapterId)
      // Mettre à jour les positions
      updatedChapters.forEach((c, i) => {
        c.position = i
      })
      setChapters(updatedChapters)
      onChaptersChange?.(updatedChapters)
      return
    }

    try {
      console.log('confirmDelete: attempting to delete chapter from database:', chapterId)
      
      // Supprimer le chapitre de la base de données
      const { data, error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)
        .select()

      if (deleteError) {
        console.error('Error deleting chapter:', deleteError)
        alert(`Erreur lors de la suppression: ${deleteError.message || 'Erreur inconnue'}\n\nCode: ${deleteError.code}\nDétails: ${deleteError.details || 'Aucun détail'}`)
        return
      }

      console.log('confirmDelete: chapter deleted successfully, data:', data)

      // Mettre à jour la liste locale
      const updatedChapters = chapters.filter(c => c.id !== chapterId)
      
      // Mettre à jour les positions des chapitres restants
      updatedChapters.forEach((c, i) => {
        c.position = i
      })
      
      setChapters(updatedChapters)
      onChaptersChange?.(updatedChapters)

      // Sauvegarder les nouvelles positions
      if (updatedChapters.length > 0) {
        console.log('confirmDelete: updating positions of remaining chapters')
        await saveChapterPositions(updatedChapters)
      } else {
        // Si plus de chapitres, juste rafraîchir
        console.log('confirmDelete: no chapters remaining, refreshing')
        await fetchChapters()
      }
      
      console.log('confirmDelete: deletion completed successfully')
    } catch (error: any) {
      console.error('Error deleting chapter (catch block):', error)
      alert(`Erreur lors de la suppression du chapitre: ${error.message || 'Erreur inconnue'}\n\nVérifiez la console pour plus de détails.`)
    }
  }

  const cancelDelete = () => {
    console.log('cancelDelete: user cancelled deletion')
    setChapterToDelete(null)
  }

  const saveChapterPositions = async (updatedChapters: Chapter[]) => {
    const chaptersToUpdate = updatedChapters.filter(c => !c.id.startsWith('temp-'))
    if (chaptersToUpdate.length === 0) return

    try {
      // Mettre à jour les positions de manière séquentielle pour éviter les race conditions
      for (const chapter of chaptersToUpdate) {
        const { error } = await supabase
          .from('chapters')
          .update({ 
            position: chapter.position, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', chapter.id)

        if (error) {
          console.error(`Error updating chapter ${chapter.id}:`, error)
          throw error
        }
      }

      // Attendre un court délai pour s'assurer que les mises à jour sont propagées
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Rafraîchir depuis la base pour confirmer
      await fetchChapters()
    } catch (error) {
      console.error('Error saving chapter positions:', error)
      alert('Erreur lors de la sauvegarde de l\'ordre des chapitres. Vérifiez la console pour plus de détails.')
      // Recharger depuis la base en cas d'erreur
      await fetchChapters()
      throw error
    }
  }

  const moveChapter = async (chapterId: string, direction: 'up' | 'down') => {
    const index = chapters.findIndex(c => c.id === chapterId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= chapters.length) return

    const updatedChapters = [...chapters]
    const [moved] = updatedChapters.splice(index, 1)
    updatedChapters.splice(newIndex, 0, moved)

    // Mettre à jour les positions localement
    updatedChapters.forEach((c, i) => {
      c.position = i
    })

    setChapters(updatedChapters)
    onChaptersChange?.(updatedChapters)

    // Sauvegarder toutes les positions
    await saveChapterPositions(updatedChapters)
  }

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    // Ne pas permettre le drag si on clique sur un bouton ou un input
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      e.preventDefault()
      return
    }
    
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

  const handleDrop = async (e: React.DragEvent, targetChapterId: string) => {
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

    // Mettre à jour les positions localement
    updatedChapters.forEach((c, i) => {
      c.position = i
    })

    setChapters(updatedChapters)
    onChaptersChange?.(updatedChapters)
    setDraggedChapterId(null)

    // Sauvegarder toutes les positions
    await saveChapterPositions(updatedChapters)
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

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">❌ Erreur lors du chargement des chapitres</p>
          <p className="text-red-700 text-sm mb-2">{error}</p>
          <button
            onClick={() => fetchChapters()}
            className="mt-2 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Chapitres</h3>
        <div className="flex items-center space-x-2">
          <Link
            to={`/admin/chapters/new/json?item_id=${itemId}`}
            className="btn-secondary inline-flex items-center space-x-2 text-sm"
            title="Créer un chapitre en JSON"
          >
            <Code className="w-4 h-4" />
            <span>Nouveau JSON</span>
          </Link>
          <button
            onClick={addGameChapter}
            className="btn-secondary inline-flex items-center space-x-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
            title="Ajouter un jeu entre les chapitres"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Ajouter un jeu</span>
          </button>
          <button
            onClick={addChapter}
            className="btn-secondary inline-flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un chapitre</span>
          </button>
        </div>
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
              className={`border rounded-lg transition-all cursor-move ${
                !chapter.published
                  ? 'opacity-60 bg-gray-50 border-gray-300'
                  : chapter.type === 'game'
                  ? draggedChapterId === chapter.id
                    ? 'opacity-50 border-red-400 scale-95 bg-red-50'
                    : dragOverChapterId === chapter.id
                    ? 'border-red-500 bg-red-100 shadow-lg scale-105'
                    : 'border-red-200 bg-red-50 hover:border-red-300'
                  : draggedChapterId === chapter.id
                  ? 'opacity-50 border-blue-400 scale-95 bg-white'
                  : dragOverChapterId === chapter.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move hover:text-gray-600" />
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => {
                      const newTitle = e.target.value
                      updateChapter(chapter.id, { title: newTitle })
                      
                      // Annuler le timeout précédent pour ce chapitre
                      const existingTimeout = saveTimeouts.current.get(chapter.id)
                      if (existingTimeout) {
                        clearTimeout(existingTimeout)
                      }
                      
                      // Auto-save après 1 seconde d'inactivité
                      if (chapter.id.startsWith('temp-')) {
                        // Pour les nouveaux chapitres, sauvegarder si le titre n'est pas vide
                        if (newTitle.trim() && newTitle !== 'Nouveau chapitre') {
                          const timeoutId = setTimeout(() => {
                            saveChapter({ ...chapter, title: newTitle })
                            saveTimeouts.current.delete(chapter.id)
                          }, 1000)
                          saveTimeouts.current.set(chapter.id, timeoutId)
                        }
                      } else {
                        // Pour les chapitres existants, auto-save après 1 seconde
                        const timeoutId = setTimeout(() => {
                          saveChapter({ ...chapter, title: newTitle })
                          saveTimeouts.current.delete(chapter.id)
                        }, 1000)
                        saveTimeouts.current.set(chapter.id, timeoutId)
                      }
                    }}
                    className="flex-1 text-base font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                    placeholder="Titre du chapitre"
                  />
                  {chapter.type === 'game' ? (
                    <Gamepad2 className="w-4 h-4 text-red-600" />
                  ) : (
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!chapter.id.startsWith('temp-') && (
                    <Link
                      to={`/admin/chapters/${chapter.id}/json`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Éditer en JSON"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Code className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newPublished = !chapter.published
                      updateChapter(chapter.id, { published: newPublished })
                      // Sauvegarder immédiatement si ce n'est pas un chapitre temporaire
                      if (!chapter.id.startsWith('temp-')) {
                        saveChapter({ ...chapter, published: newPublished })
                      }
                    }}
                    className={`p-1 ${
                      chapter.published
                        ? 'text-green-600 hover:text-green-800'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={chapter.published ? 'Chapitre publié (visible dans le cours)' : 'Chapitre non publié (masqué dans le cours)'}
                    type="button"
                  >
                    {chapter.published ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
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
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Delete button clicked for chapter:', chapter.id)
                      handleDeleteClick(chapter.id)
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation()
                    }}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Supprimer"
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedChapters.has(chapter.id) && (
                <div className="p-4">
                  {chapter.type === 'game' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de jeu
                        </label>
                        <select
                          value={chapter.game_content?.gameType || 'matching'}
                          onChange={(e) => {
                            const newGameContent = {
                              ...chapter.game_content,
                              gameType: e.target.value
                            }
                            updateChapter(chapter.id, { game_content: newGameContent })
                            if (!chapter.id.startsWith('temp-')) {
                              const timeoutId = setTimeout(() => {
                                saveChapter({ ...chapter, game_content: newGameContent })
                              }, 1000)
                              saveTimeouts.current.set(`game-${chapter.id}`, timeoutId)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="matching">Matching (Cartes à associer)</option>
                          <option value="column-matching">Column Matching (Colonnes à associer)</option>
                          <option value="api-types">API Types (Types d'API)</option>
                          <option value="format-files">Format Files (Formats de fichiers)</option>
                        </select>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                          💡 <strong>Note :</strong> Pour configurer le contenu du jeu (paires, scénarios, niveaux, etc.), 
                          utilisez l'éditeur JSON en cliquant sur l'icône <Code className="w-3 h-3 inline" /> à droite.
                        </p>
                      </div>
                      {chapter.id.startsWith('temp-') && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-yellow-600">
                            ⚠️ Jeu non sauvegardé. Modifiez le titre pour sauvegarder.
                          </p>
                          <button
                            onClick={() => {
                              if (chapter.title && chapter.title.trim() && chapter.title !== 'Nouveau jeu') {
                                saveChapter(chapter)
                              } else {
                                alert('Veuillez d\'abord modifier le titre du jeu.')
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Sauvegarder maintenant
                          </button>
                        </div>
                      )}
                      {saving.has(chapter.id) && (
                        <p className="text-xs text-gray-500 mt-2">Sauvegarde...</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <RichTextEditor
                        content={chapter.content}
                        onChange={(content) => {
                          updateChapter(chapter.id, { content })
                          
                          // Annuler le timeout précédent pour ce chapitre
                          const existingTimeout = saveTimeouts.current.get(`content-${chapter.id}`)
                          if (existingTimeout) {
                            clearTimeout(existingTimeout)
                          }
                          
                          // Auto-save après 2 secondes d'inactivité
                          if (chapter.id.startsWith('temp-')) {
                            // Pour les nouveaux chapitres, sauvegarder si le titre n'est pas vide
                            if (chapter.title && chapter.title.trim() && chapter.title !== 'Nouveau chapitre') {
                              const timeoutId = setTimeout(() => {
                                saveChapter({ ...chapter, content })
                                saveTimeouts.current.delete(`content-${chapter.id}`)
                              }, 2000)
                              saveTimeouts.current.set(`content-${chapter.id}`, timeoutId)
                            }
                          } else {
                            // Pour les chapitres existants, auto-save après 2 secondes
                            const timeoutId = setTimeout(() => {
                              saveChapter({ ...chapter, content })
                              saveTimeouts.current.delete(`content-${chapter.id}`)
                            }, 2000)
                            saveTimeouts.current.set(`content-${chapter.id}`, timeoutId)
                          }
                        }}
                        placeholder="Écrivez le contenu de ce chapitre..."
                      />
                      {chapter.id.startsWith('temp-') && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-yellow-600">
                            ⚠️ Chapitre non sauvegardé. Modifiez le titre pour sauvegarder.
                          </p>
                          <button
                            onClick={() => {
                              if (chapter.title && chapter.title.trim() && chapter.title !== 'Nouveau chapitre') {
                                saveChapter(chapter)
                              } else {
                                alert('Veuillez d\'abord modifier le titre du chapitre.')
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Sauvegarder maintenant
                          </button>
                        </div>
                      )}
                      {saving.has(chapter.id) && (
                        <p className="text-xs text-gray-500 mt-2">Sauvegarde...</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Confirmer la suppression
              </h3>
              <p className="text-gray-700 mb-6">
                Vous êtes sur le point de supprimer le chapitre :<br />
                <strong className="text-red-600">
                  "{chapters.find(c => c.id === chapterToDelete)?.title || 'ce chapitre'}"
                </strong>
                <br /><br />
                Cette action est <strong>irréversible</strong>.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  type="button"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

