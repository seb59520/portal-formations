import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Program, ProgramCourse, ProgramCourseWithCourse, Course } from '../../types/database'
import { Save, Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react'

export function AdminProgramEdit() {
  const { programId } = useParams<{ programId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isNew = programId === 'new'

  const [program, setProgram] = useState<Partial<Program>>({
    title: '',
    description: '',
    status: 'draft',
    access_type: 'free',
    price_cents: null,
    currency: 'EUR',
    created_by: user?.id
  })
  const [programCourses, setProgramCourses] = useState<ProgramCourseWithCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

  useEffect(() => {
    if (!isNew && programId) {
      fetchProgram()
    }
    fetchAvailableCourses()
  }, [programId, isNew])

  const fetchProgram = async () => {
    try {
      // Récupérer le programme
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single()

      if (programError) throw programError
      setProgram(programData)

      // Récupérer les formations du programme avec leurs détails
      const { data: programCoursesData, error: programCoursesError } = await supabase
        .from('program_courses')
        .select(`
          *,
          courses (*)
        `)
        .eq('program_id', programId)
        .order('position', { ascending: true })

      if (programCoursesError) throw programCoursesError

      const formatted = (programCoursesData || []).map((pc: any) => ({
        ...pc,
        courses: pc.courses
      }))
      setProgramCourses(formatted)
    } catch (error) {
      console.error('Error fetching program:', error)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      setAvailableCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleSave = async () => {
    if (!program.title?.trim()) {
      setError('Le titre est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const programData = {
        ...program,
        updated_at: new Date().toISOString()
      }

      let finalProgramId = programId

      // Sauvegarder ou créer le programme
      if (isNew) {
        const { data, error } = await supabase
          .from('programs')
          .insert(programData)
          .select()
          .single()

        if (error) throw error
        finalProgramId = data.id
        navigate(`/admin/programs/${data.id}`, { replace: true })
      } else {
        const { error } = await supabase
          .from('programs')
          .update(programData)
          .eq('id', programId)

        if (error) throw error
        finalProgramId = programId
      }

      // Sauvegarder/mettre à jour les formations du programme
      const programCoursesToCreate = programCourses.filter(pc => pc.id.startsWith('temp-'))
      const programCoursesToUpdate = programCourses.filter(pc => !pc.id.startsWith('temp-'))
      const programCoursesToDelete: string[] = []

      // Identifier les formations à supprimer (si on a chargé le programme)
      if (!isNew && programId) {
        const { data: existing } = await supabase
          .from('program_courses')
          .select('id')
          .eq('program_id', programId)

        const existingIds = existing?.map(e => e.id) || []
        const currentIds = programCourses.map(pc => pc.id).filter(id => !id.startsWith('temp-'))
        programCoursesToDelete.push(...existingIds.filter(id => !currentIds.includes(id)))
      }

      // Supprimer les formations retirées
      if (programCoursesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('program_courses')
          .delete()
          .in('id', programCoursesToDelete)

        if (deleteError) throw deleteError
      }

      // Créer les nouvelles associations
      if (programCoursesToCreate.length > 0) {
        const programCoursesData = programCoursesToCreate.map((pc, index) => {
          const basePosition = programCoursesToUpdate.length
          return {
            program_id: finalProgramId,
            course_id: pc.course_id,
            position: basePosition + index
          }
        })

        const { data: saved, error: insertError } = await supabase
          .from('program_courses')
          .insert(programCoursesData)
          .select()

        if (insertError) throw insertError

        // Mettre à jour les IDs temporaires
        const updatedProgramCourses = programCourses.map(pc => {
          if (pc.id.startsWith('temp-')) {
            const savedPc = saved?.find((spc, idx) => 
              programCoursesToCreate[idx]?.course_id === spc.course_id
            )
            if (savedPc) {
              return {
                ...pc,
                id: savedPc.id,
                program_id: savedPc.program_id
              }
            }
          }
          return pc
        })
        setProgramCourses(updatedProgramCourses)
      }

      // Mettre à jour les positions des formations existantes
      if (programCoursesToUpdate.length > 0) {
        const updatePromises = programCoursesToUpdate.map(pc =>
          supabase
            .from('program_courses')
            .update({ position: pc.position })
            .eq('id', pc.id)
        )

        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter(r => r.error)
        if (updateErrors.length > 0) {
          console.error('Errors updating program courses:', updateErrors)
        }
      }

      setError('')
    } catch (error) {
      console.error('Error saving program:', error)
      setError(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCourses = () => {
    if (selectedCourseIds.length === 0) {
      setError('Veuillez sélectionner au moins une formation.')
      return
    }

    const coursesToAdd = availableCourses
      .filter(c => selectedCourseIds.includes(c.id))
      .filter(c => !programCourses.some(pc => pc.course_id === c.id))

    const newProgramCourses = coursesToAdd.map((course, index) => ({
      id: `temp-${Date.now()}-${index}`,
      program_id: programId || '',
      course_id: course.id,
      position: programCourses.length + index,
      created_at: new Date().toISOString(),
      courses: course
    }))

    setProgramCourses([...programCourses, ...newProgramCourses])
    setShowAddModal(false)
    setSelectedCourseIds([])
  }

  const handleRemoveCourse = (programCourseId: string) => {
    if (!confirm('Retirer cette formation du programme ?')) return
    setProgramCourses(programCourses.filter(pc => pc.id !== programCourseId))
  }

  const handleMoveCourse = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= programCourses.length) return

    const updated = [...programCourses]
    const temp = updated[index]
    updated[index] = { ...updated[newIndex], position: index }
    updated[newIndex] = { ...temp, position: newIndex }
    
    // Réorganiser les positions
    updated.forEach((pc, idx) => {
      pc.position = idx
    })

    setProgramCourses(updated)
  }

  const enrolledCourseIds = programCourses.map(pc => pc.course_id)
  const availableCoursesFiltered = availableCourses.filter(c => !enrolledCourseIds.includes(c.id))

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
                to="/admin/programs"
                className="text-blue-600 hover:text-blue-500"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Nouveau programme' : 'Modifier le programme'}
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations générales */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={program.title || ''}
                  onChange={(e) => setProgram({ ...program, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Titre du programme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={program.description || ''}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Description du programme"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={program.status}
                    onChange={(e) => setProgram({ ...program, status: e.target.value as 'draft' | 'published' })}
                    className="input-field w-full"
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
                    value={program.access_type}
                    onChange={(e) => setProgram({ ...program, access_type: e.target.value as 'free' | 'paid' | 'invite' })}
                    className="input-field w-full"
                  >
                    <option value="free">Gratuit</option>
                    <option value="paid">Payant</option>
                    <option value="invite">Sur invitation</option>
                  </select>
                </div>

                {program.access_type === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (centimes)
                    </label>
                    <input
                      type="number"
                      value={program.price_cents || ''}
                      onChange={(e) => setProgram({ ...program, price_cents: e.target.value ? parseInt(e.target.value) : null })}
                      className="input-field w-full"
                      placeholder="5000 = 50€"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formations du programme */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Formations du programme ({programCourses.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter des formations</span>
              </button>
            </div>

            {programCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Aucune formation ajoutée. Cliquez sur "Ajouter des formations" pour commencer.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {programCourses.map((pc, index) => (
                  <li key={pc.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveCourse(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Déplacer vers le haut"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCourse(index, 'down')}
                          disabled={index === programCourses.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="Déplacer vers le bas"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">
                            {index + 1}.
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {pc.courses?.title || 'Formation inconnue'}
                          </h3>
                        </div>
                        {pc.courses?.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {pc.courses.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCourse(pc.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Modal d'ajout de formations */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Ajouter des formations au programme
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourseIds([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded-md">
              {availableCoursesFiltered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Toutes les formations sont déjà dans le programme.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableCoursesFiltered.map((course) => (
                    <li key={course.id} className="px-4 py-3 hover:bg-gray-50">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourseIds([...selectedCourseIds, course.id])
                            } else {
                              setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {course.title}
                          </p>
                          {course.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCourseIds([])
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCourses}
                disabled={selectedCourseIds.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter {selectedCourseIds.length} formation(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

