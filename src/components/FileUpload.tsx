import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  disabled?: boolean
  maxSize?: number // en MB
}

export function FileUpload({
  onFileSelect,
  accept = '*',
  disabled = false,
  maxSize = 10
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError('')

    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Le fichier ne doit pas dépasser ${maxSize}MB`)
      return false
    }

    // Vérifier le type si spécifié
    if (accept !== '*' && accept.split(',').some(type => {
      const cleanType = type.trim()
      if (cleanType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(cleanType.toLowerCase())
      }
      return file.type.includes(cleanType.replace('*', ''))
    }) === false) {
      setError(`Type de fichier non accepté. Formats autorisés: ${accept}`)
      return false
    }

    return true
  }

  const handleFileSelect = (file: File | null) => {
    if (file && validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    } else if (!file) {
      setSelectedFile(null)
      onFileSelect(null)
      setError('')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    onFileSelect(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-gray-600'}`} />
          <div className="text-sm">
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-900 font-medium">{selectedFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <p className={`${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                  Glissez-déposez un fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Taille max: {maxSize}MB • Formats: {accept}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {selectedFile && (
        <div className="text-xs text-gray-500">
          Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
        </div>
      )}
    </div>
  )
}
