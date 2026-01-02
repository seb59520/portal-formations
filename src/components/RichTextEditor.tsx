import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { YouTube } from '../extensions/YouTube'
import { LineHeight } from '../extensions/LineHeight'
import { InteractiveBlock } from '../extensions/InteractiveBlock'
import { Carousel } from '../extensions/Carousel'
import { HtmlBlock } from '../extensions/HtmlBlock'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Youtube, Underline as UnderlineIcon, Table as TableIcon, Minus, Plus, Trash2, Gamepad2, FileText, ChevronLeft, ChevronRight, Search, X, Copy, Code } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarouselInit } from '../hooks/useCarouselInit'
import { useHtmlBlockInit } from '../hooks/useHtmlBlockInit'
import { CarouselEditor } from './CarouselEditor'
import { supabase } from '../lib/supabaseClient'
import { Item } from '../types/database'

interface RichTextEditorProps {
  content: Record<string, any> | null
  onChange: (content: Record<string, any>) => void
  placeholder?: string
  editable?: boolean
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Commencez à écrire...',
  editable = true 
}: RichTextEditorProps) {
  const navigate = useNavigate()
  
  // Valider et nettoyer le contenu pour éviter les erreurs TipTap
  // Si le contenu contient des propriétés de jeu (gameType, etc.), ce n'est pas du contenu TipTap valide
  const isValidTipTapContent = (content: any): boolean => {
    if (!content) return true // null ou undefined est valide
    if (typeof content !== 'object') return false
    // Si le contenu contient gameType, levels, pairs, etc., ce n'est pas du contenu TipTap
    if (content.gameType || content.levels || content.pairs || content.apiTypes || content.scenarios) {
      return false
    }
    // Vérifier que c'est un format TipTap valide (doit avoir type: 'doc')
    return content.type === 'doc' || (content.type && Array.isArray(content.content))
  }
  
  const safeContent = isValidTipTapContent(content) ? content : null
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showLineHeightMenu, setShowLineHeightMenu] = useState(false)
  const [editingCarousel, setEditingCarousel] = useState<{ node: any; pos: number } | null>(null)
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [itemSelectorType, setItemSelectorType] = useState<'game' | 'tp'>('game')
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [itemSearchTerm, setItemSearchTerm] = useState('')
  const [loadingItems, setLoadingItems] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<{ type: 'youtube' | 'image' | 'carousel'; pos: number; size: number } | null>(null)
  const [showWidgetSizeMenu, setShowWidgetSizeMenu] = useState(false)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [editingHtmlBlock, setEditingHtmlBlock] = useState<{ content: string; updateCallback: (newHtml: string) => void } | null>(null)
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeSize, setYoutubeSize] = useState(2)
  const tableMenuRef = useRef<HTMLDivElement>(null)
  const lineHeightMenuRef = useRef<HTMLDivElement>(null)
  const widgetSizeMenuRef = useRef<HTMLDivElement>(null)
  const htmlEditorRef = useRef<HTMLDivElement>(null)

  const fetchAvailableItems = async (type: 'game' | 'tp') => {
    try {
      setLoadingItems(true)
      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', type)
        .order('title', { ascending: true })

      if (error) throw error
      setAvailableItems(items || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      setAvailableItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  const filteredItems = availableItems.filter(item =>
    item.title?.toLowerCase().includes(itemSearchTerm.toLowerCase())
  )

  const handleInsertYouTube = () => {
    if (!editor || !youtubeUrl.trim()) return
    
    try {
      const result = editor.chain().focus().setYouTube({ src: youtubeUrl.trim(), size: youtubeSize }).run()
      
      if (result) {
        setShowYouTubeModal(false)
        setYoutubeUrl('')
        setYoutubeSize(2)
      } else {
        alert('Impossible d\'insérer la vidéo. Vérifiez que l\'URL est valide.')
      }
    } catch (error) {
      console.error('Error inserting YouTube video:', error)
      alert('Erreur lors de l\'insertion de la vidéo: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Désactiver Link dans StarterKit car on l'ajoute séparément avec configuration
        link: false,
        // Désactiver underline dans StarterKit car on l'ajoute séparément
        underline: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            size: {
              default: 2,
              parseHTML: element => {
                const size = element.getAttribute('data-size')
                return size ? parseInt(size) : 2
              },
              renderHTML: attributes => {
                if (!attributes.size) {
                  return {}
                }
                return {
                  'data-size': attributes.size.toString(),
                }
              },
            },
          }
        },
        renderHTML({ HTMLAttributes }) {
          const size = HTMLAttributes.size || 2
          return [
            'img',
            {
              ...HTMLAttributes,
              'data-size': size.toString(),
              class: `${HTMLAttributes.class || ''} widget-size-${size}`.trim(),
            },
          ]
        },
      }).configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'tiptap-table-cell',
        },
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        defaultLineHeight: '1.5',
      }),
      InteractiveBlock.configure({
        HTMLAttributes: {
          class: 'interactive-block',
        },
      }),
      Carousel.configure({
        HTMLAttributes: {
          class: 'tiptap-carousel',
        },
      }),
      YouTube.configure({
        HTMLAttributes: {
          class: 'youtube-video',
        },
        width: 640,
        height: 360,
      }),
      HtmlBlock.configure({
        HTMLAttributes: {
          class: 'html-block',
        },
      }),
    ],
    content: safeContent || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none w-full focus:outline-none min-h-[200px] p-4 lg:p-6 xl:p-8',
      },
      handleKeyDown: (view, event) => {
        // Permettre la suppression de tableaux avec Backspace/Delete
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const { state } = view
          const { selection } = state
          const { $from } = selection
          
          // Vérifier si on est dans un tableau
          const tableNode = $from.node(-1)
          if (tableNode && tableNode.type.name === 'table') {
            // Si le tableau est vide ou presque vide, le supprimer
            const tableSize = tableNode.content.size
            if (tableSize < 10) { // Tableau presque vide
              const tablePos = $from.before(-1)
              view.dispatch(
                state.tr.delete(tablePos, tablePos + tableNode.nodeSize)
              )
              return true
            }
          }
        }
        return false
      },
    },
  })

  // Initialiser les carrousels après le rendu et quand le contenu change
  useCarouselInit([content])
  
  // Initialiser les blocs HTML après le rendu
  useHtmlBlockInit([content])

  // Écouter les événements d'édition de blocs HTML
  useEffect(() => {
    const handleHtmlBlockEdit = (event: Event) => {
      console.log('RichTextEditor: html-block-edit event received', event)
      const customEvent = event as CustomEvent<{
        currentContent: string
        position: number | null
        updateCallback: (newHtml: string) => void
      }>
      
      if (customEvent.detail) {
        console.log('RichTextEditor: Opening HTML edit modal with content:', customEvent.detail.currentContent)
        setEditingHtmlBlock({
          content: customEvent.detail.currentContent,
          updateCallback: customEvent.detail.updateCallback
        })
      } else {
        console.warn('RichTextEditor: html-block-edit event missing detail')
      }
    }

    console.log('RichTextEditor: Adding html-block-edit event listener')
    document.addEventListener('html-block-edit', handleHtmlBlockEdit)
    return () => {
      console.log('RichTextEditor: Removing html-block-edit event listener')
      document.removeEventListener('html-block-edit', handleHtmlBlockEdit)
    }
  }, [])

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false)
      }
      if (lineHeightMenuRef.current && !lineHeightMenuRef.current.contains(event.target as Node)) {
        setShowLineHeightMenu(false)
      }
      if (widgetSizeMenuRef.current && !widgetSizeMenuRef.current.contains(event.target as Node)) {
        setShowWidgetSizeMenu(false)
        setSelectedWidget(null)
      }
      if (htmlEditorRef.current && !htmlEditorRef.current.contains(event.target as Node)) {
        // Ne pas fermer automatiquement la modale HTML pour permettre le copier-coller
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Rendre les blocs interactifs cliquables en mode lecture seule
  useEffect(() => {
    if (editable) return
    if (!editor) return

    const handleInteractiveBlockClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const block = target.closest('[data-interactive-block="true"]')
      
      if (block) {
        event.preventDefault()
        event.stopPropagation()
        
        const itemId = block.getAttribute('data-item-id')
        const type = block.getAttribute('data-type')
        
        if (itemId) {
          // Utiliser React Router pour la navigation SPA (préserve la session)
          navigate(`/items/${itemId}`)
        }
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleInteractiveBlockClick)
    
    return () => {
      editorElement.removeEventListener('click', handleInteractiveBlockClick)
    }
  }, [editable, editor, navigate])

  // Détecter les clics sur les widgets (YouTube, Image) pour changer la taille
  useEffect(() => {
    if (!editable) return
    if (!editor) return

    const handleWidgetClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const youtubeWidget = target.closest('[data-youtube-video="true"]')
      const imageWidget = target.closest('img[src]')
      
      if (youtubeWidget) {
        event.preventDefault()
        event.stopPropagation()
        
        try {
          const view = editor.view
          const pos = view.posAtDOM(youtubeWidget, 0)
          if (pos !== null && pos >= 0) {
            const node = view.state.doc.nodeAt(pos)
            if (node && node.type.name === 'youtube') {
              const currentSize = node.attrs.size || 2
              setSelectedWidget({ type: 'youtube', pos, size: currentSize })
              setShowWidgetSizeMenu(true)
            }
          }
        } catch (error) {
          console.error('Error detecting YouTube widget click:', error)
        }
      } else if (imageWidget) {
        // Vérifier que l'image n'est pas dans un carrousel
        if (!target.closest('[data-carousel="true"]')) {
          event.preventDefault()
          event.stopPropagation()
          
          try {
            const view = editor.view
            const pos = view.posAtDOM(imageWidget, 0)
            if (pos !== null && pos >= 0) {
              const node = view.state.doc.nodeAt(pos)
              if (node && node.type.name === 'image') {
                const currentSize = node.attrs.size || 2
                setSelectedWidget({ type: 'image', pos, size: currentSize })
                setShowWidgetSizeMenu(true)
              }
            }
          } catch (error) {
            console.error('Error detecting image widget click:', error)
          }
        }
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleWidgetClick, true)
    
    return () => {
      editorElement.removeEventListener('click', handleWidgetClick, true)
    }
  }, [editable, editor])

  // Détecter les clics sur les carrousels pour l'édition
  useEffect(() => {
    if (!editable) return
    if (!editor) return

    const handleCarouselClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const carousel = target.closest('[data-carousel="true"]')
      
      if (carousel && !target.closest('.carousel-button') && !target.closest('.carousel-indicator')) {
        event.preventDefault()
        event.stopPropagation()
        
        // Trouver la position du nœud dans l'éditeur
        try {
          const view = editor.view
          const pos = view.posAtDOM(carousel, 0)
          if (pos !== null && pos >= 0) {
            const node = view.state.doc.nodeAt(pos)
            if (node && node.type.name === 'carousel') {
              // Si double-clic, ouvrir l'éditeur, sinon ouvrir le menu de taille
              if (event.detail === 2) {
                setEditingCarousel({ node, pos })
              } else {
                const currentSize = node.attrs.size || 2
                setSelectedWidget({ type: 'carousel', pos, size: currentSize })
                setShowWidgetSizeMenu(true)
              }
            }
          }
        } catch (error) {
          console.error('Error detecting carousel click:', error)
        }
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('click', handleCarouselClick, true)
    
    return () => {
      editorElement.removeEventListener('click', handleCarouselClick, true)
    }
  }, [editable, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      {editable && (
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('bold') ? 'bg-gray-200' : ''
            }`}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('italic') ? 'bg-gray-200' : ''
            }`}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('underline') ? 'bg-gray-200' : ''
            }`}
            title="Souligner"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
            }`}
            title="Titre 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
            }`}
            title="Titre 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
            }`}
            title="Titre 3"
          >
            H3
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('bulletList') ? 'bg-gray-200' : ''
            }`}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('orderedList') ? 'bg-gray-200' : ''
            }`}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('Entrez l\'URL du lien:')
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('link') ? 'bg-gray-200' : ''
            }`}
            title="Ajouter un lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <div className="relative" ref={tableMenuRef}>
            <button
              type="button"
              onClick={() => setShowTableMenu(!showTableMenu)}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor.isActive('table') ? 'bg-gray-200' : ''
              }`}
              title="Insérer un tableau"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            {showTableMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const rows = Math.floor(i / 5) + 1
                    const cols = (i % 5) + 1
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          editor
                            .chain()
                            .focus()
                            .insertTable({
                              rows,
                              cols,
                              withHeaderRow: false,
                            })
                            .run()
                          setShowTableMenu(false)
                        }}
                        className="w-6 h-6 border border-gray-300 hover:bg-blue-100 hover:border-blue-500 rounded"
                        title={`${rows} × ${cols}`}
                      />
                    )
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Sélectionnez la taille
                </div>
              </div>
            )}
          </div>
          {editor.isActive('table') && (
            <>
              <div className="w-px bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                disabled={!editor.can().addColumnBefore()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Ajouter une colonne avant"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                disabled={!editor.can().addColumnAfter()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Ajouter une colonne après"
              >
                <Plus className="w-4 h-4 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                disabled={!editor.can().deleteColumn()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Supprimer la colonne"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                disabled={!editor.can().addRowBefore()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Ajouter une ligne avant"
              >
                <Plus className="w-4 h-4 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                disabled={!editor.can().addRowAfter()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Ajouter une ligne après"
              >
                <Plus className="w-4 h-4 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                disabled={!editor.can().deleteRow()}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Supprimer la ligne"
              >
                <Minus className="w-4 h-4 rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => {
                  // Essayer de supprimer le tableau même si le curseur n'est pas dedans
                  if (editor.can().deleteTable()) {
                    editor.chain().focus().deleteTable().run()
                  } else {
                    // Si on ne peut pas supprimer, essayer de sélectionner tout le tableau puis le supprimer
                    const { state } = editor
                    const { selection } = state
                    const { $from, $to } = selection
                    
                    // Chercher le nœud tableau parent
                    let tableNode = null
                    let tablePos = null
                    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
                      if (node.type.name === 'table') {
                        tableNode = node
                        tablePos = pos
                      }
                    })
                    
                    if (tableNode && tablePos !== null) {
                      editor.chain()
                        .setTextSelection({ from: tablePos, to: tablePos + tableNode.nodeSize })
                        .deleteSelection()
                        .run()
                    } else {
                      alert('Placez votre curseur dans le tableau pour le supprimer, ou utilisez la touche Backspace/Delete.')
                    }
                  }
                }}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 text-red-600"
                title="Supprimer le tableau (ou placez le curseur dans le tableau et appuyez sur Backspace/Delete)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <div className="w-px bg-gray-300 mx-1" />
          <div className="relative" ref={lineHeightMenuRef}>
            <button
              type="button"
              onClick={() => setShowLineHeightMenu(!showLineHeightMenu)}
              className="p-2 rounded hover:bg-gray-100"
              title="Interligne"
            >
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-t border-b border-gray-600" />
                <span className="text-xs">1.5</span>
              </div>
            </button>
            {showLineHeightMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight('1').run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  Simple (1.0)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight('1.25').run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  Étroit (1.25)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight('1.5').run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  Normal (1.5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight('1.75').run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  Large (1.75)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setLineHeight('2').run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  Très large (2.0)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLineHeight().run()
                    setShowLineHeightMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
            }`}
            title="Aligner à gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
            }`}
            title="Centrer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
            }`}
            title="Aligner à droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''
            }`}
            title="Justifier"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => {
              const color = window.prompt('Entrez une couleur (ex: #FF0000, red, rgb(255,0,0)):')
              if (color) {
                editor.chain().focus().setColor(color).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor.isActive('textStyle') ? 'bg-gray-200' : ''
            }`}
            title="Couleur du texte"
          >
            <Palette className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              
              if (!editor) {
                console.error('Editor not initialized')
                return
              }
              
              // Vérifier que l'extension YouTube est chargée
              const youtubeExtension = editor.extensionManager.extensions.find(ext => ext.name === 'youtube')
              if (!youtubeExtension) {
                console.error('YouTube extension not found')
                console.log('Available extensions:', editor.extensionManager.extensions.map(ext => ext.name))
                alert('L\'extension YouTube n\'est pas chargée')
                return
              }
              
              setYoutubeUrl('')
              setYoutubeSize(2)
              setShowYouTubeModal(true)
            }}
            disabled={!editor}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ajouter une vidéo YouTube"
          >
            <Youtube className="w-4 h-4 text-red-600" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => {
              const type = window.confirm('Sélectionnez le type:\nOK = Mini-jeu\nAnnuler = TP') ? 'game' : 'tp'
              setItemSelectorType(type)
              setShowItemSelector(true)
              fetchAvailableItems(type)
            }}
            className="p-2 rounded hover:bg-gray-100"
            title="Insérer un raccourci vers un mini-jeu ou TP"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const numItemsStr = window.prompt('Nombre d\'éléments dans le carrousel (2-10):', '3')
              const numItems = parseInt(numItemsStr || '3')
              if (numItems >= 2 && numItems <= 10) {
                const sizeStr = window.prompt('Taille du carrousel (1=Petite, 2=Moyenne, 3=Grande, 4=Très grande):', '2')
                const size = parseInt(sizeStr || '2')
                const finalSize = size >= 1 && size <= 4 ? size : 2
                const items = []
                for (let i = 0; i < numItems; i++) {
                  const type = window.prompt(
                    `Type de l'élément ${i + 1}:\n1 = Texte\n2 = Image\n3 = Vidéo\n4 = Contenu HTML`,
                    '1'
                  )
                  let finalType = 'text'
                  if (type === '2') finalType = 'image'
                  else if (type === '3') finalType = 'video'
                  else if (type === '4') finalType = 'content'
                  
                  let content = ''
                  let title = ''
                  let imageUrl = ''
                  let videoUrl = ''
                  
                  if (finalType === 'image') {
                    imageUrl = window.prompt(`URL de l'image ${i + 1}:`) || ''
                    title = window.prompt(`Titre de l'image ${i + 1} (optionnel):`) || ''
                  } else if (finalType === 'video') {
                    videoUrl = window.prompt(`URL de la vidéo ${i + 1}:`) || ''
                    title = window.prompt(`Titre de la vidéo ${i + 1} (optionnel):`) || ''
                  } else {
                    title = window.prompt(`Titre de l'élément ${i + 1} (optionnel):`) || ''
                    content = window.prompt(`Contenu de l'élément ${i + 1} (texte ou HTML):`) || ''
                  }
                  
                  items.push({
                    type: finalType,
                    content,
                    title: title || undefined,
                    imageUrl: imageUrl || undefined,
                    videoUrl: videoUrl || undefined,
                  })
                }
                editor.chain().focus().setCarousel({ items, size: finalSize }).run()
              } else {
                alert('Le nombre d\'éléments doit être entre 2 et 10')
              }
            }}
            className="p-2 rounded hover:bg-gray-100 flex items-center gap-1"
            title="Insérer un carrousel"
          >
            <ChevronLeft className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => {
              setHtmlContent('')
              setShowHtmlEditor(true)
            }}
            className="p-2 rounded hover:bg-gray-100"
            title="Insérer un bloc HTML brut"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Annuler"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Refaire"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Menu de sélection de taille pour les widgets */}
      {showWidgetSizeMenu && selectedWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div 
            ref={widgetSizeMenuRef}
            className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 m-4 max-w-md w-full"
          >
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Taille du widget ({
                selectedWidget.type === 'youtube' ? 'Vidéo' : 
                selectedWidget.type === 'image' ? 'Image' : 
                'Carrousel'
              })
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (selectedWidget.type === 'youtube') {
                      editor.chain()
                        .focus()
                        .command(({ tr, state }) => {
                          const node = state.doc.nodeAt(selectedWidget.pos)
                          if (node && node.type.name === 'youtube') {
                            tr.setNodeMarkup(selectedWidget.pos, undefined, {
                              ...node.attrs,
                              size: size,
                            })
                            return true
                          }
                          return false
                        })
                        .run()
                    } else if (selectedWidget.type === 'image') {
                      editor.chain()
                        .focus()
                        .command(({ tr, state }) => {
                          const node = state.doc.nodeAt(selectedWidget.pos)
                          if (node && node.type.name === 'image') {
                            tr.setNodeMarkup(selectedWidget.pos, undefined, {
                              ...node.attrs,
                              size: size,
                            })
                            return true
                          }
                          return false
                        })
                        .run()
                    } else if (selectedWidget.type === 'carousel') {
                      editor.chain()
                        .focus()
                        .command(({ tr, state }) => {
                          const node = state.doc.nodeAt(selectedWidget.pos)
                          if (node && node.type.name === 'carousel') {
                            tr.setNodeMarkup(selectedWidget.pos, undefined, {
                              ...node.attrs,
                              size: size,
                            })
                            return true
                          }
                          return false
                        })
                        .run()
                    }
                    setShowWidgetSizeMenu(false)
                    setSelectedWidget(null)
                  }}
                  className={`px-3 py-2 rounded border-2 transition-colors ${
                    selectedWidget.size === size
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                  title={`Taille ${size}${size === 1 ? ' (Petite)' : size === 2 ? ' (Moyenne)' : size === 3 ? ' (Grande)' : ' (Très grande)'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setShowWidgetSizeMenu(false)
              setSelectedWidget(null)
            }}
            className="w-full mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
          >
            Fermer
          </button>
          </div>
        </div>
      )}

      <EditorContent editor={editor} className="min-h-[200px] max-h-[600px] overflow-y-auto rich-text-editor-content" />
      
      {/* Éditeur de carrousel */}
      {editingCarousel && editor && (
        <CarouselEditor
          items={editingCarousel.node.attrs.items || []}
          onSave={(items) => {
            const { pos, node } = editingCarousel
            editor
              .chain()
              .focus()
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const nodeAtPos = tr.doc.nodeAt(pos)
                  if (nodeAtPos && nodeAtPos.type.name === 'carousel') {
                    tr.setNodeMarkup(pos, undefined, {
                      ...nodeAtPos.attrs,
                      items,
                    })
                  }
                }
                return true
              })
              .run()
            setEditingCarousel(null)
          }}
          onCancel={() => setEditingCarousel(null)}
        />
      )}

      {/* Modale d'édition HTML */}
      {showHtmlEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={htmlEditorRef}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Insérer du code HTML
              </h2>
              <button
                onClick={() => {
                  setShowHtmlEditor(false)
                  setHtmlContent('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collez votre code HTML ici :
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="<!DOCTYPE html>..."
                style={{ minHeight: '400px', resize: 'vertical' }}
              />
              <p className="mt-2 text-xs text-gray-500">
                Le HTML sera rendu tel quel dans l'éditeur. Assurez-vous que votre code est valide.
              </p>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowHtmlEditor(false)
                  setHtmlContent('')
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (htmlContent.trim()) {
                    editor.chain().focus().setHtmlBlock({ content: htmlContent.trim() }).run()
                    setShowHtmlEditor(false)
                    setHtmlContent('')
                  } else {
                    alert('Veuillez entrer du code HTML')
                  }
                }}
                className="btn-primary"
              >
                Insérer le HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition HTML */}
      {editingHtmlBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Modifier le code HTML
              </h2>
              <button
                onClick={() => {
                  setEditingHtmlBlock(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modifiez votre code HTML :
              </label>
              <textarea
                value={editingHtmlBlock.content}
                onChange={(e) => {
                  setEditingHtmlBlock({
                    ...editingHtmlBlock,
                    content: e.target.value
                  })
                }}
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="<!DOCTYPE html>..."
                style={{ minHeight: '400px', resize: 'vertical' }}
              />
              <p className="mt-2 text-xs text-gray-500">
                Le HTML sera rendu tel quel dans l'éditeur. Assurez-vous que votre code est valide.
              </p>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingHtmlBlock(null)
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (editingHtmlBlock.content.trim()) {
                    editingHtmlBlock.updateCallback(editingHtmlBlock.content.trim())
                    // Déclencher onChange manuellement après la mise à jour
                    setTimeout(() => {
                      if (editor) {
                        onChange(editor.getJSON())
                      }
                    }, 100)
                    setEditingHtmlBlock(null)
                  } else {
                    alert('Le code HTML ne peut pas être vide')
                  }
                }}
                className="btn-primary"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de sélection d'élément (jeu ou TP) */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Sélectionner un {itemSelectorType === 'game' ? 'mini-jeu' : 'TP'}
              </h2>
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setItemSearchTerm('')
                  setAvailableItems([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {itemSearchTerm ? 'Aucun élément trouvé pour cette recherche.' : 'Aucun élément disponible.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          const title = window.prompt('Titre du raccourci (optionnel, laissez vide pour utiliser le titre de l\'élément):')
                          editor.chain().focus().setInteractiveBlock({ 
                            type: itemSelectorType,
                            itemId: item.id,
                            title: title || undefined
                          }).run()
                          setShowItemSelector(false)
                          setItemSearchTerm('')
                          setAvailableItems([])
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            {item.content?.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.content.description}
                              </p>
                            )}
                          </div>
                          {itemSelectorType === 'game' ? (
                            <Gamepad2 className="w-5 h-5 text-gray-400 ml-4" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 ml-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowItemSelector(false)
                  setItemSearchTerm('')
                  setAvailableItems([])
                }}
                className="btn-secondary w-full"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale YouTube */}
      {showYouTubeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ajouter une vidéo YouTube
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la vidéo YouTube *
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou juste VIDEO_ID"
                    className="input-field w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && youtubeUrl.trim()) {
                        e.preventDefault()
                        handleInsertYouTube()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés : URL complète ou juste l'ID de la vidéo
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille de la vidéo
                  </label>
                  <select
                    value={youtubeSize}
                    onChange={(e) => setYoutubeSize(parseInt(e.target.value))}
                    className="input-field w-full"
                  >
                    <option value={1}>1 - Petite</option>
                    <option value={2}>2 - Moyenne</option>
                    <option value={3}>3 - Grande</option>
                    <option value={4}>4 - Très grande</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowYouTubeModal(false)
                  setYoutubeUrl('')
                }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleInsertYouTube}
                disabled={!youtubeUrl.trim() || !editor}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

