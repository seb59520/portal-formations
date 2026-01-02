import { ItemJson, ChapterJson } from '../pages/admin/AdminItemEditJson'
import { RichTextEditor } from './RichTextEditor'
import { GameRenderer } from './GameRenderer'
import { PdfViewer } from './PdfViewer'
import { Lexique } from '../pages/Lexique'
import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react'

interface ReactItemRendererProps {
  itemJson: ItemJson
}

export function ReactItemRenderer({ itemJson }: ReactItemRendererProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())

  // Récupérer le thème de l'item ou utiliser les valeurs par défaut
  const itemTheme = itemJson.theme || {
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    fontFamily: 'Inter'
  }

  // Styles CSS variables pour le thème
  const themeStyles = {
    '--item-primary': itemTheme.primaryColor,
    '--item-secondary': itemTheme.secondaryColor,
    '--item-font': itemTheme.fontFamily
  } as React.CSSProperties

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedChapters(newExpanded)
  }

  return (
    <div 
      className="item-renderer"
      style={themeStyles}
    >
      {/* En-tête de l'item */}
      <div className="mb-6 pb-4 border-b-2" style={{ borderColor: itemTheme.primaryColor }}>
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ color: itemTheme.primaryColor }}
        >
          {itemJson.title}
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="capitalize font-medium">{itemJson.type}</span>
          {itemJson.published !== false && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              Publié
            </span>
          )}
        </div>
      </div>

      {/* Détecter si c'est un lexique */}
      {(itemJson.title.toLowerCase().includes('lexique') || itemJson.content?.isLexique) ? (
        <div className="mt-4">
          <Lexique />
        </div>
      ) : (
        <>
          {/* Contenu selon le type */}
          {renderItemContent(itemJson, itemTheme)}

          {/* Chapitres intégrés */}
          {itemJson.chapters && itemJson.chapters.length > 0 && (
        <div className="mt-8 pt-6 border-t-2" style={{ borderColor: itemTheme.primaryColor }}>
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: itemTheme.primaryColor }}
          >
            Chapitres
          </h2>
          <div className="space-y-3">
            {itemJson.chapters.map((chapter, index) => {
              const isGame = chapter.type === 'game'
              const chapterNumber = itemJson.chapters!.filter((c, i) => i < index && c.type !== 'game').length + 1

              return (
                <div
                  key={index}
                  className={`border rounded-lg shadow-sm ${
                    isGame 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => toggleChapter(index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {isGame ? (
                        <>
                          <Gamepad2 className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-semibold text-red-900">{chapter.title}</h3>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-gray-500">#{chapterNumber}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                        </>
                      )}
                    </div>
                    {expandedChapters.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {expandedChapters.has(index) && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      <div className="pt-6">
                        {isGame ? (
                          renderGameFromChapter(chapter.game_content, itemTheme)
                        ) : chapter.content ? (
                          // Support pour content.body (TipTap), content.text (texte simple) ou content (objet RichText direct)
                          chapter.content.body ? (
                            <RichTextEditor
                              content={chapter.content.body}
                              onChange={() => {}}
                              editable={false}
                            />
                          ) : chapter.content.text ? (
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                              {chapter.content.text}
                            </div>
                          ) : typeof chapter.content === 'string' ? (
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                              {chapter.content}
                            </div>
                          ) : (
                            <RichTextEditor
                              content={chapter.content}
                              onChange={() => {}}
                              editable={false}
                            />
                          )
                        ) : (
                          <p className="text-gray-500 italic">Ce chapitre n'a pas encore de contenu.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
          )}
        </>
      )}
    </div>
  )
}

function renderItemContent(item: ItemJson, theme: any) {
  switch (item.type) {
    case 'resource':
      return renderResource(item, theme)
    case 'slide':
      return renderSlide(item, theme)
    case 'exercise':
      return renderExercise(item, theme)
    case 'tp':
      return renderTp(item, theme)
    case 'game':
      return renderGame(item, theme)
    default:
      return <p className="text-gray-600">Type d'élément non supporté.</p>
  }
}

function renderResource(item: ItemJson, theme: any) {
  if (item.external_url) {
    return (
      <div className="space-y-4">
        {item.content.description && (
          <p className="text-gray-600">{item.content.description}</p>
        )}
        <a
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
          style={{ backgroundColor: theme.primaryColor }}
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
        {item.content.description && (
          <p className="text-gray-600">{item.content.description}</p>
        )}
        {item.asset_path.endsWith('.pdf') ? (
          <PdfViewer url={data.publicUrl} />
        ) : (
          <a
            href={data.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
            style={{ backgroundColor: theme.primaryColor }}
          >
            Télécharger le fichier
          </a>
        )}
      </div>
    )
  }

  if (item.content.body) {
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

  return <p className="text-gray-600">Contenu non disponible.</p>
}

function renderSlide(item: ItemJson, theme: any) {
  // Si l'item a un asset_path (PDF ou image)
  if (item.asset_path) {
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(item.asset_path)

    return (
      <div className="space-y-4">
        {(item.content?.summary || item.content?.description) && (
          <div 
            className="p-3 rounded-lg mb-3"
            style={{ backgroundColor: `${theme.primaryColor}10` }}
          >
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

  // Toujours afficher le résumé s'il existe, même sans chapitres
  const hasSummary = item.content?.summary || item.content?.description
  const hasChapters = item.chapters && item.chapters.length > 0

  if (hasSummary || hasChapters) {
    return (
      <div className="space-y-4">
        {hasSummary && (
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${theme.primaryColor}10` }}
          >
            <h4 
              className="font-medium mb-2"
              style={{ color: theme.primaryColor }}
            >
              📝 Résumé
            </h4>
            <p className="text-gray-700">
              {item.content?.summary || item.content?.description}
            </p>
          </div>
        )}
        {hasChapters && (
          <p className="text-sm text-gray-500 italic">
            Le contenu détaillé est disponible dans les chapitres ci-dessous.
          </p>
        )}
        {!hasChapters && hasSummary && (
          <p className="text-sm text-gray-500 italic">
            Les chapitres seront affichés ci-dessous une fois chargés.
          </p>
        )}
      </div>
    )
  }

  // Si rien n'est disponible
  return <p className="text-gray-600">Support non disponible.</p>
}

