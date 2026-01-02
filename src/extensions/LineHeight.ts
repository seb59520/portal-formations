import { Extension } from '@tiptap/core'

export interface LineHeightOptions {
  types: string[]
  defaultLineHeight: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      /**
       * Set the line height
       */
      setLineHeight: (lineHeight: string) => ReturnType
      /**
       * Unset the line height
       */
      unsetLineHeight: () => ReturnType
    }
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '1.5',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {}
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ chain }) => {
        // Essayer d'appliquer à chaque type supporté jusqu'à ce qu'un fonctionne
        for (const type of this.options.types) {
          const result = chain().focus().updateAttributes(type, { lineHeight }).run()
          if (result) return result
        }
        return false
      },
      unsetLineHeight: () => ({ chain }) => {
        // Essayer de réinitialiser pour chaque type supporté jusqu'à ce qu'un fonctionne
        for (const type of this.options.types) {
          const result = chain().focus().resetAttributes(type, ['lineHeight']).run()
          if (result) return result
        }
        return false
      },
    }
  },
})

