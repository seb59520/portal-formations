import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur dans le composant de jeu:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">❌ Erreur lors du rendu du jeu</p>
          <p className="text-red-700 text-sm mb-2">
            Une erreur s'est produite lors du rendu du jeu.
          </p>
          <details className="mt-3">
            <summary className="text-sm text-red-700 cursor-pointer">Détails de l'erreur</summary>
            <pre className="text-xs bg-red-100 p-3 rounded overflow-auto mt-2">
              {this.state.error?.message || 'Erreur inconnue'}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

