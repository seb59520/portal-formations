import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Save, Upload, Copy, Search, X } from 'lucide-react'
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
  const [showGameSelector, setShowGameSelector] = useState(false)
  const [availableGames, setAvailableGames] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingGames, setLoadingGames] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
    } else if (isNew) {
      // Vérifier si un type est spécifié dans l'URL
      const typeFromUrl = searchParams.get('type')
      if (typeFromUrl) {
        setItem(prev => ({ 
          ...prev, 
          type: typeFromUrl as Item['type'],
          module_id: moduleIdFromUrl || undefined
        }))
      } else if (moduleIdFromUrl) {
        setItem(prev => ({ ...prev, module_id: moduleIdFromUrl }))
      }
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
      
      // Pour les jeux, nettoyer le contenu pour éviter les erreurs TipTap
      // Si le contenu contient body mais que c'est un jeu, on retire body
      if (data.type === 'game' && data.content && data.content.body) {
        const { body, ...gameContent } = data.content
        data.content = gameContent
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
    if (!item.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }
    
    // Le module_id est optionnel - permet de créer des items indépendants
    // Si pas de module_id, l'item peut être utilisé via des blocs interactifs

    setSaving(true)
    setError('')

    try {
      let assetPath = item.asset_path

      // Upload du fichier si nouveau
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        // Utiliser module_id si disponible, sinon utiliser 'independent' pour les items indépendants
        const folder = item.module_id || 'independent'
        const fileName = `${folder}/${itemId || 'new'}/${Date.now()}.${fileExt}`

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

  const fetchAvailableGames = async () => {
    try {
      setLoadingGames(true)
      setError('')
      console.log('Fetching available games...')
      
      // Récupérer tous les jeux
      const { data: games, error: gamesError } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'game')
        .neq('id', itemId || '')
        .order('title', { ascending: true })

      if (gamesError) {
        console.error('Error fetching games:', gamesError)
        throw gamesError
      }

      console.log('Found games:', games?.length || 0)

      // Récupérer les modules et cours pour chaque jeu
      const gamesWithCourse = await Promise.all(
        (games || []).map(async (game) => {
          if (!game.module_id) {
            return { ...game, courseTitle: 'Cours inconnu' }
          }

          try {
            const { data: moduleData, error: moduleError } = await supabase
              .from('modules')
              .select('course_id')
              .eq('id', game.module_id)
              .single()

            if (moduleError) {
              console.warn('Error fetching module for game:', game.id, moduleError)
              return { ...game, courseTitle: 'Cours inconnu' }
            }

            if (moduleData?.course_id) {
              const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('title')
                .eq('id', moduleData.course_id)
                .single()

              if (courseError) {
                console.warn('Error fetching course for game:', game.id, courseError)
                return { ...game, courseTitle: 'Cours inconnu' }
              }

              return {
                ...game,
                courseTitle: courseData?.title || 'Cours inconnu'
              }
            }
          } catch (err) {
            console.warn('Error processing game:', game.id, err)
          }

          return { ...game, courseTitle: 'Cours inconnu' }
        })
      )

      console.log('Games with course info:', gamesWithCourse.length)
      setAvailableGames(gamesWithCourse)
    } catch (error: any) {
      console.error('Error fetching games:', error)
      setError(`Erreur lors de la recherche des jeux: ${error?.message || 'Erreur inconnue'}`)
      setAvailableGames([])
    } finally {
      setLoadingGames(false)
    }
  }

  const handleOpenGameSelector = () => {
    setShowGameSelector(true)
    setSearchTerm('')
    fetchAvailableGames()
  }

  const handleDuplicateGame = (sourceGame: Item) => {
    try {
      console.log('Duplicating game:', sourceGame)
      
      // Le contenu peut être un objet JSON ou déjà parsé
      let gameContent = sourceGame.content
      if (typeof gameContent === 'string') {
        try {
          gameContent = JSON.parse(gameContent)
        } catch (e) {
          console.error('Error parsing game content:', e)
          setError('Le contenu du jeu source n\'est pas valide.')
          return
        }
      }

      if (!gameContent || typeof gameContent !== 'object') {
        setError('Le jeu source n\'a pas de contenu valide.')
        return
      }

      // Copier les données du jeu source en profondeur
      const newContent: any = {
        gameType: gameContent.gameType || 'matching',
        description: gameContent.description || '',
        instructions: gameContent.instructions || '',
      }

      // Copier les paires pour les jeux d'association de cartes
      if (gameContent.pairs && Array.isArray(gameContent.pairs)) {
        newContent.pairs = gameContent.pairs.map((pair: any) => ({
          term: pair.term || '',
          definition: pair.definition || ''
        }))
      } else {
        newContent.pairs = []
      }

      // Copier les colonnes pour les jeux d'association de colonnes
      if (gameContent.leftColumn && Array.isArray(gameContent.leftColumn)) {
        newContent.leftColumn = [...gameContent.leftColumn]
      } else {
        newContent.leftColumn = []
      }

      if (gameContent.rightColumn && Array.isArray(gameContent.rightColumn)) {
        newContent.rightColumn = [...gameContent.rightColumn]
      } else {
        newContent.rightColumn = []
      }

      // Copier les correspondances
      if (gameContent.correctMatches && Array.isArray(gameContent.correctMatches)) {
        newContent.correctMatches = gameContent.correctMatches.map((match: any) => ({
          left: match.left || 0,
          right: match.right || 0
        }))
      } else {
        newContent.correctMatches = []
      }

      console.log('New content:', newContent)

      setItem({
        ...item,
        content: newContent,
        title: item.title || sourceGame.title || 'Nouveau jeu'
      })

      setShowGameSelector(false)
      setError('')
      setSuccessMessage('Jeu dupliqué avec succès ! Les données ont été copiées.')
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Afficher un message de succès
      console.log('Game duplicated successfully!')
    } catch (error: any) {
      console.error('Error duplicating game:', error)
      setError(`Erreur lors de la duplication: ${error?.message || 'Erreur inconnue'}`)
    }
  }

  const filteredGames = availableGames.filter(game =>
    game.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (game as any).courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
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

            {/* Contenu principal avec éditeur riche - seulement pour les types qui utilisent body */}
            {!isNew && itemId && item.type !== 'game' && (
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Mini-jeu</h3>
                  <button
                    type="button"
                    onClick={handleOpenGameSelector}
                    className="btn-secondary inline-flex items-center space-x-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Dupliquer depuis un autre jeu</span>
                  </button>
                </div>
                
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
                    <option value="api-types">Types d'API</option>
                    <option value="format-files">Formats de fichiers (JSON/XML/Protobuf)</option>
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

                {item.content?.gameType === 'api-types' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        <strong>Note :</strong> Pour configurer ce type de jeu (Types d'API), utilisez l'éditeur JSON 
                        (<Link to={`/admin/items/${itemId}/json`} className="underline">Éditeur JSON</Link>) 
                        car la structure est complexe (apiTypes, scenarios).
                      </p>
                    </div>
                  </div>
                )}

                {item.content?.gameType === 'format-files' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm mb-2">
                        <strong>Jeu : Formats de fichiers (JSON / XML / Protobuf)</strong>
                      </p>
                      <p className="text-green-700 text-sm mb-3">
                        Ce jeu comprend 3 niveaux de difficulté avec différents types de questions.
                      </p>
                      <p className="text-green-800 text-sm">
                        <strong>Configuration :</strong> Pour configurer ce jeu, utilisez l'éditeur JSON 
                        (<Link to={`/admin/items/${itemId}/json`} className="underline font-semibold">Éditeur JSON</Link>) 
                        car la structure est complexe (niveaux, questions avec différents types).
                      </p>
                      <p className="text-green-700 text-xs mt-2">
                        Le jeu utilise par défaut les 30 questions prédéfinies si aucun niveau n'est spécifié dans le JSON.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modale de sélection de jeu */}
      {showGameSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Sélectionner un jeu à dupliquer</h2>
              <button
                onClick={() => setShowGameSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre ou cours..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingGames ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Aucun jeu trouvé pour cette recherche.' : 'Aucun jeu disponible.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGames.map((game) => (
                      <div
                        key={game.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleDuplicateGame(game)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{game.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {(game as any).courseTitle}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                              <span>
                                Type: {
                                  game.content?.gameType === 'matching' ? 'Association de cartes' :
                                  game.content?.gameType === 'column-matching' ? 'Association de colonnes' :
                                  game.content?.gameType === 'api-types' ? 'Types d\'API' :
                                  game.content?.gameType === 'format-files' ? 'Formats de fichiers' :
                                  'Autre'
                                }
                              </span>
                              {game.content?.gameType === 'matching' && game.content?.pairs && (
                                <span>{game.content.pairs.length} paire(s)</span>
                              )}
                              {game.content?.gameType === 'column-matching' && (
                                <span>
                                  {game.content?.leftColumn?.length || 0} / {game.content?.rightColumn?.length || 0} éléments
                                </span>
                              )}
                              {game.content?.gameType === 'api-types' && game.content?.apiTypes && (
                                <span>{game.content.apiTypes.length} type(s) d'API</span>
                              )}
                              {game.content?.gameType === 'format-files' && game.content?.levels && (
                                <span>{game.content.levels.length} niveau(x)</span>
                              )}
                            </div>
                          </div>
                          <Copy className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowGameSelector(false)}
                className="btn-secondary w-full"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
