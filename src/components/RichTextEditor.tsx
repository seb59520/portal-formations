import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { YouTube } from '../extensions/YouTube'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Youtube } from 'lucide-react'

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Désactiver Link dans StarterKit car on l'ajoute séparément avec configuration
        link: false,
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
      Image.configure({
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
      YouTube.configure({
        HTMLAttributes: {
          class: 'youtube-video',
        },
        width: 640,
        height: 360,
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

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
            onClick={() => {
              const url = window.prompt('Entrez l\'URL de la vidéo YouTube (ex: https://www.youtube.com/watch?v=VIDEO_ID ou juste VIDEO_ID):')
              if (url) {
                editor.chain().focus().setYouTube({ src: url }).run()
              }
            }}
            className="p-2 rounded hover:bg-gray-100"
            title="Ajouter une vidéo YouTube"
          >
            <Youtube className="w-4 h-4 text-red-600" />
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
      <EditorContent editor={editor} className="min-h-[200px] max-h-[600px] overflow-y-auto" />
    </div>
  )
}

