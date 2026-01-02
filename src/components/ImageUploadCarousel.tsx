import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

interface ImageUploadCarouselProps {
  onImageUploaded: (imageUrl: string) => void
  currentImageUrl?: string
  disabled?: boolean
}

export function ImageUploadCarousel({
  onImageUploaded,
  currentImageUrl,
  disabled = false
}: ImageUploadCarouselProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const extension = originalName.split('.').pop() || 'png'
    return `carousel/${timestamp}-${random}.${extension}`
  }

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const fileName = generateFileName(file.name)

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('course-assets')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Impossible de récupérer l\'URL publique')
      }

      setPreview(urlData.publicUrl)
      onImageUploaded(urlData.publicUrl)
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(err.message || 'Erreur lors de l\'upload de l\'image')
    } finally {
      setUploading(false)
    }
  }, [onImageUploaded])

  // Gestion du collage depuis le presse-papiers
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled || uploading) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        // Vérifier si c'est une image
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            handleFileUpload(file)
          }
          break
        }
      }
    }

    // Écouter les événements paste sur le document entier
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [disabled, uploading, handleFileUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleRemove = () => {
    setPreview(null)
    onImageUploaded('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${disabled || uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto max-h-64 mx-auto rounded border border-gray-200"
            />
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Supprimer l'image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 py-4">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Upload en cours...</p>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-gray-600" />
                  <ImageIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    Cliquez pour uploader ou collez une image (Ctrl+V)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Formats: JPG, PNG, GIF, WebP • Max: 5MB
                  </p>
                  <div className="flex items-center justify-center space-x-1 mt-2 text-xs text-gray-500">
                    <Clipboard className="w-3 h-3" />
                    <span>Capture d'écran supportée</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {preview && !uploading && (
        <div className="text-xs text-gray-500 text-center">
          Image uploadée avec succès
        </div>
      )}
    </div>
  )
}

