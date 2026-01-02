import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Save, Upload, Download, Code, Eye, ArrowLeft } from 'lucide-react'
import { ReactItemRenderer } from '../../components/ReactItemRenderer'

export interface ChapterJson {
  title: string
  position: number
  content?: any // Format TipTap JSON
  type?: 'content' | 'game' // Type de chapitre : contenu normal ou jeu
  game_content?: any // Contenu du jeu si type === 'game'
}

export interface ItemJson {
  type: 'resource' | 'slide' | 'exercise' | 'tp' | 'game'
  title: string
  position: number
  published?: boolean
  content: {
    body?: any
    description?: string
    question?: any
    correction?: any
    instructions?: any
    checklist?: string[]
    gameType?: string
    pairs?: Array<{ term: string; definition: string }>
    leftColumn?: string[]
    rightColumn?: string[]
    correctMatches?: Array<{ left: number; right: number }>
    apiTypes?: any[]
    scenarios?: any[]
    levels?: Array<{
      level: number
      name: string
      questions: Array<{
        id: string
        type: 'identify-format' | 'json-valid' | 'fix-json-mcq' | 'fix-json-editor' | 'choose-format'
        prompt: string
        snippet?: string
        options?: string[]
        answer: string | boolean
        explanation: string
        difficulty: number
      }>
    }>
    [key: string]: any
  }
  chapters?: ChapterJson[] // Chapitres intégrés dans le JSON
  asset_path?: string
  external_url?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
}

