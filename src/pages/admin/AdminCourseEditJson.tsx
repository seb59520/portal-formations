import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course } from '../../types/database'
import { Save, Upload, Download, Code, Eye } from 'lucide-react'
import { ReactRenderer } from '../../components/ReactRenderer'
import { CourseJson } from '../../types/courseJson'

export function AdminCourseEditJson() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  // isNew est true si courseId est 'new', undefined, ou null
  const isNew = !courseId || courseId === 'new'

  const [, setCourse] = useState<Course | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [parsedJson, setParsedJson] = useState<CourseJson | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (!isNew && courseId) {
      fetchCourse()
    } else {
      // Template JSON par défaut
      const defaultJson: CourseJson = {
        title: 'Nouveau cours',
        description: 'Description du cours',
        status: 'draft',
        access_type: 'free',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          fontFamily: 'Inter'
        },
        modules: []
      }
      setJsonContent(JSON.stringify(defaultJson, null, 2))
      setParsedJson(defaultJson)
      setLoading(false)
    }
  }, [courseId, isNew])

  const fetchCourse = async () => {
    try {
      // Récupérer le cours
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Récupérer les modules avec items
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          items (*)
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true })

      if (modulesError) throw modulesError

      // Récupérer tous les chapitres pour tous les items
      const allItemIds = (modulesData || []).flatMap(m => (m.items || []).map((i: any) => i.id))
      let chaptersMap = new Map<string, any[]>()
      
      if (allItemIds.length > 0) {
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .in('item_id', allItemIds)
          .order('position', { ascending: true })

        if (chaptersData) {
          chaptersData.forEach(ch => {
            if (!chaptersMap.has(ch.item_id)) {
              chaptersMap.set(ch.item_id, [])
            }
            chaptersMap.get(ch.item_id)!.push({
              title: ch.title,
              position: ch.position,
              content: ch.content || undefined
            })
          })
        }
      }

      // Construire le JSON
      const courseJson: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: (modulesData || []).map(module => ({
          title: module.title,
          position: module.position,
          items: (module.items || []).sort((a: any, b: any) => a.position - b.position).map((item: any) => ({
            type: item.type,
            title: item.title,
            position: item.position,
            published: item.published,
            content: item.content || {},
            asset_path: item.asset_path || undefined,
            external_url: item.external_url || undefined,
            chapters: chaptersMap.get(item.id) || undefined
          }))
        }))
      }

      setJsonContent(JSON.stringify(courseJson, null, 2))
      setParsedJson(courseJson)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    try {
      const parsed = JSON.parse(value) as CourseJson
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

    if (!user?.id) {
      setError('Vous devez être connecté pour sauvegarder un cours.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const courseData = {
        title: parsedJson.title,
        description: parsedJson.description,
        status: parsedJson.status,
        access_type: parsedJson.access_type,
        price_cents: parsedJson.price_cents || null,
        currency: parsedJson.currency || 'EUR',
        is_paid: parsedJson.access_type === 'paid',
        created_by: user.id,
        updated_at: new Date().toISOString()
      }

      let finalCourseId: string | undefined

      // Créer ou mettre à jour le cours
      if (isNew) {
        // Mode création : insérer un nouveau cours
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error
        if (!data?.id) {
          throw new Error('Le cours a été créé mais aucun ID n\'a été retourné.')
        }
        finalCourseId = data.id
        navigate(`/admin/courses/${data.id}/json`, { replace: true })
      } else {
        // Mode édition : mettre à jour le cours existant
        if (!courseId) {
          throw new Error('ID du cours manquant. Veuillez recharger la page.')
        }
        
        // Vérifier que le cours existe
        const { data: existingCourse, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', courseId)
          .single()

        if (checkError || !existingCourse) {
          throw new Error('Le cours à modifier n\'existe pas. Veuillez recharger la page.')
        }

        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)

        if (error) throw error
        finalCourseId = courseId
      }

      // Vérifier que finalCourseId est défini avant de continuer
      if (!finalCourseId) {
        throw new Error('ID du cours non défini. Impossible de continuer la sauvegarde.')
      }

      // Supprimer les anciens modules et items
      if (!isNew) {
        const { data: oldModules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', finalCourseId)

        if (oldModules && oldModules.length > 0) {
          await supabase
            .from('modules')
            .delete()
            .in('id', oldModules.map(m => m.id))
        }
      }

      // Créer les nouveaux modules et items
      for (const module of parsedJson.modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_id: finalCourseId,
            title: module.title,
            position: module.position
          })
          .select()
          .single()

        if (moduleError) throw moduleError
        if (!moduleData?.id) {
          throw new Error(`Le module "${module.title}" a été créé mais aucun ID n'a été retourné.`)
        }

        // Créer les items du module
        if (module.items && module.items.length > 0) {
          // Fonction pour valider et normaliser le type d'item
          const validateItemType = (type: string | undefined | null): 'resource' | 'slide' | 'exercise' | 'tp' | 'game' => {
            if (!type) {
              throw new Error('Le type d\'item est requis.')
            }
            
            const normalizedType = type.toLowerCase().trim()
            
            // Mapping des variantes possibles vers les types valides
            const typeMap: Record<string, 'resource' | 'slide' | 'exercise' | 'tp' | 'game'> = {
              'resource': 'resource',
              'slide': 'slide',
              'slides': 'slide',
              'exercise': 'exercise',
              'exercice': 'exercise',
              'exercises': 'exercise',
              'case': 'exercise', // Étude de cas → exercice
              'case-study': 'exercise',
              'case study': 'exercise',
              'étude de cas': 'exercise',
              'etude de cas': 'exercise',
              'tp': 'tp',
              'travaux-pratiques': 'tp',
              'travaux pratiques': 'tp',
              'game': 'game',
              'jeu': 'game',
              'games': 'game',
              'jeux': 'game'
            }
            
            const validType = typeMap[normalizedType]
            
            if (!validType) {
              throw new Error(`Type d'item invalide: "${type}". Types autorisés: resource, slide, exercise, tp, game`)
            }
            
            return validType
          }

          const itemsData = module.items.map((item, index) => {
            try {
              const validatedType = validateItemType(item.type)
              
              return {
                module_id: moduleData.id,
                type: validatedType,
                title: item.title || `Item ${index + 1}`,
                position: item.position ?? index,
                published: item.published !== false,
                content: item.content || {},
                asset_path: item.asset_path || null,
                external_url: item.external_url || null
              }
            } catch (error: any) {
              throw new Error(`Erreur dans l'item "${item.title || `à la position ${index + 1}`}": ${error.message}`)
            }
          })

          const { data: savedItems, error: itemsError } = await supabase
            .from('items')
            .insert(itemsData)
            .select()

          if (itemsError) throw itemsError
          if (!savedItems || savedItems.length === 0) {
            console.warn(`Aucun item n'a été créé pour le module "${module.title}"`)
            continue
          }

          // Créer les chapitres pour chaque item
          for (let i = 0; i < savedItems.length; i++) {
            const savedItem = savedItems[i]
            const originalItem = module.items[i]
            
            if (!savedItem?.id) {
              console.warn(`L'item "${originalItem.title}" n'a pas d'ID, impossible de créer les chapitres`)
              continue
            }
            
            if (originalItem.chapters && originalItem.chapters.length > 0) {
              const chaptersData = originalItem.chapters.map((ch: any) => {
                // S'assurer que le type est valide ('content' ou 'game')
                const validType = (ch.type === 'content' || ch.type === 'game') ? ch.type : 'content'
                
                return {
                  item_id: savedItem.id,
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

              if (chaptersError) {
                console.error('Error creating chapters for item:', savedItem.id, chaptersError)
                // Ne pas bloquer la sauvegarde si les chapitres échouent
              }
            }
          }
        }
      }

      // Recharger les données
      if (!isNew) {
        await fetchCourse()
      }
    } catch (error: any) {
      console.error('Error saving course:', error)
      
      // Extraire le message d'erreur de manière plus détaillée
      let errorMessage = 'Erreur inconnue'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Erreur ${error.code}: ${error.message || error.details || 'Erreur inconnue'}`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      }
      
      // Ajouter des informations supplémentaires si disponibles
      if (error?.code) {
        errorMessage += ` (Code: ${error.code})`
      }
      
      setError(`Erreur lors de la sauvegarde: ${errorMessage}`)
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
        const parsed = JSON.parse(content) as CourseJson
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
                {isNew ? 'Nouveau cours (JSON)' : 'Modifier le cours (JSON)'}
              </h1>
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
              <ReactRenderer courseJson={parsedJson} />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>JSON du cours</span>
                </h2>
                <div className="text-sm text-gray-500">
                  {parsedJson ? '✓ JSON valide' : '⚠ JSON invalide'}
                </div>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[calc(100vh-300px)] font-mono text-sm border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Collez votre JSON ici..."
                spellCheck={false}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Structure JSON attendue :</p>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
{`{
  "title": "Titre du cours",
  "description": "Description",
  "status": "draft" | "published",
  "access_type": "free" | "paid" | "invite",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Titre du module",
      "position": 1,
      "theme": { ... },
      "items": [
        {
          "type": "resource" | "slide" | "exercise" | "tp" | "game",
          "title": "Titre de l'item",
          "position": 1,
          "published": true,
          "content": { ... },
          "chapters": [                    // Chapitres intégrés (optionnel)
            {
              "title": "Titre du chapitre",
              "position": 1,
              "content": { ... }            // Format TipTap JSON
            }
          ]
        }
      ]
    }
  ]
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

