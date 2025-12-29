import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Save, Upload } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { RichTextEditor } from '../../components/RichTextEditor'
import { ChapterManager } from '../../components/ChapterManager'

export function AdminItemEdit() {
  const { itemId } = useParams<{ itemId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = itemId === 'new'
  const moduleIdFromUrl = searchParams.get('module_id')

  const [item, setItem] = useState<Partial<Item>>({
    type: 'resource',
    title: '',
    content: null,
    asset_path: null,
    external_url: null,
    position: 0,
    published: true,
    module_id: moduleIdFromUrl || undefined
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    // Si c'est un ID temporaire, rediriger vers la création d'un nouvel item (une seule fois)
    if (itemId && itemId.startsWith('temp-') && !redirected) {
      setRedirected(true)
      // Extraire le module_id depuis l'URL ou utiliser celui par défaut
      const moduleId = moduleIdFromUrl
      if (moduleId) {
        navigate(`/admin/items/new?module_id=${moduleId}`, { replace: true })
      } else {
        // Si on n'a pas de module_id, rediriger vers la liste des cours
        navigate('/admin', { replace: true })
      }
      return
    }

    // Ne rien faire si on a déjà redirigé
    if (redirected) return

    if (!isNew && itemId && !itemId.startsWith('temp-')) {
      fetchItem()
    } else if (isNew && moduleIdFromUrl) {
      setItem(prev => ({ ...prev, module_id: moduleIdFromUrl }))
      setLoading(false)
    } else if (isNew) {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, isNew, moduleIdFromUrl, redirected])

  const fetchItem = async () => {
    if (!itemId || itemId === 'new' || itemId.startsWith('temp-')) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) {
        console.error('Error fetching item:', error)
        // Erreur 400 peut signifier que l'item n'existe pas ou problème de permissions
        if (error.code === 'PGRST116') {
          setError('Élément non trouvé. Vérifiez que l\'ID est correct.')
        } else if (error.code === '42501' || error.message?.includes('permission')) {
          setError('Vous n\'avez pas la permission d\'accéder à cet élément.')
        } else {
          setError(`Erreur lors du chargement: ${error.message || error.code || 'Erreur inconnue'}`)
        }
        setLoading(false)
        return
      }
      
      if (!data) {
        setError('Élément non trouvé.')
        setLoading(false)
        return
      }
      
      setItem(data)
    } catch (error: any) {
      console.error('Error fetching item:', error)
      setError(`Erreur lors du chargement: ${error?.message || 'Erreur inconnue'}`)
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

      // Sauvegarder le contenu body si présent
      const itemData = {
        ...item,
        asset_path: assetPath,
        content: item.content || {},
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error
        // Rediriger vers la page d'édition avec le nouvel ID
        navigate(`/admin/items/${data.id}/edit`, { replace: true })
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

            {/* Contenu principal avec éditeur riche */}
            {!isNew && itemId && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Contenu principal</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Écrivez le contenu de la leçon directement ici
                  </label>
                  <RichTextEditor
                    content={item.content?.body || null}
                    onChange={(content) => {
                      setItem({
                        ...item,
                        content: {
                          ...item.content,
                          body: content
                        }
                      })
                    }}
                    placeholder="Commencez à écrire le contenu de votre leçon..."
                  />
                </div>
              </div>
            )}

            {/* Chapitres - seulement si l'item est sauvegardé (pas de temp ID) */}
            {!isNew && itemId && !itemId.startsWith('temp-') && (
              <div className="space-y-4">
                <ChapterManager itemId={itemId} />
              </div>
            )}

            {/* Contenu spécifique selon le type */}
            {item.type === 'resource' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Ressource</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (courte)
                  </label>
                  <textarea
                    value={item.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Description courte de la ressource"
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
                    Description (courte)
                  </label>
                  <textarea
                    value={item.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Description courte du support"
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
                {!isNew && itemId ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Énoncé de l'exercice
                      </label>
                      <RichTextEditor
                        content={item.content?.question || null}
                        onChange={(content) => handleContentChange('question', content)}
                        placeholder="Écrivez l'énoncé de l'exercice..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correction (optionnel)
                      </label>
                      <RichTextEditor
                        content={item.content?.correction || null}
                        onChange={(content) => handleContentChange('correction', content)}
                        placeholder="Écrivez la correction de l'exercice..."
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {item.type === 'tp' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">TP</h3>
                {!isNew && itemId ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions du TP
                      </label>
                      <RichTextEditor
                        content={item.content?.instructions || null}
                        onChange={(content) => handleContentChange('instructions', content)}
                        placeholder="Écrivez les instructions du TP..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Checklist (une tâche par ligne)
                      </label>
                      <textarea
                        value={item.content?.checklist?.join('\n') || ''}
                        onChange={(e) => handleContentChange('checklist', e.target.value.split('\n').filter(item => item.trim()))}
                        rows={4}
                        className="input-field"
                        placeholder="Une tâche par ligne"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {item.type === 'game' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Mini-jeu</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de jeu
                  </label>
                  <select
                    value={item.content?.gameType || 'matching'}
                    onChange={(e) => handleContentChange('gameType', e.target.value)}
                    className="input-field"
                  >
                    <option value="matching">Association de cartes</option>
                    <option value="column-matching">Association de colonnes</option>
                  </select>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions (optionnel)
                  </label>
                  <textarea
                    value={item.content?.instructions || ''}
                    onChange={(e) => handleContentChange('instructions', e.target.value)}
                    rows={2}
                    className="input-field"
                    placeholder="Instructions pour jouer au jeu"
                  />
                </div>

                {item.content?.gameType === 'matching' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Paires de cartes (Terme / Définition)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentPairs = item.content?.pairs || []
                          handleContentChange('pairs', [
                            ...currentPairs,
                            { term: '', definition: '' }
                          ])
                        }}
                        className="btn-secondary text-sm"
                      >
                        + Ajouter une paire
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(item.content?.pairs || []).map((pair: { term: string; definition: string }, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Paire {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentPairs = item.content?.pairs || []
                                handleContentChange('pairs', currentPairs.filter((_: any, i: number) => i !== index))
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Terme / Question
                              </label>
                              <input
                                type="text"
                                value={pair.term || ''}
                                onChange={(e) => {
                                  const currentPairs = item.content?.pairs || []
                                  const newPairs = [...currentPairs]
                                  newPairs[index] = { ...newPairs[index], term: e.target.value }
                                  handleContentChange('pairs', newPairs)
                                }}
                                className="input-field text-sm"
                                placeholder="Ex: JavaScript"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Définition / Réponse
                              </label>
                              <input
                                type="text"
                                value={pair.definition || ''}
                                onChange={(e) => {
                                  const currentPairs = item.content?.pairs || []
                                  const newPairs = [...currentPairs]
                                  newPairs[index] = { ...newPairs[index], definition: e.target.value }
                                  handleContentChange('pairs', newPairs)
                                }}
                                className="input-field text-sm"
                                placeholder="Ex: Langage de programmation"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(!item.content?.pairs || item.content.pairs.length === 0) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          Aucune paire configurée. Cliquez sur "Ajouter une paire" pour commencer.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {item.content?.gameType === 'column-matching' && (
                  <div className="space-y-4">
                    {/* Colonne gauche */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Colonne 1 (une idée par ligne)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentLeft = item.content?.leftColumn || []
                            handleContentChange('leftColumn', [...currentLeft, ''])
                          }}
                          className="btn-secondary text-sm"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <textarea
                        value={(item.content?.leftColumn || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim() || e.target.value.endsWith('\n'))
                          handleContentChange('leftColumn', lines)
                        }}
                        rows={6}
                        className="input-field font-mono text-sm"
                        placeholder="Idée 1&#10;Idée 2&#10;Idée 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {item.content?.leftColumn?.length || 0} élément(s) dans la colonne 1
                      </p>
                    </div>

                    {/* Colonne droite */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Colonne 2 (une idée par ligne)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentRight = item.content?.rightColumn || []
                            handleContentChange('rightColumn', [...currentRight, ''])
                          }}
                          className="btn-secondary text-sm"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <textarea
                        value={(item.content?.rightColumn || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim() || e.target.value.endsWith('\n'))
                          handleContentChange('rightColumn', lines)
                        }}
                        rows={6}
                        className="input-field font-mono text-sm"
                        placeholder="Idée correspondante 1&#10;Idée correspondante 2&#10;Idée correspondante 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {item.content?.rightColumn?.length || 0} élément(s) dans la colonne 2
                      </p>
                    </div>

                    {/* Correspondances */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Correspondances (associer colonne 1 → colonne 2)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentMatches = item.content?.correctMatches || []
                            handleContentChange('correctMatches', [
                              ...currentMatches,
                              { left: 0, right: 0 }
                            ])
                          }}
                          className="btn-secondary text-sm"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(item.content?.correctMatches || []).map((match: { left: number; right: number }, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Correspondance {index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentMatches = item.content?.correctMatches || []
                                  handleContentChange('correctMatches', currentMatches.filter((_: any, i: number) => i !== index))
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Supprimer
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Index colonne 1 (0 = premier élément)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={(item.content?.leftColumn?.length || 1) - 1}
                                  value={match.left}
                                  onChange={(e) => {
                                    const currentMatches = item.content?.correctMatches || []
                                    const newMatches = [...currentMatches]
                                    newMatches[index] = { ...newMatches[index], left: parseInt(e.target.value) || 0 }
                                    handleContentChange('correctMatches', newMatches)
                                  }}
                                  className="input-field text-sm"
                                />
                                {item.content?.leftColumn?.[match.left] && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    "{item.content.leftColumn[match.left]}"
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Index colonne 2 (0 = premier élément)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={(item.content?.rightColumn?.length || 1) - 1}
                                  value={match.right}
                                  onChange={(e) => {
                                    const currentMatches = item.content?.correctMatches || []
                                    const newMatches = [...currentMatches]
                                    newMatches[index] = { ...newMatches[index], right: parseInt(e.target.value) || 0 }
                                    handleContentChange('correctMatches', newMatches)
                                  }}
                                  className="input-field text-sm"
                                />
                                {item.content?.rightColumn?.[match.right] && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    "{item.content.rightColumn[match.right]}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(!item.content?.correctMatches || item.content.correctMatches.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                          <p className="text-yellow-800 text-sm">
                            Aucune correspondance configurée. Ajoutez des correspondances pour définir les bonnes associations.
                          </p>
                        </div>
                      )}

                      {item.content?.leftColumn?.length > 0 && item.content?.rightColumn?.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                          <p className="text-blue-800 text-sm">
                            <strong>Astuce :</strong> Les index commencent à 0. Le premier élément de chaque colonne a l'index 0, le deuxième a l'index 1, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
