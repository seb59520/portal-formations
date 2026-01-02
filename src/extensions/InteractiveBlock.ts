import { Node, mergeAttributes } from '@tiptap/core'

export interface InteractiveBlockOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    interactiveBlock: {
      /**
       * Insert an interactive block (mini-game or TP)
       */
      setInteractiveBlock: (options: { 
        type: 'game' | 'tp'
        itemId: string
        title?: string
      }) => ReturnType
    }
  }
}

export const InteractiveBlock = Node.create<InteractiveBlockOptions>({
  name: 'interactiveBlock',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      type: {
        default: 'game',
        parseHTML: element => element.getAttribute('data-type') || 'game',
        renderHTML: attributes => {
          if (!attributes.type) {
            return {}
          }
          return {
            'data-type': attributes.type,
          }
        },
      },
      itemId: {
        default: null,
        parseHTML: element => element.getAttribute('data-item-id'),
        renderHTML: attributes => {
          if (!attributes.itemId) {
            return {}
          }
          return {
            'data-item-id': attributes.itemId,
          }
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {}
          }
          return {
            'data-title': attributes.title,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-interactive-block]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const div = node as HTMLElement
          return {
            type: div.getAttribute('data-type') || 'game',
            itemId: div.getAttribute('data-item-id'),
            title: div.getAttribute('data-title'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-interactive-block': 'true',
          class: 'interactive-block-placeholder',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'div',
        { class: 'interactive-block-content' },
        [
          'span',
          { class: 'interactive-block-icon' },
          HTMLAttributes.type === 'tp' ? '📝' : '🎮',
        ],
        [
          'span',
          { class: 'interactive-block-text' },
          HTMLAttributes.title || (HTMLAttributes.type === 'tp' ? 'Travaux Pratiques' : 'Mini-jeu'),
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setInteractiveBlock:
        (options: { type: 'game' | 'tp'; itemId: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addNodeView() {
    return ({ node }) => {
      const container = document.createElement('div')
      container.className = 'interactive-block-placeholder'
      container.setAttribute('data-interactive-block', 'true')
      container.setAttribute('data-type', node.attrs.type)
      container.setAttribute('data-item-id', node.attrs.itemId)
      if (node.attrs.title) {
        container.setAttribute('data-title', node.attrs.title)
      }

      const content = document.createElement('div')
      content.className = 'interactive-block-content'

      const icon = document.createElement('span')
      icon.className = 'interactive-block-icon'
      icon.textContent = node.attrs.type === 'tp' ? '📝' : '🎮'

      const text = document.createElement('span')
      text.className = 'interactive-block-text'
      text.textContent = node.attrs.title || (node.attrs.type === 'tp' ? 'Travaux Pratiques' : 'Mini-jeu')

      // Ajouter un style pour indiquer que c'est cliquable
      container.style.cursor = 'pointer'
      container.title = `Cliquez pour ouvrir le ${node.attrs.type === 'tp' ? 'TP' : 'mini-jeu'}`

      content.appendChild(icon)
      content.appendChild(text)
      container.appendChild(content)

      return {
        dom: container,
      }
    }
  },
})

