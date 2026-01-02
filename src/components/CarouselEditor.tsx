import { useState } from 'react'
import { X, Plus, Trash2, GripVertical, Image, Video, FileText, Type } from 'lucide-react'
import { ImageUploadCarousel } from './ImageUploadCarousel'

interface CarouselItem {
  type: 'text' | 'image' | 'video' | 'content'
  content: string
  title?: string
  imageUrl?: string
  videoUrl?: string
}

interface CarouselEditorProps {
  items: CarouselItem[]
  onSave: (items: CarouselItem[]) => void
  onCancel: () => void
}

export function CarouselEditor({ items: initialItems, onSave, onCancel }: CarouselEditorProps) {
  const [items, setItems] = useState<CarouselItem[]>(initialItems.length > 0 ? initialItems : [
    { type: 'text', content: '', title: '' }
  ])

  const addItem = () => {
    setItems([...items, { type: 'text', content: '', title: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof CarouselItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setItems(newItems)
  }

  const handleSave = () => {
    // Filtrer les items vides et valider
    const validItems = items.filter(item => {
      if (item.type === 'image') return item.imageUrl && item.imageUrl.trim() !== ''
      if (item.type === 'video') return item.videoUrl && item.videoUrl.trim() !== ''
      return item.content && item.content.trim() !== ''
    })

    if (validItems.length === 0) {
      alert('Le carrousel doit contenir au moins un élément valide')
      return
    }

    onSave(validItems)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Éditer le carrousel</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Élément {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveItem(index, 'up')}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                        title="Déplacer vers le haut"
                      >
                        ↑
                      </button>
                    )}
                    {index < items.length - 1 && (
                      <button
                        onClick={() => moveItem(index, 'down')}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                        title="Déplacer vers le bas"
                      >
                        ↓
                      </button>
                    )}
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Type selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'élément
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'text', icon: Type, label: 'Texte' },
                      { value: 'image', icon: Image, label: 'Image' },
                      { value: 'video', icon: Video, label: 'Vidéo' },
                      { value: 'content', icon: FileText, label: 'HTML' },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateItem(index, 'type', value)}
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                          item.type === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de l'élément"
                  />
                </div>

                {/* Content based on type */}
                {item.type === 'image' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image *
                    </label>
                    <ImageUploadCarousel
                      onImageUploaded={(url) => updateItem(index, 'imageUrl', url)}
                      currentImageUrl={item.imageUrl}
                    />
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Ou entrez une URL externe :</p>
                      <input
                        type="url"
                        value={item.imageUrl || ''}
                        onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                )}

                {item.type === 'video' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la vidéo *
                    </label>
                    <input
                      type="url"
                      value={item.videoUrl || ''}
                      onChange={(e) => updateItem(index, 'videoUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/video.mp4"
                      required
                    />
                  </div>
                )}

                {(item.type === 'text' || item.type === 'content') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.type === 'content' ? 'Contenu HTML *' : 'Contenu texte *'}
                    </label>
                    <textarea
                      value={item.content || ''}
                      onChange={(e) => updateItem(index, 'content', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={item.type === 'content' ? 6 : 4}
                      placeholder={item.type === 'content' ? 'Contenu HTML...' : 'Contenu texte...'}
                      required
                    />
                    {item.type === 'content' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Vous pouvez utiliser du HTML pour formater le contenu
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button
            onClick={addItem}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un élément</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