export function AdminItemEditJson() {
  const { itemId } = useParams<{ itemId: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = itemId === 'new'
  const moduleIdFromUrl = searchParams.get('module_id')

  const [item, setItem] = useState<Item | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [parsedJson, setParsedJson] = useState<ItemJson | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [previewMode, setPreviewMode] = useState(false)
  const [moduleTitle, setModuleTitle] = useState<string>('')

  useEffect(() => {
    if (!isNew && itemId) {
      fetchItem()
    } else {
      // Template JSON par défaut
      const defaultJson: ItemJson = {
        type: 'resource',
        title: 'Nouvel élément',
        position: 0,
        published: true,
        content: {},
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          fontFamily: 'Inter'
        }
      }
      setJsonContent(JSON.stringify(defaultJson, null, 2))
      setParsedJson(defaultJson)
      setLoading(false)
    }
  }, [itemId, isNew, moduleIdFromUrl])

  const fetchItem = async () => {
    try {
      setError('')
      
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          modules (
            id,
            title,
            course_id,
            courses (
              id,
              title
            )
          )
        `)
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      
      setItem(itemData)
      
      if (itemData.modules) {
        setModuleTitle(itemData.modules.title || '')
      }

      // Récupérer les chapitres
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('item_id', itemId)
        .order('position', { ascending: true })

      // Construire le JSON
      const itemJson: ItemJson = {
        type: itemData.type as ItemJson['type'],
        title: itemData.title,
        position: itemData.position,
        published: itemData.published,
        content: itemData.content || {},
        asset_path: itemData.asset_path || undefined,
        external_url: itemData.external_url || undefined,
        chapters: (chaptersData || []).map(ch => ({
          title: ch.title,
          position: ch.position,
          content: ch.content || undefined
        }))
      }

      setJsonContent(JSON.stringify(itemJson, null, 2))
      setParsedJson(itemJson)
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      const parsed = JSON.parse(value) as ItemJson
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
      setError('JSON invalide. Veuillez corriger les erreurs.')
      return
    }

    if (!parsedJson.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Déterminer le module_id
      let moduleId = moduleIdFromUrl || item?.module_id

      if (!moduleId && isNew) {
        setError('Le module_id est obligatoire. Ajoutez ?module_id=XXX à l\'URL ou créez l\'élément depuis la page du module.')
        setSaving(false)
        return
      }

      if (!moduleId) {
        setError('Module ID manquant.')
        setSaving(false)
        return
      }

      const itemData = {
        module_id: moduleId,
        type: parsedJson.type,
        title: parsedJson.title.trim(),
        position: parsedJson.position,
        published: parsedJson.published !== false,
        content: parsedJson.content || {},
        asset_path: parsedJson.asset_path || null,
        external_url: parsedJson.external_url || null,
        updated_at: new Date().toISOString()
      }

      let finalItemId = itemId

      if (isNew) {
        const { data, error } = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error
        finalItemId = data.id
        // Rediriger vers la page d'édition avec le nouvel ID
        navigate(`/admin/items/${data.id}/json`, { replace: true })
      } else {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', itemId)

        if (error) throw error
        finalItemId = itemId
      }

      // Gérer les chapitres
      if (parsedJson.chapters && finalItemId) {
        // Supprimer les anciens chapitres
        if (!isNew) {
          await supabase
            .from('chapters')
            .delete()
            .eq('item_id', finalItemId)
        }

        // Créer les nouveaux chapitres
        if (parsedJson.chapters.length > 0) {
          const chaptersData = parsedJson.chapters.map(ch => {
            // S'assurer que le type est valide ('content' ou 'game')
            const validType = (ch.type === 'content' || ch.type === 'game') ? ch.type : 'content'
            
            return {
              item_id: finalItemId,
              title: ch.title,
              position: ch.position,
              content: ch.content || null,
              type: validType,
              game_content: ch.game_content || null,
              published: ch.published !== undefined ? ch.published : true
            }
          })

          const { error: chaptersError } = await supabase
            .from('chapters')
            .insert(chaptersData)

          if (chaptersError) throw chaptersError
        }
      }
      
      // Recharger les données
      if (!isNew) {
        await fetchItem()
      }
    } catch (error) {
      console.error('Error saving item:', error)
      setError(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    if (!parsedJson) return

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsedJson.title.replace(/\s+/g, '-')}.json`
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
        const parsed = JSON.parse(content) as ItemJson
        setJsonContent(JSON.stringify(parsed, null, 2))
        setParsedJson(parsed)
        setError('')
      } catch (error) {
        setError('Erreur lors de la lecture du fichier JSON.')
      }
    }
    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getItemTypeExamples = () => {
    const type = parsedJson?.type || 'resource'
    
    const examples: Record<string, any> = {
      resource: {
        type: 'resource',
        title: 'Titre de la ressource',
        position: 1,
        published: true,
        content: {
          body: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Contenu de la ressource...' }]
              }
            ]
          },
          description: 'Description courte de la ressource'
        },
        external_url: 'https://example.com',
        asset_path: 'module1/resource.pdf'
      },
      slide: {
        type: 'slide',
        title: 'Titre du support',
        position: 1,
        published: true,
        content: {
          description: 'Description du support projeté'
        },
        asset_path: 'module1/slide.pdf'
      },
      exercise: {
        type: 'exercise',
        title: 'Titre de l\'exercice',
        position: 1,
        published: true,
        content: {
          question: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Énoncé de l\'exercice...' }]
              }
            ]
          },
          correction: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Correction de l\'exercice...' }]
              }
            ]
          }
        }
      },
      tp: {
        type: 'tp',
        title: 'Titre du TP',
        position: 1,
        published: true,
        content: {
          instructions: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Instructions du TP...' }]
              }
            ]
          },
          checklist: [
            'Tâche 1',
            'Tâche 2',
            'Tâche 3'
          ]
        }
      },
      game: {
        type: 'game',
        title: 'Titre du jeu',
        position: 1,
        published: true,
        content: {
          gameType: 'matching',
          description: 'Description du jeu',
          instructions: 'Instructions pour jouer',
          pairs: [
            { term: 'Terme 1', definition: 'Définition 1' },
            { term: 'Terme 2', definition: 'Définition 2' }
          ]
        },
      },
      'game-format-files': {
        type: 'game',
        title: 'Jeu : Formats de fichiers (JSON / XML / Protobuf)',
        position: 1,
        published: true,
        content: {
          gameType: 'format-files',
          description: 'Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf',
          instructions: 'Répondez aux questions pour progresser dans les 3 niveaux de difficulté',
          levels: [
            {
              level: 1,
              name: 'Découverte',
              questions: [
                {
                  id: 'q1-1',
                  type: 'identify-format',
                  prompt: 'Quel est ce format de données ?',
                  snippet: '{\n  "name": "John",\n  "age": 30\n}',
                  options: ['JSON', 'XML', 'Protobuf'],
                  answer: 'JSON',
                  explanation: "C'est du JSON car il utilise des accolades {} et des paires clé-valeur avec des guillemets.",
                  difficulty: 1
                }
              ]
            }
          ]
        },
        chapters: [
          {
            title: 'Chapitre 1 : Introduction',
            position: 1,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Contenu du premier chapitre...' }]
                }
              ]
            }
          },
          {
            title: 'Chapitre 2 : Approfondissement',
            position: 2,
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Contenu du deuxième chapitre...' }]
                }
              ]
            }
          }
        ]
      }
    }

    return examples[type] || examples.resource
  }

  const loadExample = () => {
    const example = getItemTypeExamples()
    setJsonContent(JSON.stringify(example, null, 2))
    setParsedJson(example)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to={item?.module_id ? `/admin/courses/${item.modules?.course_id}` : '/admin'}
                className="text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNew ? 'Nouvel élément (JSON)' : 'Modifier l\'élément (JSON)'}
                </h1>
                {moduleTitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    Module: {moduleTitle}
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
                <span>{previewMode ? 'Éditer' : 'Prévisualiser'}</span>
              </button>
              <label className="btn-secondary inline-flex items-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importer JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                disabled={!parsedJson}
                className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !parsedJson || !!error}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {previewMode && parsedJson ? (
            <div className="bg-white shadow rounded-lg p-6">
              <ReactItemRenderer itemJson={parsedJson} />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>JSON de l'élément</span>
                  </h2>
                  {parsedJson && (
                    <span className="text-sm text-gray-500">
                      Type: <span className="font-semibold capitalize">{parsedJson.type}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    {parsedJson ? '✓ JSON valide' : '⚠ JSON invalide'}
                  </div>
                  <button
                    onClick={loadExample}
                    className="btn-secondary text-sm ml-4"
                  >
                    Charger un exemple
                  </button>
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[calc(100vh-400px)] font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Collez votre JSON ici..."
                spellCheck={false}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Structure JSON attendue :</p>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
{`{
  "type": "resource" | "slide" | "exercise" | "tp" | "game",
  "title": "Titre de l'élément",
  "position": 1,
  "published": true,
  "content": {
    // Contenu selon le type
    "body": { ... },           // Pour resource/slide
    "question": { ... },       // Pour exercise
    "correction": { ... },     // Pour exercise
    "instructions": { ... },   // Pour tp
    "checklist": [ ... ],      // Pour tp
    "gameType": "matching",    // Pour game
    "pairs": [ ... ],          // Pour game (matching)
    "leftColumn": [ ... ],     // Pour game (column-matching)
    "rightColumn": [ ... ],    // Pour game (column-matching)
    "correctMatches": [ ... ]  // Pour game (column-matching)
  },
  "chapters": [                // Chapitres intégrés (optionnel)
    {
      "title": "Titre du chapitre",
      "position": 1,
      "content": { ... }        // Format TipTap JSON
    }
  ],
  "asset_path": "chemin/vers/fichier.pdf",
  "external_url": "https://example.com",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

