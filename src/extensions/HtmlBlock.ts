import { Node, mergeAttributes } from '@tiptap/core'

export interface HtmlBlockOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    htmlBlock: {
      /**
       * Insère un bloc HTML brut
       */
      setHtmlBlock: (options: { content: string }) => ReturnType
    }
  }
}

export const HtmlBlock = Node.create<HtmlBlockOptions>({
  name: 'htmlBlock',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: '',

  atom: true,
  
  // Forcer l'utilisation de addNodeView pour le rendu
  addAttributes() {
    return {
      'data-content': {
        default: '',
        parseHTML: (element) => {
          const contentDiv = element.querySelector('.html-block-content')
          return contentDiv?.getAttribute('data-html-content') || 
                 contentDiv?.innerHTML || 
                 element.getAttribute('data-html-content') || ''
        },
        renderHTML: (attributes) => {
          return {
            'data-html-content': attributes['data-content'] || '',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-html-block]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const div = node as HTMLElement
          
          // Essayer de récupérer le contenu depuis l'attribut data-html-content
          let content = div.getAttribute('data-html-content') || ''
          
          // Sinon, chercher dans le div .html-block-content
          if (!content) {
            const contentDiv = div.querySelector('.html-block-content')
            if (contentDiv) {
              content = contentDiv.getAttribute('data-html-content') || 
                       (contentDiv as HTMLElement).innerHTML || ''
            }
          }
          
          // Si toujours pas de contenu, prendre le innerHTML du div principal
          if (!content) {
            content = div.innerHTML
          }
          
          return {
            'data-content': content,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const content = HTMLAttributes['data-content'] || ''
    // Pour la sérialisation, on stocke le contenu dans un attribut
    // Le rendu réel se fait dans addNodeView
    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          'data-html-block': 'true',
          'data-html-content': content,
          class: 'html-block-wrapper',
        }
      ),
      [
        'div',
        {
          class: 'html-block-content',
          'data-html-content': content,
        },
      ],
    ]
  },

  addCommands() {
    return {
      setHtmlBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              'data-content': options.content,
            },
          })
        },
    }
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'html-block-wrapper'
      dom.setAttribute('data-html-block', 'true')
      // Ajouter un style pour rendre le bloc visible
      dom.style.cssText = `
        position: relative;
        margin: 16px 0;
        padding: 16px;
        border: 2px dashed #cbd5e1;
        border-radius: 8px;
        background-color: #f8fafc;
        overflow: visible;
      `
      
      const contentDiv = document.createElement('div')
      contentDiv.className = 'html-block-content'
      contentDiv.style.cssText = `
        width: 100%;
        max-width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      `
      let htmlContent = node.attrs['data-content'] || ''
      
      // Rendre le HTML brut directement avec innerHTML
      const renderHtml = () => {
        if (htmlContent && htmlContent.trim()) {
          // Utiliser innerHTML pour interpréter le HTML
          try {
            contentDiv.innerHTML = htmlContent
          } catch (error) {
            console.error('Error rendering HTML:', error)
            contentDiv.textContent = 'Erreur lors du rendu du HTML'
          }
        } else {
          contentDiv.innerHTML = ''
        }
      }
      
      // Rendre immédiatement
      renderHtml()
      
      dom.appendChild(contentDiv)
      
      // Si le contenu vient de renderHTML (via parseHTML), le récupérer
      if (!htmlContent) {
        const existingContent = dom.querySelector('.html-block-content')?.getAttribute('data-html-content')
        if (existingContent) {
          htmlContent = existingContent
          renderHtml()
        }
      }
      
      // En mode édition, ajouter un bouton pour modifier
      const editor = this.editor
      
      // Vérifier si l'éditeur est en mode édition
      // Vérifier que la vue est disponible avant d'accéder à dom (avec try-catch pour éviter les erreurs)
      let viewAvailable = false
      let editorDom: HTMLElement | null = null
      
      try {
        if (editor?.view) {
          // Accéder à dom de manière sûre
          const dom = (editor.view as any).dom
          if (dom) {
            viewAvailable = true
            editorDom = dom as HTMLElement
          }
        }
      } catch (error) {
        // L'éditeur n'est pas encore monté, on est en mode lecture seule
        viewAvailable = false
        editorDom = null
      }
      
      // Vérifier à la fois editor.isEditable et la présence de l'attribut contenteditable
      const isEditable = editor?.isEditable && 
        editorDom?.contentEditable !== 'false' &&
        !editorDom?.hasAttribute('data-readonly')
      
      // Vérifier aussi si le conteneur parent a une classe indiquant le mode lecture seule
      const parentElement = editorDom?.closest('.prose, .course-renderer, .item-container')
      const isReadOnlyMode = parentElement?.classList.contains('readonly') || 
                            !editor?.isEditable ||
                            editorDom?.contentEditable === 'false' ||
                            !viewAvailable
      
      console.log('HtmlBlock addNodeView - editor exists:', !!editor, 'isEditable:', editor?.isEditable, 'isReadOnlyMode:', isReadOnlyMode)
      
      // Créer le bouton uniquement si l'éditeur est en mode édition ET pas en mode lecture seule
      if (editor && isEditable && !isReadOnlyMode) {
        const editButton = document.createElement('button')
        editButton.className = 'html-block-edit-btn'
        editButton.textContent = '✏️ Modifier le HTML'
        editButton.type = 'button'
        editButton.setAttribute('data-html-edit-btn', 'true')
        
        // Styles inline pour forcer la visibilité - utiliser des valeurs très visibles
        editButton.style.cssText = `
          margin-top: 16px !important;
          margin-bottom: 12px !important;
          padding: 10px 20px !important;
          background-color: #2563eb !important;
          color: white !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          border: 2px solid #1d4ed8 !important;
          cursor: pointer !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: auto !important;
          min-width: 200px !important;
          max-width: 400px !important;
          z-index: 10000 !important;
          position: relative !important;
          transition: background-color 0.2s !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        `
        
        console.log('HtmlBlock - Edit button created and visible, isEditable:', isEditable)
        
        editButton.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          
          // Vérifier à nouveau si l'éditeur est éditable
          if (!editor.isEditable) {
            console.warn('Editor is not editable, cannot edit HTML block')
            return
          }
          
          console.log('HtmlBlock edit button clicked, current content:', htmlContent)
          
          // Émettre un événement personnalisé pour ouvrir la modale d'édition
          const editEvent = new CustomEvent('html-block-edit', {
            detail: {
              currentContent: htmlContent,
              position: typeof getPos === 'function' ? getPos() : null,
              updateCallback: (newHtml: string) => {
                console.log('HtmlBlock updateCallback called with:', newHtml)
                htmlContent = newHtml
                
                // Mettre à jour le nœud dans l'éditeur
                const pos = typeof getPos === 'function' ? getPos() : null
                if (pos !== null && pos !== undefined) {
                  const success = editor.chain()
                    .focus()
                    .command(({ tr, dispatch }) => {
                      const nodeAtPos = tr.doc.nodeAt(pos)
                      if (nodeAtPos && nodeAtPos.type.name === 'htmlBlock') {
                        tr.setNodeMarkup(pos, undefined, {
                          ...nodeAtPos.attrs,
                          'data-content': newHtml,
                        })
                        if (dispatch) {
                          dispatch(tr)
                        }
                        return true
                      }
                      return false
                    })
                    .run()
                  
                  if (success) {
                    console.log('HtmlBlock node updated successfully')
                    // Déclencher l'événement update de l'éditeur pour que onChange soit appelé
                    setTimeout(() => {
                      editor.view.dispatch(editor.state.tr)
                    }, 0)
                  } else {
                    console.error('Failed to update HtmlBlock node')
                  }
                }
                
                // Mettre à jour le contenu affiché
                renderHtml()
              }
            },
            bubbles: true,
            cancelable: true
          })
          
          // Émettre l'événement sur le document pour que RichTextEditor puisse l'écouter
          const dispatched = document.dispatchEvent(editEvent)
          console.log('HtmlBlock edit event dispatched:', dispatched)
        })
        
        // Ajouter le bouton après le contenu uniquement si on est en mode édition
        dom.appendChild(editButton)
        console.log('HtmlBlock - Edit button appended to DOM, parent:', dom, 'button:', editButton)
        
        // Ajouter des styles hover
        editButton.addEventListener('mouseenter', () => {
          editButton.style.backgroundColor = '#1d4ed8'
        })
        editButton.addEventListener('mouseleave', () => {
          editButton.style.backgroundColor = '#2563eb'
        })
        
        // Observer les changements d'état éditable de l'éditeur
        const updateButtonVisibility = () => {
          // Vérifier que la vue est disponible avant d'accéder à dom (avec try-catch)
          let currentViewAvailable = false
          let currentEditorDom: HTMLElement | null = null
          
          try {
            if (editor?.view) {
              const dom = (editor.view as any).dom
              if (dom) {
                currentViewAvailable = true
                currentEditorDom = dom as HTMLElement
              }
            }
          } catch (error) {
            currentViewAvailable = false
            currentEditorDom = null
          }
          
          const currentIsEditable = editor.isEditable && 
            currentEditorDom?.contentEditable !== 'false' &&
            !currentEditorDom?.hasAttribute('data-readonly')
          
          const currentParentElement = currentEditorDom?.closest('.prose, .course-renderer, .item-container')
          const currentIsReadOnlyMode = currentParentElement?.classList.contains('readonly') || 
                                        !editor?.isEditable ||
                                        currentEditorDom?.contentEditable === 'false' ||
                                        !currentViewAvailable
          
          console.log('HtmlBlock - Updating button visibility, isEditable:', currentIsEditable, 'isReadOnlyMode:', currentIsReadOnlyMode)
          
          if (currentIsEditable && !currentIsReadOnlyMode) {
            editButton.style.display = 'block'
            editButton.style.visibility = 'visible'
            editButton.style.opacity = '1'
          } else {
            editButton.style.display = 'none'
            editButton.style.visibility = 'hidden'
            editButton.style.opacity = '0'
          }
        }
        
        // Mettre à jour la visibilité quand l'éditeur change d'état
        editor.on('update', updateButtonVisibility)
        editor.on('selectionUpdate', updateButtonVisibility)
        editor.on('focus', updateButtonVisibility)
        editor.on('blur', updateButtonVisibility)
        
        // Vérifier la visibilité après un court délai
        setTimeout(updateButtonVisibility, 100)
      } else {
        console.log('HtmlBlock - Editor not editable or in read-only mode, edit button not created')
      }
      
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name === 'htmlBlock') {
            const newContent = updatedNode.attrs['data-content'] || ''
            if (newContent !== htmlContent) {
              htmlContent = newContent
              renderHtml()
            }
          }
          return true
        },
      }
    }
  },
})

