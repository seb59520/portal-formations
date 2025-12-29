-- Table pour les paramètres utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pdf_zoom REAL DEFAULT 1.0 CHECK (pdf_zoom >= 0.5 AND pdf_zoom <= 2.0),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('small', 'normal', 'large')),
  layout_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les admins peuvent voir tous les paramètres
CREATE POLICY "Admins can view all settings" ON user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

