import { Node, mergeAttributes } from '@tiptap/core'

export interface YouTubeOptions {
  HTMLAttributes: Record<string, any>
  width: number
  height: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYouTube: (options: { src: string; size?: number }) => ReturnType
      updateYouTubeSize: (options: { size: number }) => ReturnType
    }
  }
}

export const YouTube = Node.create<YouTubeOptions>({
  name: 'youtube',

  addOptions() {
    return {
      HTMLAttributes: {},
      width: 640,
      height: 480,
    }
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
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
        tag: 'div[data-youtube-video]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const div = node as HTMLElement
          const iframe = div.querySelector('iframe')
          return {
            src: iframe?.getAttribute('src') || '',
            width: iframe?.getAttribute('width') || this.options.width,
            height: iframe?.getAttribute('height') || this.options.height,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = extractVideoId(HTMLAttributes.src)
    if (!videoId) {
      return ['div', { 'data-youtube-video': 'true', class: 'youtube-video-error' }, 'URL YouTube invalide']
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    const width = HTMLAttributes.width || this.options.width
    const height = HTMLAttributes.height || this.options.height

    const size = HTMLAttributes.size || 2
    return [
      'div',
      { 
        'data-youtube-video': 'true', 
        'data-size': size.toString(),
        class: `youtube-video-container widget-size-${size}` 
      },
      [
        'iframe',
        mergeAttributes(
          {
            src: embedUrl,
            width: width.toString(),
            height: height.toString(),
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
          },
          this.options.HTMLAttributes
        ),
      ],
    ]
  },

  addCommands() {
    return {
      setYouTube:
        (options: { src: string; size?: number }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              size: options.size || 2,
            },
          })
        },
      updateYouTubeSize:
        (options: { size: number }) =>
        ({ chain, state }) => {
          const { selection } = state
          const node = state.doc.nodeAt(selection.anchor - 1)
          if (node && node.type.name === this.name) {
            return chain()
              .focus()
              .updateAttributes(this.name, { size: options.size })
              .run()
          }
          return false
        },
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const videoId = extractVideoId(node.attrs.src)
      if (!videoId) {
        return document.createElement('div')
      }

      const embedUrl = `https://www.youtube.com/embed/${videoId}`
      const container = document.createElement('div')
      const size = node.attrs.size || 2
      container.className = `youtube-video-container widget-size-${size}`
      container.setAttribute('data-youtube-video', 'true')
      container.setAttribute('data-size', size.toString())

      const iframe = document.createElement('iframe')
      iframe.src = embedUrl
      iframe.width = (node.attrs.width || this.options.width).toString()
      iframe.height = (node.attrs.height || this.options.height).toString()
      iframe.frameBorder = '0'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      iframe.allowFullscreen = true

      container.appendChild(iframe)
      return {
        dom: container,
      }
    }
  },
})

// Fonction utilitaire pour extraire l'ID de la vidéo depuis différentes URLs YouTube
function extractVideoId(url: string): string | null {
  if (!url) return null

  // Formats supportés :
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // VIDEO_ID (juste l'ID)

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