function renderExercise(item: ItemJson, theme: any) {
  const content = item.content as any

  // Détecter si c'est un exercice d'analyse d'API (structure enrichie)
  const isApiAnalysisExercise = content?.objective || content?.input_api || content?.instructions

  if (isApiAnalysisExercise) {
    return renderApiAnalysisExercise(item, theme)
  }

  // Rendu classique pour les exercices simples
  return (
    <div className="space-y-6">
      {item.content.question && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Énoncé
          </h4>
          {typeof item.content.question === 'object' ? (
            <RichTextEditor
              content={item.content.question}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <p style={{ color: theme.primaryColor }}>{item.content.question}</p>
          )}
        </div>
      )}

      {item.content.correction && (
        <div 
          className="p-4 rounded-lg mt-4"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Correction
          </h4>
          {typeof item.content.correction === 'object' ? (
            <RichTextEditor
              content={item.content.correction}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <p style={{ color: theme.secondaryColor }}>{item.content.correction}</p>
          )}
        </div>
      )}

      {item.content.body && (
        <div className="prose max-w-none">
          <RichTextEditor
            content={item.content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )}
    </div>
  )
}

function renderApiAnalysisExercise(item: ItemJson, theme: any) {
  const content = item.content as any

  return (
    <div className="space-y-6">
      {/* Objectif */}
      {content.objective && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            backgroundColor: `${theme.primaryColor}10`,
            borderLeftColor: theme.primaryColor
          }}
        >
          <h4 
            className="font-semibold mb-2 text-lg"
            style={{ color: theme.primaryColor }}
          >
            🎯 Objectif
          </h4>
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
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-semibold mb-3 text-lg"
            style={{ color: theme.primaryColor }}
          >
            📝 Instructions
          </h4>
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

      {/* Correction (si disponible) */}
      {content.correction && (
        <details className="bg-gray-50 p-4 rounded-lg border border-gray-300">
          <summary className="font-semibold text-gray-900 cursor-pointer">
            🔍 Voir la correction
          </summary>
          <div className="mt-4">
            {typeof content.correction === 'object' ? (
              <RichTextEditor
                content={content.correction}
                onChange={() => {}}
                editable={false}
              />
            ) : (
              <div className="prose max-w-none text-gray-700">
                {content.correction}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

function renderTp(item: ItemJson, theme: any) {
  return (
    <div className="space-y-6">
      {item.content.instructions && (
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Consignes du TP
          </h4>
          {typeof item.content.instructions === 'object' ? (
            <RichTextEditor
              content={item.content.instructions}
              onChange={() => {}}
              editable={false}
            />
          ) : (
            <p style={{ color: theme.secondaryColor }}>{item.content.instructions}</p>
          )}
        </div>
      )}

      {item.content.checklist && item.content.checklist.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Checklist</h4>
          <ul className="list-disc list-inside space-y-2">
            {item.content.checklist.map((task, index) => (
              <li key={index} className="text-gray-700">{task}</li>
            ))}
          </ul>
        </div>
      )}

      {item.content.body && (
        <div className="prose max-w-none">
          <RichTextEditor
            content={item.content.body}
            onChange={() => {}}
            editable={false}
          />
        </div>
      )}
    </div>
  )
}

function renderGameFromChapter(gameContent: any, theme: any) {
  // Vérification de sécurité : si gameContent est null/undefined, afficher un message
  if (!gameContent) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium mb-2">⚠️ Jeu non configuré</p>
        <p className="text-yellow-700 text-sm">
          Le champ game_content est vide ou invalide.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GameRenderer
        gameContent={gameContent}
        onScore={(score, metadata) => {
          console.log('Game score:', score, metadata)
        }}
      />
    </div>
  )
}

function renderGame(item: ItemJson, theme: any) {
  const gameType = item.content.gameType || 'matching'

  if (gameType === 'matching') {
    const pairs = item.content.pairs || []
    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu d'association de cartes
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <CardMatchingGame
          pairs={pairs}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'column-matching') {
    const leftColumn = item.content.leftColumn || []
    const rightColumn = item.content.rightColumn || []
    const correctMatches = item.content.correctMatches || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.secondaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.secondaryColor }}
          >
            Jeu d'association de colonnes
          </h4>
          {item.content.description && (
            <p style={{ color: theme.secondaryColor }}>{item.content.description}</p>
          )}
        </div>
        <ColumnMatchingGame
          leftColumn={leftColumn}
          rightColumn={rightColumn}
          correctMatches={correctMatches}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'api-types') {
    const apiTypes = item.content.apiTypes || []
    const scenarios = item.content.scenarios || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu : Types d'API
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <ApiTypesGame
          apiTypes={apiTypes}
          scenarios={scenarios}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  if (gameType === 'format-files') {
    const levels = item.content.levels || []

    return (
      <div className="space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <h4 
            className="font-medium mb-2"
            style={{ color: theme.primaryColor }}
          >
            Jeu : Formats de fichiers
          </h4>
          {item.content.description && (
            <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
          )}
        </div>
        <FormatFilesGame
          levels={levels}
          onScore={() => {}}
          description={item.content.instructions}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: `${theme.primaryColor}15` }}
      >
        <h4 
          className="font-medium mb-2"
          style={{ color: theme.primaryColor }}
        >
          Mini-jeu
        </h4>
        <p style={{ color: theme.primaryColor }}>{item.content.description}</p>
      </div>
    </div>
  )
}

