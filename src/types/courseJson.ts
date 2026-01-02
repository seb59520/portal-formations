export interface CourseJson {
  title: string
  description: string
  status: 'draft' | 'published'
  access_type: 'free' | 'paid' | 'invite'
  price_cents?: number
  currency?: string
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
  modules: Array<{
    title: string
    position: number
    theme?: {
      primaryColor?: string
      secondaryColor?: string
      fontFamily?: string
    }
    items: Array<{
      id?: string // ID de l'item (optionnel, pour les liens)
      type: 'resource' | 'slide' | 'exercise' | 'tp' | 'game'
      title: string
      position: number
      published?: boolean
      content: {
        body?: any
        description?: string
        question?: any
        correction?: any
        instructions?: any
        checklist?: string[]
        gameType?: string
        pairs?: Array<{ term: string; definition: string }>
        leftColumn?: string[]
        rightColumn?: string[]
        correctMatches?: Array<{ left: number; right: number }>
        apiTypes?: any[]
        scenarios?: any[]
        levels?: Array<{
          level: number
          name: string
          questions: Array<{
            id: string
            type: 'identify-format' | 'json-valid' | 'fix-json-mcq' | 'fix-json-editor' | 'choose-format'
            prompt: string
            snippet?: string
            options?: string[]
            answer: string | boolean
            explanation: string
            difficulty: number
          }>
        }>
        [key: string]: any
      }
      chapters?: Array<{
        title: string
        position: number
        content?: any
        type?: 'content' | 'game'
        game_content?: any
        published?: boolean
      }>
      asset_path?: string
      external_url?: string
    }>
  }>
}

