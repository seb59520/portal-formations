import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Item } from '../types/database'
import { CardMatchingGame } from './CardMatchingGame'
import { ColumnMatchingGame } from './ColumnMatchingGame'
import { ApiTypesGame } from './ApiTypesGame'
import { FormatFilesGame } from './FormatFilesGame'
import { Gamepad2, FileText, Loader2 } from 'lucide-react'

interface InteractiveBlockRendererProps {
  type: 'game' | 'tp'
  itemId: string
  title?: string
}

export function InteractiveBlockRenderer({ type, itemId, title }: InteractiveBlockRendererProps) {
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
  }, [itemId])

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw error
      setItem(data)
    } catch (err) {
      console.error('Error fetching item:', err)
      setError('Impossible de charger l\'élément')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="interactive-block-loading">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Chargement...</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="interactive-block-error">
        <span>{error || 'Élément introuvable'}</span>
      </div>
    )
  }

  // Vérifier que le type correspond
  if ((type === 'game' && item.type !== 'game') || (type === 'tp' && item.type !== 'tp')) {
    return (
      <div className="interactive-block-error">
        <span>Type d'élément incorrect</span>
      </div>
    )
  }

  if (type === 'game') {
    const gameType = item.content?.gameType || 'matching'
    
    if (gameType === 'matching') {
      const pairs = item.content?.pairs || []
      return (
        <div className="interactive-block-content">
          <div className="interactive-block-header">
            <Gamepad2 className="w-5 h-5" />
            <h3 className="interactive-block-title">{title || item.title || 'Mini-jeu'}</h3>
          </div>
          {item.content?.description && (
            <div className="interactive-block-description">
              <p>{item.content.description}</p>
            </div>
          )}
          <CardMatchingGame
            pairs={pairs}
            onScore={() => {}}
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
        <div className="interactive-block-content">
          <div className="interactive-block-header">
            <Gamepad2 className="w-5 h-5" />
            <h3 className="interactive-block-title">{title || item.title || 'Mini-jeu'}</h3>
          </div>
          {item.content?.description && (
            <div className="interactive-block-description">
              <p>{item.content.description}</p>
            </div>
          )}
          <ColumnMatchingGame
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            correctMatches={correctMatches}
            onScore={() => {}}
            description={item.content?.instructions}
          />
        </div>
      )
    }

    if (gameType === 'api-types') {
      const apiTypes = item.content?.apiTypes || []
      const scenarios = item.content?.scenarios || []
      
      return (
        <div className="interactive-block-content">
          <div className="interactive-block-header">
            <Gamepad2 className="w-5 h-5" />
            <h3 className="interactive-block-title">{title || item.title || 'Mini-jeu'}</h3>
          </div>
          {item.content?.description && (
            <div className="interactive-block-description">
              <p>{item.content.description}</p>
            </div>
          )}
          <ApiTypesGame
            apiTypes={apiTypes}
            scenarios={scenarios}
            onScore={() => {}}
            description={item.content?.instructions}
          />
        </div>
      )
    }

    if (gameType === 'format-files') {
      const levels = item.content?.levels || []
      
      return (
        <div className="interactive-block-content">
          <div className="interactive-block-header">
            <Gamepad2 className="w-5 h-5" />
            <h3 className="interactive-block-title">{title || item.title || 'Mini-jeu'}</h3>
          </div>
          {item.content?.description && (
            <div className="interactive-block-description">
              <p>{item.content.description}</p>
            </div>
          )}
          <FormatFilesGame
            levels={levels}
            onScore={() => {}}
            description={item.content?.instructions}
          />
        </div>
      )
    }
  }

  if (type === 'tp') {
    return (
      <div className="interactive-block-content">
        <div className="interactive-block-header">
          <FileText className="w-5 h-5" />
          <h3 className="interactive-block-title">{title || item.title || 'Travaux Pratiques'}</h3>
        </div>
        {item.content?.instructions && (
          <div className="interactive-block-description">
            <div dangerouslySetInnerHTML={{ __html: item.content.instructions }} />
          </div>
        )}
        <div className="interactive-block-note">
          <p className="text-sm text-gray-600">
            💡 Pour soumettre votre travail, accédez à l'élément complet depuis le menu de la formation.
          </p>
        </div>
      </div>
    )
  }

  return null
}

