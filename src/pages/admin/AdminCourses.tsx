import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Course } from '../../types/database'
import { Plus, Edit, Eye, Trash2, Users, Code, UserCog, BookOpen, Search, Filter, MoreVertical, Copy, Calendar, DollarSign, LayoutGrid, List, FileText, Building2 } from 'lucide-react'

export function AdminCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'paid' | 'invite'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('admin-courses-view-mode')
    return (saved as 'grid' | 'list') || 'grid'
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
      setFilteredCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Erreur lors du chargement des formations.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les formations
  useEffect(() => {
    let filtered = [...courses]

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    // Filtre par type d'accès
    if (accessFilter !== 'all') {
      filtered = filtered.filter(course => course.access_type === accessFilter)
    }

    setFilteredCourses(filtered)
  }, [courses, searchQuery, statusFilter, accessFilter])

  // Statistiques
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    free: courses.filter(c => c.access_type === 'free').length,
    paid: courses.filter(c => c.access_type === 'paid').length
  }

  // Sauvegarder le mode de vue
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('admin-courses-view-mode', mode)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      setError('Erreur lors de la suppression.')
    }
  }

  const handleDuplicateCourse = async (course: Course) => {
    try {
      const newCourse = {
        ...course,
        id: undefined,
        title: `${course.title} (Copie)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse)
        .select()
        .single()

      if (error) throw error

      setCourses([data, ...courses])
    } catch (error) {
      console.error('Error duplicating course:', error)
      setError('Erreur lors de la duplication.')
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                to="/app"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                ← Retour
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez vos formations et leur contenu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/admin/programs"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Programmes
              </Link>
              <Link
                to="/admin/users"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 inline-flex items-center gap-1.5"
              >
                <UserCog className="w-4 h-4" />
                Utilisateurs
              </Link>
              <Link
                to="/admin/orgs"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 inline-flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                Organisations
              </Link>
              <Link
                to="/admin/items"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Éléments
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <Link
                to="/admin/courses/new"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Nouvelle formation
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistiques */}
        {courses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600 mt-1">Publiées</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
              <div className="text-sm text-gray-600 mt-1">Brouillons</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.free}</div>
              <div className="text-sm text-gray-600 mt-1">Gratuites</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
              <div className="text-sm text-gray-600 mt-1">Payantes</div>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        {courses.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une formation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Filtre statut */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="published">Publiées</option>
                  <option value="draft">Brouillons</option>
                </select>
              </div>

              {/* Filtre accès */}
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="free">Gratuit</option>
                <option value="paid">Payant</option>
                <option value="invite">Sur invitation</option>
              </select>

              {/* Toggle vue grille / liste */}
              <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des formations */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Aucune formation créée pour le moment.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Commencez par créer votre première formation.
            </p>
            <Link to="/admin/courses/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Créer la première formation
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              Aucune formation ne correspond à vos critères.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setAccessFilter('all')
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue Grille */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-5 flex-1 flex flex-col">
                  {/* En-tête avec badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 break-words line-clamp-2 mb-2">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {course.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          course.access_type === 'free'
                            ? 'bg-blue-100 text-blue-700'
                            : course.access_type === 'paid'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {course.access_type === 'free' ? 'Gratuit' :
                           course.access_type === 'paid' ? 'Payant' : 'Invitation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {course.description || 'Aucune description'}
                  </p>

                  {/* Informations */}
                  <div className="space-y-2 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Créé le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                    {course.price_cents && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{(course.price_cents / 100).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className="flex-1 btn-primary text-sm text-center inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Modifier
                    </Link>
                    <Link
                      to={`/courses/${course.id}`}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                      title="Voir"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/admin/courses/${course.id}/enrollments`}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                      title="Inscriptions"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/admin/courses/${course.id}/submissions`}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                      title="Soumissions"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                        className="btn-secondary text-sm inline-flex items-center gap-1.5"
                        title="Plus d'options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {openMenuId === course.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <Link
                              to={`/admin/courses/${course.id}/json`}
                              onClick={() => setOpenMenuId(null)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Code className="w-4 h-4" />
                              Éditer en JSON
                            </Link>
                            <button
                              onClick={() => {
                                handleDuplicateCourse(course)
                                setOpenMenuId(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Dupliquer
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteCourse(course.id)
                                setOpenMenuId(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue Liste */
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icône et contenu principal */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {course.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            course.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {course.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            course.access_type === 'free'
                              ? 'bg-blue-100 text-blue-700'
                              : course.access_type === 'paid'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {course.access_type === 'free' ? 'Gratuit' :
                             course.access_type === 'paid' ? 'Payant' : 'Invitation'}
                          </span>
                          {course.price_cents && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {(course.price_cents / 100).toFixed(2)}€
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {course.description || 'Aucune description disponible.'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Créé le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="btn-primary text-sm inline-flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Modifier
                      </Link>
                      <Link
                        to={`/courses/${course.id}`}
                        className="btn-secondary text-sm inline-flex items-center gap-1.5"
                        title="Voir"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/admin/courses/${course.id}/enrollments`}
                        className="btn-secondary text-sm inline-flex items-center gap-1.5"
                        title="Inscriptions"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/admin/courses/${course.id}/submissions`}
                        className="btn-secondary text-sm inline-flex items-center gap-1.5"
                        title="Soumissions"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                          className="btn-secondary text-sm inline-flex items-center gap-1.5"
                          title="Plus d'options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === course.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <Link
                                to={`/admin/courses/${course.id}/json`}
                                onClick={() => setOpenMenuId(null)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Code className="w-4 h-4" />
                                Éditer en JSON
                              </Link>
                              <button
                                onClick={() => {
                                  handleDuplicateCourse(course)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Dupliquer
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteCourse(course.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
