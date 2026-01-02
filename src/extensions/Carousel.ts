import { Node, mergeAttributes } from '@tiptap/core'

export interface CarouselOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    carousel: {
      /**
       * Insert a carousel
       */
      setCarousel: (options: { 
        items: Array<{
          type: 'text' | 'image' | 'video' | 'content'
          content: string
          title?: string
          imageUrl?: string
          videoUrl?: string
        }>
      }) => ReturnType
    }
  }
}

export const Carousel = Node.create<CarouselOptions>({
  name: 'carousel',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  atom: false,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: element => {
          const itemsJson = element.getAttribute('data-items')
          if (!itemsJson) return []
          try {
            return JSON.parse(itemsJson)
          } catch {
            return []
          }
        },
        renderHTML: attributes => {
          if (!attributes.items || !Array.isArray(attributes.items) || attributes.items.length === 0) {
            return {}
          }
          return {
            'data-items': JSON.stringify(attributes.items),
          }
        },
      },
      size: {
        default: 2, // Taille par défaut : 2 (moyenne)
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

  parseHTML() {
    return [
      {
        tag: 'div[data-carousel]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const div = node as HTMLElement
          const itemsJson = div.getAttribute('data-items')
          const sizeAttr = div.getAttribute('data-size')
          let items = []
          if (itemsJson) {
            try {
              items = JSON.parse(itemsJson)
            } catch {
              items = []
            }
          }
          const size = sizeAttr ? parseInt(sizeAttr) : 2
          return {
            items,
            size,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const items = HTMLAttributes.items || []
    const size = HTMLAttributes.size || 2
    
    return [
      'div',
      mergeAttributes(
        {
          'data-carousel': 'true',
          'data-size': size.toString(),
          class: `tiptap-carousel widget-size-${size}`,
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'div',
        { class: 'carousel-container' },
        [
          'div',
          { class: 'carousel-track' },
          ...items.map((item: any, index: number) => [
            'div',
            { 
              class: 'carousel-item',
              'data-index': index.toString(),
            },
            item.type === 'image' && item.imageUrl
              ? ['img', { src: item.imageUrl, alt: item.title || `Image ${index + 1}` }]
              : item.type === 'video' && item.videoUrl
              ? ['iframe', { src: item.videoUrl, frameborder: '0', allowfullscreen: 'true' }]
              : [
                  'div',
                  { class: 'carousel-item-content' },
                  item.title ? ['h3', {}, item.title] : null,
                  ['div', { class: 'carousel-item-body' }, item.content || ''],
                ],
          ]),
        ],
        [
          'button',
          { 
            class: 'carousel-button carousel-button-prev',
            'aria-label': 'Précédent',
          },
          '‹',
        ],
        [
          'button',
          { 
            class: 'carousel-button carousel-button-next',
            'aria-label': 'Suivant',
          },
          '›',
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setCarousel:
        (options: { 
          items: Array<{
            type: 'text' | 'image' | 'video' | 'content'
            content: string
            title?: string
            imageUrl?: string
            videoUrl?: string
          }>
          size?: number
        }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              size: options.size || 2,
            },
          })
        },
    }
  },

  addNodeView() {
    return ({ node, editor }) => {
      const container = document.createElement('div')
      const size = node.attrs.size || 2
      container.className = `tiptap-carousel widget-size-${size}`
      container.setAttribute('data-carousel', 'true')
      container.setAttribute('data-size', size.toString())
      
      // Ajouter un indicateur visuel en mode édition
      if (editor.isEditable) {
        container.classList.add('carousel-editable')
        container.style.cursor = 'pointer'
        container.title = 'Cliquez pour éditer le carrousel ou changer la taille'
      }

      const items = node.attrs.items || []
      const itemsJson = JSON.stringify(items)
      container.setAttribute('data-items', itemsJson)

      const carouselContainer = document.createElement('div')
      carouselContainer.className = 'carousel-container'

      const track = document.createElement('div')
      track.className = 'carousel-track'

      items.forEach((item: any, index: number) => {
        const itemDiv = document.createElement('div')
        itemDiv.className = 'carousel-item'
        itemDiv.setAttribute('data-index', index.toString())

        if (item.type === 'image' && item.imageUrl) {
          const img = document.createElement('img')
          img.src = item.imageUrl
          img.alt = item.title || `Image ${index + 1}`
          itemDiv.appendChild(img)
        } else if (item.type === 'video' && item.videoUrl) {
          const iframe = document.createElement('iframe')
          iframe.src = item.videoUrl
          iframe.frameBorder = '0'
          iframe.allowFullscreen = true
          itemDiv.appendChild(iframe)
        } else {
          const contentDiv = document.createElement('div')
          contentDiv.className = 'carousel-item-content'
          if (item.title) {
            const title = document.createElement('h3')
            title.textContent = item.title
            contentDiv.appendChild(title)
          }
          const body = document.createElement('div')
          body.className = 'carousel-item-body'
          body.innerHTML = item.content || ''
          contentDiv.appendChild(body)
          itemDiv.appendChild(contentDiv)
        }

        track.appendChild(itemDiv)
      })

      const prevButton = document.createElement('button')
      prevButton.className = 'carousel-button carousel-button-prev'
      prevButton.setAttribute('aria-label', 'Précédent')
      prevButton.textContent = '‹'
      prevButton.onclick = () => {
        const currentIndex = parseInt(track.getAttribute('data-current') || '0')
        const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        track.setAttribute('data-current', newIndex.toString())
        track.style.transform = `translateX(-${newIndex * 100}%)`
      }

      const nextButton = document.createElement('button')
      nextButton.className = 'carousel-button carousel-button-next'
      nextButton.setAttribute('aria-label', 'Suivant')
      nextButton.textContent = '›'
      nextButton.onclick = () => {
        const currentIndex = parseInt(track.getAttribute('data-current') || '0')
        const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        track.setAttribute('data-current', newIndex.toString())
        track.style.transform = `translateX(-${newIndex * 100}%)`
      }

      track.setAttribute('data-current', '0')
      track.style.transform = 'translateX(0%)'

      carouselContainer.appendChild(track)
      carouselContainer.appendChild(prevButton)
      carouselContainer.appendChild(nextButton)
      container.appendChild(carouselContainer)

      return {
        dom: container,
      }
    }
  },
})

