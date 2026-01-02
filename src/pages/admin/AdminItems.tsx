import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Item } from '../../types/database'
import { Plus, Edit, Trash2, Gamepad2, FileText, BookOpen, Presentation, PenTool, Code, Search, Filter, X } from 'lucide-react'

type ItemTypeFilter = 'all' | 'game' | 'tp' | 'exercise' | 'resource' | 'slide'

export function AdminItems() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>('all')
  const [itemsWithContext, setItemsWithContext] = useState<Array<Item & { courseTitle?: string; moduleTitle?: string }>>([])

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    // Mettre à jour les items avec contexte quand items change
    if (items.length > 0) {
      fetchItemsContext()
    } else {
      setItemsWithContext([])
    }
  }, [items])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      setError('Erreur lors du chargement des éléments.')
    } finally {
      setLoading(false)
    }
  }

  const fetchItemsContext = async () => {
    try {
      // Optimisation : récupérer tous les modules et cours en une seule requête batch
      const moduleIds = [...new Set(items.filter(i => i.module_id).map(i => i.module_id!))]
      
      if (moduleIds.length === 0) {
        // Pas de modules, tous les items sont indépendants
        setItemsWithContext(items.map(item => ({ ...item, courseTitle: 'Non assigné', moduleTitle: 'Non assigné' })))
        return
      }

      // Récupérer tous les modules en une seule requête
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, title, course_id')
        .in('id', moduleIds)

      if (modulesError || !modulesData) {
        setItemsWithContext(items.map(item => ({ ...item, courseTitle: 'Erreur', moduleTitle: 'Erreur' })))
        return
      }

      // Récupérer tous les cours en une seule requête
      const courseIds = [...new Set(modulesData.filter(m => m.course_id).map(m => m.course_id!))]
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds)

      // Créer des maps pour accès rapide
      const modulesMap = new Map(modulesData.map(m => [m.id, m]))
      const coursesMap = new Map(coursesData?.map(c => [c.id, c]) || [])

      // Mapper les items avec leur contexte
      const itemsWithContextData = items.map(item => {
        if (!item.module_id) {
          return { ...item, courseTitle: 'Non assigné', moduleTitle: 'Non assigné' }
        }

        const module = modulesMap.get(item.module_id)
        if (!module) {
          return { ...item, courseTitle: 'Cours inconnu', moduleTitle: 'Module inconnu' }
        }

        const course = module.course_id ? coursesMap.get(module.course_id) : null

        return {
          ...item,
          courseTitle: course?.title || 'Cours inconnu',
          moduleTitle: module.title || 'Module inconnu'
        }
      })

      setItemsWithContext(itemsWithContextData)
    } catch (error) {
      console.error('Error fetching items context:', error)
      setItemsWithContext(items.map(item => ({ ...item, courseTitle: 'Erreur', moduleTitle: 'Erreur' })))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setItems(items.filter(i => i.id !== itemId))
      setItemsWithContext(itemsWithContext.filter(i => i.id !== itemId))
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const handleCreateItem = (type: Item['type']) => {
    // Créer un item sans module_id pour qu'il soit indépendant
    navigate(`/admin/items/new?type=${type}`)
  }

  const getTypeIcon = (type: Item['type']) => {
    switch (type) {
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-purple-600" />
      case 'tp':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'exercise':
        return <PenTool className="w-5 h-5 text-green-600" />
      case 'resource':
        return <BookOpen className="w-5 h-5 text-gray-600" />
      case 'slide':
        return <Presentation className="w-5 h-5 text-orange-600" />
      default:
        return <Code className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type: Item['type']) => {
    switch (type) {
      case 'game':
        return 'Mini-jeu'
      case 'tp':
        return 'TP'
      case 'exercise':
        return 'Exercice'
      case 'resource':
        return 'Ressource'
      case 'slide':
        return 'Support projeté'
      default:
        return type
    }
  }

  const filteredItems = itemsWithContext.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.moduleTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const typeCounts = {
    all: items.length,
    game: items.filter(i => i.type === 'game').length,
    tp: items.filter(i => i.type === 'tp').length,
    exercise: items.filter(i => i.type === 'exercise').length,
    resource: items.filter(i => i.type === 'resource').length,
    slide: items.filter(i => i.type === 'slide').length,
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des éléments</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCreateItem('game')}
                className="btn-secondary inline-flex items-center space-x-2"
                title="Créer un mini-jeu"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Nouveau jeu</span>
              </button>
              <button
                onClick={() => handleCreateItem('tp')}
                className="btn-secondary inline-flex items-center space-x-2"
                title="Créer un TP"
              >
                <FileText className="w-4 h-4" />
                <span>Nouveau TP</span>
              </button>
              <button
                onClick={() => handleCreateItem('exercise')}
                className="btn-secondary inline-flex items-center space-x-2"
                title="Créer un exercice"
              >
                <PenTool className="w-4 h-4" />
                <span>Nouvel exercice</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Header simplifié pour AdminUnified */}
      <div className="admin-unified-header max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Éléments</h2>
            <p className="text-sm text-gray-500 mt-0.5">Gérez vos éléments de contenu</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateItem('game')}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Gamepad2 className="w-4 h-4" />
              Nouveau jeu
            </button>
            <button
              onClick={() => handleCreateItem('tp')}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Nouveau TP
            </button>
            <button
              onClick={() => handleCreateItem('exercise')}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <PenTool className="w-4 h-4" />
              Nouvel exercice
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Filtres et recherche */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre, cours ou module..."
                    className="input-field pl-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtre par type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'game', 'tp', 'exercise', 'resource', 'slide'] as ItemTypeFilter[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        typeFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'Tous' : getTypeLabel(type as Item['type'])} ({typeCounts[type]})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Liste des éléments */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm || typeFilter !== 'all' 
                          ? 'Aucun élément ne correspond à vos critères de recherche.'
                          : 'Aucun élément créé. Cliquez sur "Nouveau jeu" ou "Nouveau TP" pour commencer.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(item.type)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getTypeLabel(item.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          {item.content?.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {item.content.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.courseTitle || 'Non assigné'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.moduleTitle || 'Non assigné'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.published ? 'Publié' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/admin/items/${item.id}/json`}
                              className="text-purple-600 hover:text-purple-900"
                              title="Éditer en JSON"
                            >
                              <Code className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/admin/items/${item.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500 flex items-center">
                <Gamepad2 className="w-4 h-4 mr-1 text-purple-600" />
                Mini-jeux
              </div>
              <div className="text-2xl font-bold text-purple-600">{typeCounts.game}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500 flex items-center">
                <FileText className="w-4 h-4 mr-1 text-blue-600" />
                TP
              </div>
              <div className="text-2xl font-bold text-blue-600">{typeCounts.tp}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500 flex items-center">
                <PenTool className="w-4 h-4 mr-1 text-green-600" />
                Exercices
              </div>
              <div className="text-2xl font-bold text-green-600">{typeCounts.exercise}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Publiés</div>
              <div className="text-2xl font-bold text-gray-900">
                {items.filter(i => i.published).length}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

