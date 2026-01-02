import { useState } from 'react'
import { Item, Submission } from '../types/database'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { PdfViewer } from './PdfViewer'
import { FileUpload } from './FileUpload'
import { RichTextEditor } from './RichTextEditor'
import { GameRenderer } from './GameRenderer'
import { Presentation, Eye, Columns } from 'lucide-react'

interface ItemRendererProps {
  item: Item
  submission?: Submission | null
  onSubmissionUpdate: (submission: Submission | null) => void
}

export function ItemRenderer({ item, submission, onSubmissionUpdate }: ItemRendererProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(submission?.answer_text || '')
  const [file, setFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<'normal' | 'slide' | 'comparison'>('normal')

  const handleExerciseSubmit = async () => {
    if (!user?.id || (!answer.trim() && !file)) return

    setLoading(true)
    try {
      let filePath = submission?.file_path

      // Upload du fichier si nouveau
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${item.id}/submission.${fileExt}`

        console.log('📤 Upload du fichier:', fileName)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file, { upsert: true })

        if (uploadError) {
          console.error('❌ Erreur upload:', uploadError)
          alert(`Erreur lors de l'upload du fichier: ${uploadError.message}`)
          throw uploadError
        }
        
        console.log('✅ Fichier uploadé avec succès:', uploadData)
        filePath = fileName
      }

      const submissionData = {
        user_id: user.id,
        item_id: item.id,
        answer_text: answer || null,
        file_path: filePath || null,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la soumission:', error)
        alert(`Erreur lors de la soumission: ${error.message || 'Erreur inconnue'}`)
        throw error
      }
      
      console.log('✅ Exercice soumis avec succès:', data)
      onSubmissionUpdate(data)
      setFile(null) // Réinitialiser le fichier après soumission
      alert('Exercice soumis avec succès!')
    } catch (error: any) {
      console.error('❌ Erreur complète lors de la soumission:', error)
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la soumission'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTpSubmit = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      let filePath = submission?.file_path

      // Upload du fichier si nouveau
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${item.id}/submission.${fileExt}`

        console.log('📤 Upload du fichier TP:', fileName)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file, { upsert: true })

        if (uploadError) {
          console.error('❌ Erreur upload TP:', uploadError)
          alert(`Erreur lors de l'upload du fichier: ${uploadError.message}`)
          throw uploadError
        }
        
        console.log('✅ Fichier TP uploadé avec succès:', uploadData)
        filePath = fileName
      }

      const submissionData = {
        user_id: user.id,
        item_id: item.id,
        answer_text: answer,
        file_path: filePath,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la soumission TP:', error)
        alert(`Erreur lors de la soumission: ${error.message || 'Erreur inconnue'}`)
        throw error
      }
      
      console.log('✅ TP soumis avec succès:', data)
      onSubmissionUpdate(data)
      setFile(null) // Réinitialiser le fichier après soumission
      alert('TP soumis avec succès!')
    } catch (error: any) {
      console.error('❌ Erreur complète lors de la soumission TP:', error)
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la soumission'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGameScore = async (score: number, metadata?: Record<string, any>) => {
    if (!user?.id) return

    try {
      await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          course_id: item.modules?.course_id,
          item_id: item.id,
          score,
          metadata: metadata || null
        })
    } catch (error) {
      console.error('Error saving game score:', error)
    }
  }

  const renderResource = () => {
    if (item.external_url) {
      return (
        <div className="space-y-4">
          <p className="text-gray-600">{item.content?.description}</p>
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Accéder à la ressource
          </a>
        </div>
      )
    }

    if (item.asset_path) {
      const { data } = supabase.storage
        .from('course-assets')
        .getPublicUrl(item.asset_path)

      return (
        <div className="space-y-4">
          <p className="text-gray-600">{item.content?.description}</p>
          {item.asset_path.endsWith('.pdf') ? (
            <PdfViewer url={data.publicUrl} />
          ) : (
            <a
              href={data.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              Télécharger le fichier
            </a>
          )}
        </div>
      )
    }

    return <p className="text-gray-600">Contenu non disponible.</p>
  }

  const renderSlide = () => {
    // Si l'item a un asset_path (PDF ou image)
    if (item.asset_path) {
      const { data } = supabase.storage
        .from('course-assets')
        .getPublicUrl(item.asset_path)

      return (
        <div className="space-y-4">
          {(item.content?.summary || item.content?.description) && (
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-gray-700">
                {item.content?.summary || item.content?.description}
              </p>
            </div>
          )}
          {item.asset_path.endsWith('.pdf') ? (
            <PdfViewer url={data.publicUrl} />
          ) : (
            <img
              src={data.publicUrl}
              alt={item.title}
              className="max-w-full max-h-[calc(100vh-200px)] h-auto rounded-lg shadow object-contain"
            />
          )}
        </div>
      )
    }

    // Si l'item a du contenu body
    if (item.content?.body) {
      return (
        <div className="prose max-w-none">
          <RichTextEditor
            content={item.content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )
    }

    // Si l'item a des chapitres, le contenu est dans les chapitres
    // Les chapitres sont affichés par ChapterViewer dans ItemView
    // On affiche juste un message informatif
    return (
      <div className="space-y-4">
        {(item.content?.summary || item.content?.description) && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-900">📝 Résumé</h4>
            <p className="text-gray-700">
              {item.content?.summary || item.content?.description}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 italic">
          Le contenu détaillé est disponible dans les chapitres ci-dessous.
        </p>
      </div>
    )
  }

  const renderExercise = () => {
    const isSubmitted = submission?.status === 'submitted'
    const isGraded = submission?.status === 'graded'
    const content = item.content as any

    // Détecter si c'est un exercice d'analyse d'API (structure enrichie)
    const isApiAnalysisExercise = content?.objective || content?.input_api || content?.instructions

    if (isApiAnalysisExercise) {
      return renderApiAnalysisExercise(content, isSubmitted, isGraded, submission)
    }

    // Rendu classique pour les exercices simples
    return (
      <div className="space-y-6">
        {item.content?.question && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Énoncé</h3>
            {typeof item.content.question === 'object' ? (
              <RichTextEditor
                content={item.content.question}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <p className="text-blue-800">{item.content.question}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Votre réponse</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-32 resize-none"
            placeholder="Tapez votre réponse ici..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Document à joindre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                <a
                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleExerciseSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre'}
          </button>
        ) : (
          <div className="space-y-4">
            {/* En-tête avec informations de soumission */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  Réponse soumise le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                </p>
                {isGraded && submission.grade && (
                  <p className="text-sm font-medium text-green-600">
                    Note: {submission.grade}/100
                  </p>
                )}
              </div>
              {submission.file_path && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                  <a
                    href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Télécharger
                  </a>
                </div>
              )}
            </div>

            {/* Boutons de vue si correction disponible */}
            {item.content?.correction && isGraded && (
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Columns className="w-4 h-4 inline-block mr-2" />
                  Comparaison
                </button>
                <button
                  onClick={() => setViewMode('slide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'slide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Presentation className="w-4 h-4 inline-block mr-2" />
                  Présentation
                </button>
                <button
                  onClick={() => setViewMode('normal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" />
                  Normal
                </button>
              </div>
            )}

            {/* Affichage selon le mode */}
            {item.content?.correction && isGraded && (
              <>
                {viewMode === 'comparison' ? (
                  // Vue côte à côte : Soumission | Correction
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                        <span className="mr-2">📝</span>
                        Votre réponse
                      </h4>
                      <div className="bg-white p-3 rounded border border-blue-300">
                        {submission.answer_text ? (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {submission.answer_text}
                          </p>
                        ) : submission.answer_json ? (
                          <pre className="text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(submission.answer_json, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-gray-500 italic text-sm">Aucune réponse texte</p>
                        )}
                        {submission.file_path && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <a
                              href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              📎 {submission.file_path.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold mb-3 text-green-900 flex items-center">
                        <span className="mr-2">✅</span>
                        Correction
                      </h4>
                      <div className="bg-white p-3 rounded border border-green-300">
                        {typeof item.content.correction === 'object' ? (
                          <RichTextEditor
                            content={item.content.correction}
                            onChange={() => {}}
                            editable={false}
                          />
                        ) : (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {item.content.correction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'slide' ? (
                  // Vue présentation slide
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border-2 border-purple-200 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                          <span>Note: <strong className="text-green-600">{submission.grade}/100</strong></span>
                          <span>•</span>
                          <span>Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Votre réponse
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {submission.answer_text ? (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {submission.answer_text}
                              </p>
                            ) : submission.answer_json ? (
                              <pre className="text-xs text-gray-800 overflow-x-auto bg-gray-50 p-3 rounded">
                                {JSON.stringify(submission.answer_json, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-gray-500 italic">Aucune réponse texte</p>
                            )}
                            {submission.file_path && (
                              <div className="mt-4 pt-4 border-t">
                                <a
                                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  📎 Fichier joint: {submission.file_path.split('/').pop()}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <span className="mr-2">✅</span>
                            Correction
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {typeof item.content.correction === 'object' ? (
                              <RichTextEditor
                                content={item.content.correction}
                                onChange={() => {}}
                                editable={false}
                              />
                            ) : (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {item.content.correction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vue normale (par défaut)
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Correction</h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      {typeof item.content.correction === 'object' ? (
                        <RichTextEditor
                          content={item.content.correction}
                          onChange={() => {}}
                          editable={false}
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{item.content.correction}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderApiAnalysisExercise = (content: any, isSubmitted: boolean, isGraded: boolean, submission?: Submission | null) => {
    return (
      <div className="space-y-6">
        {/* Objectif */}
        {content.objective && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold mb-2 text-lg text-blue-900">🎯 Objectif</h3>
            <p className="text-gray-700">{content.objective}</p>
          </div>
        )}

        {/* Durée et prérequis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.duration_minutes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-600">⏱️ Durée estimée : </span>
              <span className="text-gray-900 font-semibold">{content.duration_minutes} minutes</span>
            </div>
          )}
          {content.prerequisites && content.prerequisites.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-600 block mb-2">📚 Prérequis :</span>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {content.prerequisites.map((prereq: string, idx: number) => (
                  <li key={idx}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contexte */}
        {content.context && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">📋 Contexte</h4>
            {content.context.domain && (
              <p className="mb-2">
                <span className="font-medium text-blue-800">Domaine : </span>
                <span className="text-blue-700">{content.context.domain}</span>
              </p>
            )}
            {content.context.entities && content.context.entities.length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-blue-800">Entités : </span>
                <span className="text-blue-700">{content.context.entities.join(', ')}</span>
              </div>
            )}
            {content.context.business_rules && content.context.business_rules.length > 0 && (
              <div>
                <span className="font-medium text-blue-800 block mb-2">Règles métier :</span>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  {content.context.business_rules.map((rule: string, idx: number) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* API d'entrée */}
        {content.input_api && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-3 text-yellow-900">🔌 API à analyser</h4>
            {content.input_api.endpoints && content.input_api.endpoints.length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-yellow-800 mb-2">Endpoints :</h5>
                <div className="bg-white p-3 rounded border border-yellow-300 font-mono text-sm">
                  {content.input_api.endpoints.map((endpoint: string, idx: number) => (
                    <div key={idx} className="text-yellow-900 py-1">{endpoint}</div>
                  ))}
                </div>
              </div>
            )}
            {content.input_api.response_examples && content.input_api.response_examples.length > 0 && (
              <div>
                <h5 className="font-medium text-yellow-800 mb-2">Exemples de réponses :</h5>
                <div className="space-y-3">
                  {content.input_api.response_examples.map((example: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-yellow-300">
                      <div className="font-mono text-xs text-yellow-800 mb-2">
                        {example.endpoint}
                        {example.status && ` (${example.status})`}
                      </div>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(example.body, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {content.instructions && content.instructions.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-lg text-blue-900">📝 Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {content.instructions.map((instruction: string, idx: number) => (
                <li key={idx} className="pl-2">{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Format de sortie attendu */}
        {content.expected_output_format && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-3 text-green-900">📤 Format de sortie attendu</h4>
            {content.expected_output_format.sections && content.expected_output_format.sections.length > 0 && (
              <div>
                <span className="font-medium text-green-800 block mb-2">Sections requises :</span>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  {content.expected_output_format.sections.map((section: string, idx: number) => (
                    <li key={idx}>{section}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Critères d'évaluation */}
        {content.criteria && content.criteria.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-3 text-purple-900">✅ Critères d'évaluation</h4>
            <ul className="list-disc list-inside text-purple-700 space-y-2">
              {content.criteria.map((criterion: string, idx: number) => (
                <li key={idx}>{criterion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Livrables */}
        {content.deliverables && content.deliverables.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold mb-3 text-indigo-900">📦 Livrables</h4>
            <ul className="list-disc list-inside text-indigo-700 space-y-1">
              {content.deliverables.map((deliverable: string, idx: number) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Barème de notation */}
        {content.scoring_rubric && (
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            <h4 className="font-semibold mb-3 text-gray-900">📊 Barème de notation</h4>
            <div className="mb-2">
              <span className="font-medium text-gray-700">Total : </span>
              <span className="text-gray-900 font-bold">{content.scoring_rubric.total_points} points</span>
            </div>
            {content.scoring_rubric.breakdown && content.scoring_rubric.breakdown.length > 0 && (
              <div className="mt-3 space-y-2">
                {content.scoring_rubric.breakdown.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-gray-700">{item.item}</span>
                    <span className="font-semibold text-gray-900">{item.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bonus */}
        {content.bonus_mastery && content.bonus_mastery.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold mb-3 text-amber-900">⭐ Bonus (Maîtrise avancée)</h4>
            <ul className="list-disc list-inside text-amber-700 space-y-1">
              {content.bonus_mastery.map((bonus: string, idx: number) => (
                <li key={idx}>{bonus}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Zone de réponse */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium text-gray-900">Votre réponse</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-48 resize-none font-mono text-sm"
            placeholder="Rédigez votre analyse ici..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Document à joindre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.jpeg,.png"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                <a
                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleExerciseSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre'}
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Réponse soumise le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
            </p>
            {submission.file_path && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                <span>Fichier soumis: {submission.file_path.split('/').pop()}</span>
                <a
                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Télécharger
                </a>
              </div>
            )}
            {isGraded && submission.grade && (
              <p className="text-sm font-medium text-green-600">
                Note: {submission.grade}/100
              </p>
            )}
            {/* Boutons de vue si correction disponible */}
            {content.correction && isGraded && (
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Columns className="w-4 h-4 inline-block mr-2" />
                  Comparaison
                </button>
                <button
                  onClick={() => setViewMode('slide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'slide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Presentation className="w-4 h-4 inline-block mr-2" />
                  Présentation
                </button>
                <button
                  onClick={() => setViewMode('normal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'normal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Eye className="w-4 h-4 inline-block mr-2" />
                  Normal
                </button>
              </div>
            )}

            {/* Affichage selon le mode */}
            {content.correction && isGraded && (
              <>
                {viewMode === 'comparison' ? (
                  // Vue côte à côte : Soumission | Correction
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-900 flex items-center">
                        <span className="mr-2">📝</span>
                        Votre réponse
                      </h4>
                      <div className="bg-white p-3 rounded border border-blue-300">
                        {submission?.answer_text ? (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {submission.answer_text}
                          </p>
                        ) : submission?.answer_json ? (
                          <pre className="text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(submission.answer_json, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-gray-500 italic text-sm">Aucune réponse texte</p>
                        )}
                        {submission?.file_path && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <a
                              href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              📎 {submission.file_path.split('/').pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <h4 className="font-semibold mb-3 text-green-900 flex items-center">
                        <span className="mr-2">✅</span>
                        Correction
                      </h4>
                      <div className="bg-white p-3 rounded border border-green-300">
                        {typeof content.correction === 'object' ? (
                          <RichTextEditor
                            content={content.correction}
                            onChange={() => {}}
                            editable={false}
                          />
                        ) : (
                          <p className="text-gray-800 whitespace-pre-wrap text-sm">
                            {content.correction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'slide' ? (
                  // Vue présentation slide
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border-2 border-purple-200 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                          <span>Note: <strong className="text-green-600">{submission?.grade}/100</strong></span>
                          <span>•</span>
                          <span>Soumis le {new Date(submission?.submitted_at || '').toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Votre réponse
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {submission?.answer_text ? (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {submission.answer_text}
                              </p>
                            ) : submission?.answer_json ? (
                              <pre className="text-xs text-gray-800 overflow-x-auto bg-gray-50 p-3 rounded">
                                {JSON.stringify(submission.answer_json, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-gray-500 italic">Aucune réponse texte</p>
                            )}
                            {submission?.file_path && (
                              <div className="mt-4 pt-4 border-t">
                                <a
                                  href={supabase.storage.from('submissions').getPublicUrl(submission.file_path).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  📎 Fichier joint: {submission.file_path.split('/').pop()}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <span className="mr-2">✅</span>
                            Correction
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            {typeof content.correction === 'object' ? (
                              <RichTextEditor
                                content={content.correction}
                                onChange={() => {}}
                                editable={false}
                              />
                            ) : (
                              <p className="text-gray-800 whitespace-pre-wrap">
                                {content.correction}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vue normale (par défaut)
                  <details className="mt-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">Voir la correction</summary>
                    <div className="mt-2 bg-white p-4 rounded-lg border border-gray-200">
                      {typeof content.correction === 'object' ? (
                        <RichTextEditor
                          content={content.correction}
                          onChange={() => {}}
                          editable={false}
                        />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{content.correction}</p>
                      )}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTp = () => {
    const isSubmitted = submission?.status === 'submitted'
    const isGraded = submission?.status === 'graded'

    return (
      <div className="space-y-6">
        {item.content?.instructions && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Consignes du TP</h3>
            {typeof item.content.instructions === 'object' ? (
              <RichTextEditor
                content={item.content.instructions}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <p className="text-purple-800">{item.content.instructions}</p>
            )}
          {item.content?.checklist && (
            <div className="mt-4">
              <h4 className="font-medium text-purple-900">Checklist</h4>
              <ul className="list-disc list-inside text-purple-800 mt-2">
                {item.content.checklist.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Votre rendu</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitted}
            className="input-field h-32 resize-none"
            placeholder="Décrivez votre travail..."
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fichier à soumettre (optionnel)
            </label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.zip,.rar"
              disabled={isSubmitted}
            />
            {submission?.file_path && (
              <p className="text-sm text-gray-600">
                Fichier soumis: {submission.file_path.split('/').pop()}
              </p>
            )}
          </div>
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleTpSubmit}
            disabled={loading || (!answer.trim() && !file)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre le TP'}
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              TP soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
            </p>
            {isGraded && submission.grade && (
              <p className="text-sm font-medium text-green-600">
                Note: {submission.grade}/100
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderGame = () => {
    // ItemRenderer utilise item.content directement comme gameContent
    // (pas item.content.game_content comme dans les chapitres)
    return (
      <div className="space-y-4">
        <GameRenderer
          gameContent={item.content}
          onScore={handleGameScore}
        />
      </div>
    )
  }

  switch (item.type) {
    case 'resource':
      return renderResource()
    case 'slide':
      return renderSlide()
    case 'exercise':
      return renderExercise()
    case 'tp':
      return renderTp()
    case 'game':
      return renderGame()
    default:
      return <p className="text-gray-600">Type d'élément non supporté.</p>
  }
}
