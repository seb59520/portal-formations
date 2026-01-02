import { useEffect, useState, useLayoutEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { withRetry, withTimeout, isAuthError } from '../lib/supabaseHelpers'
import { Course, Module, Item } from '../types/database'
import { CourseFeaturesTiles } from '../components/CourseFeaturesTiles'
import { Progress } from '../components/Progress'
import { ReactRenderer } from '../components/ReactRenderer'
import { CourseSidebar } from '../components/CourseSidebar'
import { ResizableSidebar } from '../components/ResizableSidebar'
import { CourseJson } from '../types/courseJson'
import { Eye, EyeOff, X, BookOpen } from 'lucide-react'
import { Lexique } from './Lexique'

interface ModuleWithItems extends Module {
  items: Item[]
}

export function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithItems[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [courseJson, setCourseJson] = useState<CourseJson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHeaderContent, setShowHeaderContent] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Le lexique est ouvert par défaut en mode desktop, fermé en mode mobile
  const [lexiqueDrawerOpen, setLexiqueDrawerOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const viewMode = searchParams.get('view')

  // Détecter si on est sur desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  // Vérifier si le cours contient un lexique
  const hasLexique = courseJson?.modules
    ?.flatMap(m => m.items || [])
    ?.some(item => item.title?.toLowerCase().includes('lexique') || item.content?.isLexique) || false

  // Debug: log pour vérifier la détection du lexique
  useEffect(() => {
    if (courseJson) {
      console.log('Course JSON:', courseJson)
      console.log('Has Lexique:', hasLexique)
      console.log('Modules:', courseJson.modules)
      courseJson.modules?.forEach((m, idx) => {
        console.log(`Module ${idx}:`, m.title, 'Items:', m.items?.map(i => i.title))
      })
    }
  }, [courseJson, hasLexique])


  useEffect(() => {
    if (courseId && user) {
      fetchCourse()
    }
  }, [courseId, user])

  const fetchCourse = async () => {
    try {
      setError('')

      // Récupérer les détails de la formation d'abord avec retry optimisé
      const { data: courseData, error: courseError } = await withRetry(
        () => withTimeout(
          supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single(),
          5000, // Réduit à 5 secondes
          'Course fetch timeout'
        ),
        { maxRetries: 1, initialDelay: 500 } // Réduire les retries
      )

      if (courseError) {
        if (isAuthError(courseError)) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw courseError
      }

      // Vérifier l'accès à la formation (seulement si pas admin)
      if (profile?.role !== 'admin' && user?.id && courseData) {
        // Vérifier si l'utilisateur est le créateur de la formation
        if (courseData.created_by === user.id) {
          // Le créateur a toujours accès
        }
        // Vérifier si la formation est gratuite et publiée
        else if (courseData.access_type === 'free' && courseData.status === 'published') {
          // Les formations gratuites et publiées sont accessibles à tous
          // Créer automatiquement un enrollment si nécessaire
          const { data: existingEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle()

          if (!existingEnrollment) {
            // Créer automatiquement l'enrollment pour les formations gratuites
            await supabase
              .from('enrollments')
              .insert({
                user_id: user.id,
                course_id: courseId,
                status: 'active',
                source: 'manual'
              })
          }
        }
        // Pour les autres cas, vérifier l'enrollment direct OU via un programme
        else {
          // Vérifier d'abord l'enrollment direct
          const { data: accessCheck, error: accessError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .maybeSingle()

          // Si pas d'inscription directe, vérifier via un programme
          if (accessError || !accessCheck) {
            // Vérifier si l'utilisateur a accès via un programme
            const { data: programCourses } = await supabase
              .from('program_courses')
              .select('program_id')
              .eq('course_id', courseId)

            if (programCourses && programCourses.length > 0) {
              const programIds = programCourses.map(pc => pc.program_id)
              const { data: programAccess } = await supabase
                .from('program_enrollments')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .in('program_id', programIds)
                .maybeSingle()

              if (!programAccess) {
                setError('Vous n\'avez pas accès à cette formation.')
                setLoading(false)
                return
              }
            } else {
              // Pas de programme contenant cette formation
              setError('Vous n\'avez pas accès à cette formation.')
              setLoading(false)
              return
            }
          }
        }
      }
      setCourse(courseData)

      // Continuer le chargement même si on a créé un enrollment

      // Vérifier d'abord l'accès au cours pour optimiser les policies RLS
      // Cela permet à Supabase de mieux optimiser les requêtes suivantes
      const { data: courseAccessCheck } = await supabase
        .from('courses')
        .select('id, status, access_type, created_by')
        .eq('id', courseId)
        .single()

      if (!courseAccessCheck) {
        setError('Formation introuvable.')
        setLoading(false)
        return
      }

      // Récupérer les modules avec un timeout plus long
      const { data: modulesData, error: modulesError } = await withRetry(
        () => withTimeout(
          supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true }),
          10000, // Augmenter le timeout à 10 secondes
          'Modules fetch timeout'
        ),
        { maxRetries: 2, initialDelay: 1000 } // Plus de retries avec délai plus long
      )

      if (modulesError) {
        if (isAuthError(modulesError)) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw modulesError
      }

      // Récupérer les items séparément pour éviter les problèmes RLS avec les jointures
      let allItemsMap = new Map<string, Item[]>()
      
      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id)
        
        const { data: itemsData, error: itemsError } = await withRetry(
          () => withTimeout(
            supabase
              .from('items')
              .select('*')
              .in('module_id', moduleIds)
              .order('position', { ascending: true }),
            15000, // Augmenter le timeout à 15 secondes pour les items
            'Items fetch timeout'
          ),
          { maxRetries: 2, initialDelay: 1000, maxDelay: 3000 } // Plus de retries avec délai plus long
        )

        if (itemsError) {
          console.error('Error fetching items:', itemsError)
          console.error('  - Error code:', itemsError.code)
          console.error('  - Error message:', itemsError.message)
          console.error('  - Error details:', itemsError.details)
          
          if (isAuthError(itemsError)) {
            setError('Session expirée. Veuillez vous reconnecter.')
            return
          } else if (itemsError.code === '57014' || itemsError.message?.includes('timeout')) {
            console.error('⚠️ Timeout SQL détecté lors du chargement des items!')
            console.error('Solution: Exécutez le script optimize-all-policies-performance.sql dans Supabase')
            setError('Le chargement prend trop de temps. Les politiques RLS doivent être optimisées.')
            return
          } else if (itemsError.code === 'PGRST301' || itemsError.message?.includes('permission')) {
            console.error('⚠️ Problème de permissions RLS détecté!')
            setError('Erreur de permissions lors du chargement des items.')
            return
          }
          // Pour les autres erreurs, continuer mais sans items
          console.warn('Continuing without items due to error')
        } else if (itemsData) {
          // Grouper les items par module_id
          itemsData.forEach(item => {
            if (!allItemsMap.has(item.module_id)) {
              allItemsMap.set(item.module_id, [])
            }
            allItemsMap.get(item.module_id)!.push(item)
          })
        }
      }

      // Trier les items dans chaque module
      const sortedModules = (modulesData || []).map(module => ({
        ...module,
        items: (allItemsMap.get(module.id) || []).sort((a: Item, b: Item) => a.position - b.position)
      }))

      console.log('Modules data:', sortedModules)
      console.log('Items count:', sortedModules.reduce((acc, m) => acc + (m.items?.length || 0), 0))
      sortedModules.forEach((module, idx) => {
        console.log(`Module ${idx} (${module.title}):`, module.items?.length || 0, 'items')
        module.items?.forEach((item, itemIdx) => {
          console.log(`  Item ${itemIdx}:`, item.title, 'type:', item.type, 'published:', item.published, 'has content:', !!item.content)
        })
      })

      setModules(sortedModules)

      // Collecter tous les items pour les tuiles
      const allItemsList = sortedModules.flatMap(module => module.items || [])
      setAllItems(allItemsList)

      // Récupérer tous les chapitres pour tous les items
      const allItemIds = allItemsList.map(item => item.id)
      let chaptersMap = new Map<string, any[]>()
      
      console.log('=== Fetching chapters ===')
      console.log('Items count:', allItemIds.length)
      console.log('Item IDs:', allItemIds)
      console.log('User ID:', user?.id)
      console.log('User role:', profile?.role)
      
      if (allItemIds.length > 0) {
        // Construire la requête avec ou sans filtre published selon le rôle
        let chaptersQuery = supabase
          .from('chapters')
          .select('*')
          .in('item_id', allItemIds)
        
        // Filtrer les chapitres non publiés sauf pour les admins
        if (profile?.role !== 'admin') {
          chaptersQuery = chaptersQuery.eq('published', true)
        }
        
        const { data: chaptersData, error: chaptersError } = await chaptersQuery
          .order('position', { ascending: true })

        console.log('Chapters query result:')
        console.log('  - Data:', chaptersData)
        console.log('  - Data length:', chaptersData?.length || 0)
        console.log('  - Error:', chaptersError)
        console.log('  - Error code:', chaptersError?.code)
        console.log('  - Error message:', chaptersError?.message)
        console.log('  - Error details:', chaptersError?.details)
        console.log('  - Error hint:', chaptersError?.hint)

        if (chaptersError) {
          console.error('❌ Error fetching chapters:', chaptersError)
          // Afficher plus de détails sur l'erreur
          if (chaptersError.code === 'PGRST301' || chaptersError.message?.includes('permission')) {
            console.error('⚠️ Problème de permissions RLS détecté!')
            console.error('Vérifiez que la policy "Chapters viewable with item access" inclut l\'accès via programmes')
          } else if (chaptersError.code === '57014' || chaptersError.message?.includes('timeout')) {
            console.error('⚠️ Timeout SQL détecté! La policy RLS est trop lente.')
            console.error('Solution: Exécutez le script fix-chapters-policy-performance.sql dans Supabase')
            console.error('Ce script optimise la policy en utilisant des fonctions SQL réutilisables')
          }
        } else {
          console.log('✅ Chapters fetched successfully')
        }

        if (chaptersData) {
          console.log('Processing chapters data...')
          // Filtrer les chapitres non publiés si l'utilisateur n'est pas admin
          const visibleChapters = profile?.role === 'admin' 
            ? chaptersData 
            : chaptersData.filter(ch => ch.published !== false)
          
          visibleChapters.forEach((ch, idx) => {
            if (!chaptersMap.has(ch.item_id)) {
              chaptersMap.set(ch.item_id, [])
            }
            chaptersMap.get(ch.item_id)!.push({
              title: ch.title,
              position: ch.position,
              content: ch.content || undefined
            })
            console.log(`  Chapter ${idx + 1}: item_id=${ch.item_id}, title="${ch.title}", position=${ch.position}, published=${ch.published}`)
          })
          
          console.log('Chapters map summary:')
          const mapSummary = Array.from(chaptersMap.entries()).map(([itemId, chaps]) => ({
            itemId,
            chaptersCount: chaps.length,
            titles: chaps.map(c => c.title)
          }))
          console.log('  Total items with chapters:', mapSummary.length)
          mapSummary.forEach(summary => {
            console.log(`  - Item ${summary.itemId}: ${summary.chaptersCount} chapters`)
          })
          console.log('=== End chapters fetch ===')
        } else {
          console.log('⚠️ No chapters data returned (chaptersData is null/undefined)')
          console.log('=== End chapters fetch ===')
        }
      }

      // Construire le CourseJson pour ReactRenderer
      const courseJsonData: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: sortedModules.map(module => ({
          title: module.title,
          position: module.position,
          items: module.items.map((item: Item) => {
            const itemChapters = chaptersMap.get(item.id) || undefined
            console.log(`Item ${item.title} (${item.type}):`, {
              hasChapters: !!itemChapters,
              chaptersCount: itemChapters?.length || 0,
              hasAssetPath: !!item.asset_path,
              hasContentBody: !!item.content?.body,
              hasContentQuestion: !!item.content?.question,
              hasContentDescription: !!item.content?.description,
              contentKeys: item.content ? Object.keys(item.content) : [],
              fullContent: item.content
            })
            return {
              id: item.id, // Inclure l'ID pour les liens
              type: item.type as 'resource' | 'slide' | 'exercise' | 'tp' | 'game',
              title: item.title,
              position: item.position,
              published: item.published,
              content: item.content || {},
              asset_path: item.asset_path || undefined,
              external_url: item.external_url || undefined,
              chapters: itemChapters
            }
          })
        }))
      }
      
      console.log('CourseJson created with chapters:', courseJsonData.modules.map(m => ({
        module: m.title,
        items: m.items.map(i => ({
          title: i.title,
          type: i.type,
          chaptersCount: i.chapters?.length || 0
        }))
      })))

      setCourseJson(courseJsonData)
    } catch (error: any) {
      console.error('Error fetching course:', error)
      if (isAuthError(error)) {
        setError('Session expirée. Veuillez vous reconnecter.')
      } else if (error?.message?.includes('timeout')) {
        setError('Le chargement prend trop de temps. Vérifiez votre connexion Internet.')
      } else {
        setError('Erreur lors du chargement de la formation.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Formation non trouvée'}
          </h2>
          <Link to="/app" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 course-view-container" style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="w-full">
          <div 
            className="flex justify-between items-center py-4 px-4 transition-all duration-300"
            style={{
              marginLeft: viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop
                ? 'var(--sidebar-width, 256px)' 
                : '0'
            }}
          >
            <div className="flex items-center space-x-4 flex-1">
              <Link
                to="/app"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
            </div>
            <div className="flex-1 flex justify-center min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-3 flex-1 justify-end">
              {viewMode !== 'progress' && (
                <>
                  {hasLexique && (
                    <button
                      onClick={() => setLexiqueDrawerOpen(!lexiqueDrawerOpen)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title={lexiqueDrawerOpen ? 'Fermer le lexique' : 'Ouvrir le lexique'}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Lexique</span>
                    </button>
                  )}
                  <Link
                    to={`/courses/${courseId}?view=progress`}
                    className="btn-secondary text-sm"
                  >
                    Voir la progression
                  </Link>
                </>
              )}
              {viewMode === 'progress' && (
                <Link
                  to={`/courses/${courseId}`}
                  className="btn-secondary text-sm"
                >
                  Retour au contenu
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link
                  to={`/admin/courses/${course.id}`}
                  className="btn-secondary text-sm"
                >
                  Modifier
                </Link>
              )}
              <button
                onClick={() => setShowHeaderContent(!showHeaderContent)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title={showHeaderContent ? 'Masquer le contenu' : 'Afficher le contenu'}
              >
                {showHeaderContent ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Masquer</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Afficher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content avec sidebar */}
      <main className="w-full flex relative">
        {/* Sidebar avec table des matières */}
        {viewMode !== 'progress' && courseJson && (
          <>
            {/* Overlay pour mobile quand sidebar est ouverte */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {/* Sidebar redimensionnable et fixe */}
            <div className={`
              fixed lg:sticky top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <ResizableSidebar
                storageKey="course-sidebar-width"
                minWidth={200}
                maxWidth={500}
                defaultWidth={256}
                side="left"
              >
                <div className="h-full flex flex-col">
                  <CourseSidebar 
                    courseJson={courseJson}
                    onClose={() => setSidebarOpen(false)}
                  />
                </div>
              </ResizableSidebar>
            </div>
          </>
        )}

        {/* Contenu principal */}
        <div 
          className="flex-1 py-6 transition-all duration-300"
          style={{
            marginLeft: viewMode !== 'progress' && courseJson && sidebarOpen && !isDesktop
              ? 'var(--sidebar-width, 256px)' 
              : '0',
            marginRight: hasLexique && lexiqueDrawerOpen 
              ? '384px' // w-96 = 384px
              : hasLexique 
                ? '0' // Le drawer est présent mais caché
                : '0'
          }}
        >
          <div className="max-w-7xl mx-auto" style={{
            paddingLeft: viewMode !== 'progress' && courseJson && sidebarOpen 
              ? '0' 
              : '1rem',
            paddingRight: '1rem'
          }}>
            {/* Vue de progression */}
            {viewMode === 'progress' ? (
              <Progress />
            ) : (
              <>
                {/* Tuiles de fonctionnalités */}
                {showHeaderContent && course && allItems.length > 0 && (
                  <div className="mb-6">
                    <CourseFeaturesTiles 
                      course={course} 
                      items={allItems} 
                      courseId={courseId!} 
                    />
                  </div>
                )}

                {/* Contenu du cours avec ReactRenderer */}
                {courseJson ? (
                  <div className="bg-white shadow rounded-lg p-6">
                    <ReactRenderer courseJson={courseJson} />
                  </div>
                ) : modules.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">
                      Cette formation ne contient aucun module pour le moment.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Drawer du lexique à droite */}
      {hasLexique && (
        <>
          {/* Overlay pour mobile quand drawer est ouvert */}
          {lexiqueDrawerOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setLexiqueDrawerOpen(false)}
            />
          )}
          {/* Drawer du lexique */}
          <div className={`
            fixed top-0 right-0 z-50 h-screen transition-transform duration-300 ease-in-out
            ${lexiqueDrawerOpen 
              ? 'translate-x-0' 
              : 'translate-x-full'}
            w-full lg:w-96
          `}>
            <div className="h-full bg-white border-l border-gray-200 shadow-lg flex flex-col">
              {/* Header du drawer */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Lexique</h2>
                </div>
                <button
                  onClick={() => setLexiqueDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Fermer le lexique"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Contenu du lexique */}
              <div className="flex-1 overflow-y-auto p-4">
                <Lexique />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
