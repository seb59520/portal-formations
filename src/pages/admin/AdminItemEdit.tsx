import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Save, Upload } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'

export function AdminItemEdit() {
  const { itemId } = useParams<{ itemId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = itemId === 'new'

  const [item, setItem] = useState<Partial<Item>>({
    type: 'resource',
    title: '',
    content: null,
    asset_path: null,
    external_url: null,
    position: 0,
    published: true
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew && itemId) {
      fetchItem()
    }
  }, [itemId, isNew])

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error
      setItem(data)
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!item.title?.trim() || !item.module_id) {
      setError('Le titre et le module sont obligatoires.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let assetPath = item.asset_path

      // Upload du fichier si nouveau
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${item.module_id}/${itemId || 'new'}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('course-assets')
          .upload(fileName, selectedFile)

        if (uploadError) throw uploadError
        assetPath = fileName
      }

      const itemData = {
        ...item,
        asset_path: assetPath,
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error
        navigate(`/admin/items/${data.id}/edit`)
      } else {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', itemId)

        if (error) throw error
        setItem(itemData)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleContentChange = (field: string, value: any) => {
    setItem({
      ...item,
      content: {
        ...item.content,
        [field]: value
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Nouvel élément' : 'Modifier l\'élément'}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => setItem({ ...item, title: e.target.value })}
                  className="input-field"
                  placeholder="Titre de l'élément"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={item.type || 'resource'}
                  onChange={(e) => setItem({ ...item, type: e.target.value as Item['type'] })}
                  className="input-field"
                >
                  <option value="resource">Ressource</option>
                  <option value="slide">Support projeté</option>
                  <option value="exercise">Exercice</option>
                  <option value="tp">TP</option>
                  <option value="game">Mini-jeu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module ID *
                </label>
                <input
                  type="text"
                  value={item.module_id || ''}
                  onChange={(e) => setItem({ ...item, module_id: e.target.value })}
                  className="input-field"
                  placeholder="ID du module parent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="number"
                    value={item.position || 0}
                    onChange={(e) => setItem({ ...item, position: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={item.published || false}
                    onChange={(e) => setItem({ ...item, published: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                    Publié
                  </label>
                </div>
              </div>
            </div>

            {/* Contenu spécifique selon le type */}
            {item.type === 'resource' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Ressource</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Description de la ressource"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL externe (optionnel)
                  </label>
                  <input
                    type="url"
                    value={item.external_url || ''}
                    onChange={(e) => setItem({ ...item, external_url: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>

                {!item.external_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fichier
                    </label>
                    <FileUpload
                      onFileSelect={setSelectedFile}
                      accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
                      maxSize={50}
                    />
                    {item.asset_path && (
                      <p className="text-sm text-gray-600 mt-2">
                        Fichier actuel: {item.asset_path.split('/').pop()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {item.type === 'slide' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Support projeté</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Description du support"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier (PDF ou image)
                  </label>
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={25}
                  />
                  {item.asset_path && (
                    <p className="text-sm text-gray-600 mt-2">
                      Fichier actuel: {item.asset_path.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {item.type === 'exercise' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Exercice</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Énoncé
                  </label>
                  <textarea
                    value={item.content?.question || ''}
                    onChange={(e) => handleContentChange('question', e.target.value)}
                    rows={4}
                    className="input-field"
                    placeholder="Énoncé de l'exercice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correction (optionnel)
                  </label>
                  <textarea
                    value={item.content?.correction || ''}
                    onChange={(e) => handleContentChange('correction', e.target.value)}
                    rows={4}
                    className="input-field"
                    placeholder="Correction de l'exercice"
                  />
                </div>
              </div>
            )}

            {item.type === 'tp' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">TP</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={item.content?.instructions || ''}
                    onChange={(e) => handleContentChange('instructions', e.target.value)}
                    rows={4}
                    className="input-field"
                    placeholder="Instructions du TP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Checklist
                  </label>
                  <textarea
                    value={item.content?.checklist?.join('\n') || ''}
                    onChange={(e) => handleContentChange('checklist', e.target.value.split('\n').filter(item => item.trim()))}
                    rows={4}
                    className="input-field"
                    placeholder="Une tâche par ligne"
                  />
                </div>
              </div>
            )}

            {item.type === 'game' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Mini-jeu</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={item.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Description du jeu"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
