import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'
import { UserSettings } from '../types/database'

export function useUserSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchSettings()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  const fetchSettings = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
        return
      }

      if (data) {
        setSettings(data)
      } else {
        // Créer des paramètres par défaut
        const defaultSettings = {
          user_id: user.id,
          pdf_zoom: 1.0,
          theme: 'light' as const,
          font_size: 'normal' as const,
          layout_preferences: {}
        }

        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (insertError) {
          console.error('Error creating settings:', insertError)
        } else {
          setSettings(newSettings)
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id || !settings) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      return data
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  const updatePdfZoom = async (zoom: number) => {
    return updateSettings({ pdf_zoom: Math.max(0.5, Math.min(2.0, zoom)) })
  }

  const updateTheme = async (theme: 'light' | 'dark') => {
    return updateSettings({ theme })
  }

  const updateFontSize = async (fontSize: 'small' | 'normal' | 'large') => {
    return updateSettings({ font_size: fontSize })
  }

  const updateLayoutPreferences = async (preferences: Record<string, any>) => {
    return updateSettings({ 
      layout_preferences: { ...settings?.layout_preferences, ...preferences }
    })
  }

  return {
    settings,
    loading,
    updateSettings,
    updatePdfZoom,
    updateTheme,
    updateFontSize,
    updateLayoutPreferences,
    refetch: fetchSettings
  }
}

