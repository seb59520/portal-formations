import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course, Module, Item } from '../../types/database'
import { Save, Plus, Edit, Trash2, GripVertical } from 'lucide-react'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function AdminCourseEdit() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = courseId === 'new'

  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    status: 'draft',
    access_type: 'free',
    price_cents: null,
    currency: 'EUR',
    is_paid: false,
    created_by: user?.id
  })
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew && courseId) {
      fetchCourse()
    }
  }, [courseId, isNew])

  const fetchCourse = async () => {
    try {
      // Récupérer la formation
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

      const sortedModules = modulesData?.map(module => ({
        ...module,
        items: module.items?.sort((a: Item, b: Item) => a.position - b.position) || []
      })) || []

      setModules(sortedModules)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!course.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const courseData = {
        ...course,
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single()

        if (error) throw error
        navigate(`/admin/courses/${data.id}`)
      } else {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)

        if (error) throw error
        await fetchCourse() // Recharger pour voir les changements
      }
    } catch (error) {
      console.error('Error saving course:', error)
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const addModule = () => {
    const newModule: ModuleWithItems = {
      id: `temp-${Date.now()}`,
      course_id: courseId || '',
      title: 'Nouveau module',
      position: modules.length,
      created_at: new Date().toISOString(),
      items: []
    }
    setModules([...modules, newModule])
  }

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, ...updates } : m
    ))
  }

  const deleteModule = async (moduleId: string) => {
    if (moduleId.startsWith('temp-')) {
      setModules(modules.filter(m => m.id !== moduleId))
      return
    }

    if (!confirm('Supprimer ce module et tous ses éléments ?')) return

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
      setModules(modules.filter(m => m.id !== moduleId))
    } catch (error) {
      console.error('Error deleting module:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const addItem = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    const newItem: Item = {
      id: `temp-${Date.now()}`,
      module_id: moduleId,
      type: 'resource',
      title: 'Nouvel élément',
      content: null,
      asset_path: null,
      external_url: null,
      position: module.items.length,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, items: [...m.items, newItem] }
        : m
    ))
  }

  const updateItem = (moduleId: string, itemId: string, updates: Partial<Item>) => {
    setModules(modules.map(m =>
      m.id === moduleId
        ? {
            ...m,
            items: m.items.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : m
    ))
  }

  const deleteItem = async (moduleId: string, itemId: string) => {
    if (itemId.startsWith('temp-')) {
      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, items: m.items.filter(item => item.id !== itemId) }
          : m
      ))
      return
    }

    if (!confirm('Supprimer cet élément ?')) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setModules(modules.map(m =>
        m.id === moduleId
          ? { ...m, items: m.items.filter(item => item.id !== itemId) }
          : m
      ))
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Erreur lors de la suppression.')
    }
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
                {isNew ? 'Nouvelle formation' : 'Modifier la formation'}
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
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations générales */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={course.title || ''}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="input-field"
                  placeholder="Titre de la formation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  rows={3}
                  className="input-field"
                  placeholder="Description de la formation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={course.status || 'draft'}
                    onChange={(e) => setCourse({ ...course, status: e.target.value as 'draft' | 'published' })}
                    className="input-field"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'accès
                  </label>
                  <select
                    value={course.access_type || 'free'}
                    onChange={(e) => setCourse({
                      ...course,
                      access_type: e.target.value as 'free' | 'paid' | 'invite',
                      is_paid: e.target.value === 'paid'
                    })}
                    className="input-field"
                  >
                    <option value="free">Gratuit</option>
                    <option value="paid">Payant</option>
                    <option value="invite">Sur invitation</option>
                  </select>
                </div>
              </div>

              {course.access_type === 'paid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (centimes)
                    </label>
                    <input
                      type="number"
                      value={course.price_cents || ''}
                      onChange={(e) => setCourse({ ...course, price_cents: parseInt(e.target.value) || null })}
                      className="input-field"
                      placeholder="5000 pour 50€"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise
                    </label>
                    <input
                      type="text"
                      value={course.currency || 'EUR'}
                      onChange={(e) => setCourse({ ...course, currency: e.target.value })}
                      className="input-field"
                      placeholder="EUR"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modules et éléments */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Modules et éléments
              </h2>
              <button
                onClick={addModule}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un module</span>
              </button>
            </div>

            {modules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun module créé. Cliquez sur "Ajouter un module" pour commencer.
              </p>
            ) : (
              <div className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModule(module.id, { title: e.target.value })}
                          className="text-lg font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                          placeholder="Titre du module"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => addItem(module.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Élément
                        </button>
                        <button
                          onClick={() => deleteModule(module.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {module.items.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">
                        Aucun élément dans ce module.
                      </p>
                    ) : (
                      <div className="space-y-3 ml-7">
                        {module.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <span className={`w-3 h-3 rounded-full ${
                                item.type === 'resource' ? 'bg-blue-500' :
                                item.type === 'slide' ? 'bg-green-500' :
                                item.type === 'exercise' ? 'bg-yellow-500' :
                                item.type === 'tp' ? 'bg-purple-500' :
                                'bg-red-500'
                              }`} />
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateItem(module.id, item.id, { title: e.target.value })}
                                className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                                placeholder="Titre de l'élément"
                              />
                              <span className="text-xs text-gray-500 capitalize">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link
                                to={`/admin/items/${item.id}/edit`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => deleteItem(module.id, item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
