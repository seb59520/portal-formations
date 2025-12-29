import { useState } from 'react'
import { Item, Submission } from '../types/database'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { PdfViewer } from './PdfViewer'
import { FileUpload } from './FileUpload'
import { RichTextEditor } from './RichTextEditor'
import { CardMatchingGame } from './CardMatchingGame'
import { ColumnMatchingGame } from './ColumnMatchingGame'

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

  const handleExerciseSubmit = async () => {
    if (!user?.id || !answer.trim()) return

    setLoading(true)
    try {
      const submissionData = {
        user_id: user.id,
        item_id: item.id,
        answer_text: answer,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single()

      if (error) throw error
      onSubmissionUpdate(data)
    } catch (error) {
      console.error('Error submitting exercise:', error)
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

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError
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

      if (error) throw error
      onSubmissionUpdate(data)
    } catch (error) {
      console.error('Error submitting TP:', error)
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
            <img
              src={data.publicUrl}
              alt={item.title}
              className="max-w-full h-auto rounded-lg shadow"
            />
          )}
        </div>
      )
    }

    return <p className="text-gray-600">Support non disponible.</p>
  }

  const renderExercise = () => {
    const isSubmitted = submission?.status === 'submitted'
    const isGraded = submission?.status === 'graded'

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
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleExerciseSubmit}
            disabled={loading || !answer.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Soumission...' : 'Soumettre'}
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Réponse soumise le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
            </p>
            {isGraded && submission.grade && (
              <p className="text-sm font-medium text-green-600">
                Note: {submission.grade}/100
              </p>
            )}
            {item.content?.correction && isGraded && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900">Correction</h4>
                {typeof item.content.correction === 'object' ? (
                  <RichTextEditor
                    content={item.content.correction}
                    onChange={() => {}}
                    editable={false}
                  />
                ) : (
                  <p className="text-gray-700">{item.content.correction}</p>
                )}
              </div>
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
    const gameType = item.content?.gameType || 'matching'
    
    if (gameType === 'matching') {
      const pairs = item.content?.pairs || []
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Jeu d'association de cartes</h3>
            {item.content?.description && (
              <p className="text-blue-800">{item.content.description}</p>
            )}
          </div>
          <CardMatchingGame
            pairs={pairs}
            onScore={handleGameScore}
            description={item.content?.instructions}
          />
        </div>
      )
    }

    if (gameType === 'column-matching') {
      const leftColumn = item.content?.leftColumn || []
      const rightColumn = item.content?.rightColumn || []
      const correctMatches = item.content?.correctMatches || []
      
      return (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Jeu d'association de colonnes</h3>
            {item.content?.description && (
              <p className="text-purple-800">{item.content.description}</p>
            )}
          </div>
          <ColumnMatchingGame
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            correctMatches={correctMatches}
            onScore={handleGameScore}
            description={item.content?.instructions}
          />
        </div>
      )
    }

    // Fallback pour d'autres types de jeux
    return (
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-medium text-red-900 mb-2">Mini-jeu</h3>
          <p className="text-red-800">{item.content?.description}</p>
        </div>
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-600 mb-4">Type de jeu non reconnu</p>
        </div>
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
