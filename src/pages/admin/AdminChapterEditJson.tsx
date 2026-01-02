import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Save, Upload, Download, Code, Eye, ArrowLeft } from 'lucide-react'
import { RichTextEditor } from '../../components/RichTextEditor'

export interface ChapterJson {
  title: string
  position: number
  content?: any // Format TipTap JSON
  type?: 'content' | 'game' // Type de chapitre : contenu normal ou jeu
  game_content?: any // Contenu du jeu si type === 'game'
}

export function AdminChapterEditJson() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const itemIdFromUrl = searchParams.get('item_id')
  
  // Déterminer si c'est un nouveau chapitre
  const isNew = !chapterId || chapterId === 'new' || chapterId === 'undefined'

  const [chapter, setChapter] = useState<any | null>(null)
  const [itemTitle, setItemTitle] = useState<string>('')
  const [jsonContent, setJsonContent] = useState<string>('')
  const [parsedJson, setParsedJson] = useState<ChapterJson | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Log pour débogage
  useEffect(() => {
    console.log('Component mounted - chapterId:', chapterId, 'isNew:', isNew, 'itemIdFromUrl:', itemIdFromUrl)
  }, [chapterId, isNew, itemIdFromUrl])

  useEffect(() => {
    if (!isNew && chapterId) {
      fetchChapter()
    } else {
      // Template JSON par défaut
      const defaultJson: ChapterJson = {
        title: 'Nouveau chapitre',
        position: 0,
        content: null,
        type: 'content'
      }
      setJsonContent(JSON.stringify(defaultJson, null, 2))
      setParsedJson(defaultJson)
      setLoading(false)
    }
  }, [chapterId, isNew, itemIdFromUrl])

  const fetchChapter = async () => {
    try {
      setError('')
      
      // Vérifier que chapterId existe
      if (!chapterId || chapterId === 'new' || chapterId === 'undefined') {
        setError('ID du chapitre manquant dans l\'URL.')
        setLoading(false)
        return
      }
      
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select(`
          *,
          items (
            id,
            title,
            module_id,
            modules (
              id,
              title,
              course_id,
              courses (
                id,
                title
              )
            )
          )
        `)
        .eq('id', chapterId)
        .single()

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError)
        throw chapterError
      }

      if (!chapterData) {
        setError('Chapitre non trouvé.')
        setLoading(false)
        return
      }
      
      setChapter(chapterData)
      
      if (chapterData.items) {
        setItemTitle(chapterData.items.title || '')
      }

      // Vérifier que item_id existe
      if (!chapterData.item_id) {
        console.error('Chapter data:', chapterData)
        setError('Erreur: item_id manquant dans les données du chapitre.')
        setLoading(false)
        return
      }

      // Construire le JSON
      const chapterJson: ChapterJson = {
        title: chapterData.title,
        position: chapterData.position,
        content: chapterData.content || undefined,
        type: chapterData.type || 'content',
        game_content: chapterData.game_content || undefined
      }

      setJsonContent(JSON.stringify(chapterJson, null, 2))
      setParsedJson(chapterJson)
    } catch (error) {
      console.error('Error fetching chapter:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      const parsed = JSON.parse(value) as ChapterJson
      setParsedJson(parsed)
      setError('')
    } catch (e) {
      // Ne pas afficher d'erreur pendant la saisie
      if (value.trim() !== '') {
        setError('JSON invalide')
      }
    }
  }

  const handleSave = async () => {
    if (!parsedJson) {
      setError('JSON invalide')
      return
    }

    if (!parsedJson.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Déterminer l'item_id
      let itemId: string | undefined
      
      // Vérifier à nouveau isNew au moment de la sauvegarde
      // chapterId devrait être 'new' pour un nouveau chapitre
      const currentIsNew = !chapterId || chapterId === 'new' || chapterId === 'undefined' || chapterId === undefined
      
      console.log('=== SAVE ATTEMPT ===')
      console.log('chapterId:', chapterId, 'Type:', typeof chapterId)
      console.log('isNew (state):', isNew)
      console.log('currentIsNew:', currentIsNew)
      console.log('itemIdFromUrl:', itemIdFromUrl, 'Type:', typeof itemIdFromUrl)
      console.log('===================')
      
      if (currentIsNew) {
        console.log('Entering NEW chapter branch')
        if (!itemIdFromUrl) {
          console.error('item_id missing from URL')
          setError('item_id est requis pour créer un nouveau chapitre. Ajoutez ?item_id=... à l\'URL.')
          setSaving(false)
          return
        }
        
        // Valider que itemIdFromUrl est un UUID valide
        if (itemIdFromUrl === 'undefined' || itemIdFromUrl === 'null' || !itemIdFromUrl.trim()) {
          console.error('Invalid item_id from URL:', itemIdFromUrl)
          setError(`item_id invalide dans l'URL: ${itemIdFromUrl}`)
          setSaving(false)
          return
        }
        
        itemId = itemIdFromUrl.trim()
        console.log('Using item_id from URL:', itemId)
      } else {
        // Pour un chapitre existant, récupérer item_id depuis la base de données
        // On récupère toujours depuis la base pour être sûr d'avoir la bonne valeur
        
        // Vérifier que chapterId existe
        const currentChapterId = chapterId
        if (!currentChapterId || currentChapterId === 'new' || currentChapterId === 'undefined') {
          console.error('Invalid chapterId:', currentChapterId)
          setError('ID du chapitre manquant ou invalide. Veuillez recharger la page.')
          setSaving(false)
          return
        }

        console.log('Fetching item_id for chapter:', currentChapterId)
        const { data: chapterData, error: fetchError } = await supabase
          .from('chapters')
          .select('item_id')
          .eq('id', currentChapterId)
          .single()
        
        if (fetchError) {
          console.error('Error fetching chapter item_id:', fetchError)
          setError(`Erreur lors de la récupération des données: ${fetchError.message}`)
          setSaving(false)
          return
        }

        if (!chapterData || !chapterData.item_id) {
          console.error('Chapter data:', chapterData)
          setError('Impossible de récupérer l\'item_id du chapitre. Le chapitre existe-t-il ?')
          setSaving(false)
          return
        }
        
        itemId = chapterData.item_id
      }

      if (!itemId || itemId === 'undefined' || itemId === 'null' || typeof itemId !== 'string') {
        console.error('Invalid item_id:', itemId, 'Type:', typeof itemId)
        setError(`item_id invalide: ${itemId}. Veuillez vérifier que l'item_id est correct.`)
        setSaving(false)
        return
      }

      // S'assurer que le type est valide ('content' ou 'game')
      const validType = (parsedJson.type === 'content' || parsedJson.type === 'game') ? parsedJson.type : 'content'
      
      const chapterData = {
        title: parsedJson.title,
        position: parsedJson.position ?? 0,
        content: parsedJson.content || null,
        type: validType,
        game_content: parsedJson.game_content || null,
        published: parsedJson.published !== undefined ? parsedJson.published : true,
        item_id: itemId,
        updated_at: new Date().toISOString()
      }

      if (currentIsNew) {
        console.log('Creating new chapter with item_id:', itemId)
        const { data: newChapter, error: insertError } = await supabase
          .from('chapters')
          .insert(chapterData)
          .select()
          .single()

        if (insertError) {
          console.error('Insert error details:', insertError)
          throw insertError
        }

        console.log('Chapter created successfully:', newChapter)
        // Rediriger vers l'édition du chapitre créé
        navigate(`/admin/chapters/${newChapter.id}/json`)
      } else {
        // Utiliser chapterId depuis useParams
        const currentChapterId = chapterId
        if (!currentChapterId || currentChapterId === 'new' || currentChapterId === 'undefined') {
          setError('ID du chapitre manquant. Veuillez recharger la page.')
          setSaving(false)
          return
        }

        const { error: updateError } = await supabase
          .from('chapters')
          .update({
            title: chapterData.title,
            position: chapterData.position,
            content: chapterData.content,
            type: chapterData.type,
            game_content: chapterData.game_content,
            published: chapterData.published,
            updated_at: chapterData.updated_at
          })
          .eq('id', currentChapterId)

        if (updateError) {
          console.error('Update error details:', updateError)
          throw updateError
        }

        // Recharger les données
        await fetchChapter()
      }

      setError('')
      alert('Chapitre sauvegardé avec succès!')
    } catch (error: any) {
      console.error('Error saving chapter:', error)
      setError(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chapter-${chapterId || 'new'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content) as ChapterJson
        setJsonContent(JSON.stringify(parsed, null, 2))
        setParsedJson(parsed)
        setError('')
      } catch (error) {
        setError('Erreur lors de l\'import: JSON invalide')
      }
    }
    reader.readAsText(file)
  }

  const loadExampleJson = () => {
    const example: ChapterJson = {
      title: 'Exemple de chapitre',
      position: 0,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Contenu du chapitre en format TipTap JSON.'
              }
            ]
          }
        ]
      }
    }
    setJsonContent(JSON.stringify(example, null, 2))
    setParsedJson(example)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={chapter?.item_id ? `/admin/items/${chapter.item_id}/edit` : itemIdFromUrl ? `/admin/items/${itemIdFromUrl}/edit` : '/admin/items'}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNew ? 'Nouveau chapitre (JSON)' : `Éditer le chapitre (JSON)`}
              </h1>
              {itemTitle && (
                <p className="text-sm text-gray-600 mt-1">
                  Item: {itemTitle}
                </p>
              )}
              {isNew && itemIdFromUrl && (
                <p className="text-sm text-blue-600 mt-1">
                  Item ID: {itemIdFromUrl}
                </p>
              )}
              {isNew && !itemIdFromUrl && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ item_id manquant dans l'URL
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{previewMode ? 'Masquer' : 'Afficher'} l'aperçu</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!error}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Éditeur JSON */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>JSON du chapitre</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadExampleJson}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Exemple
                  </button>
                  <label className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Importer
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExport}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Exporter
                  </button>
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[600px] font-mono text-sm border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Collez votre JSON ici..."
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Structure attendue:</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`{
  "title": "Titre du chapitre",
  "position": 0,
  "content": {
    // Format TipTap JSON (optionnel)
  }
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Aperçu</h2>
              {previewMode && parsedJson ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {parsedJson.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Position: {parsedJson.position}
                    </p>
                  </div>
                  {parsedJson.content && (
                    <div className="border-t pt-4">
                      <RichTextEditor
                        content={parsedJson.content}
                        onChange={() => {}}
                        editable={false}
                      />
                    </div>
                  )}
                  {!parsedJson.content && (
                    <p className="text-gray-500 italic">Aucun contenu défini</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Activez l'aperçu pour voir le rendu</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

