-- ============================================================================
-- Schéma SQL pour le jeu "Format de fichiers" (JSON / XML / Protobuf)
-- ============================================================================
-- Ce script crée les tables nécessaires pour sauvegarder la progression
-- des étudiants dans le jeu format-files
-- ============================================================================

-- Table pour les tentatives de jeu
CREATE TABLE IF NOT EXISTS game_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'format-files',
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  badge TEXT CHECK (badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
  wrong_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_id ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_game_type ON game_attempts(game_type);
CREATE INDEX IF NOT EXISTS idx_game_attempts_level ON game_attempts(level);
CREATE INDEX IF NOT EXISTS idx_game_attempts_created_at ON game_attempts(created_at DESC);

-- Table pour la progression par niveau
CREATE TABLE IF NOT EXISTS game_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'format-files',
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  best_score INTEGER CHECK (best_score >= 0),
  best_badge TEXT CHECK (best_badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
  last_score INTEGER CHECK (last_score >= 0),
  last_badge TEXT CHECK (last_badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type, level)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_game_type ON game_progress(game_type);
CREATE INDEX IF NOT EXISTS idx_game_progress_level ON game_progress(level);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Sécurité des données
-- ============================================================================

-- Activer RLS sur les deux tables
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- Policies pour game_attempts
-- Les utilisateurs peuvent voir uniquement leurs propres tentatives
CREATE POLICY "Users can view their own attempts"
  ON game_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres tentatives
CREATE POLICY "Users can insert their own attempts"
  ON game_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres tentatives (optionnel)
CREATE POLICY "Users can update their own attempts"
  ON game_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour game_progress
-- Les utilisateurs peuvent voir uniquement leur propre progression
CREATE POLICY "Users can view their own progress"
  ON game_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leur propre progression
CREATE POLICY "Users can insert their own progress"
  ON game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre progression
CREATE POLICY "Users can update their own progress"
  ON game_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre progression (optionnel)
CREATE POLICY "Users can delete their own progress"
  ON game_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Fonctions utiles (optionnel)
-- ============================================================================

-- Fonction pour obtenir le meilleur score d'un utilisateur pour un niveau
CREATE OR REPLACE FUNCTION get_best_score_for_level(
  p_user_id UUID,
  p_game_type TEXT,
  p_level INTEGER
)
RETURNS TABLE (
  best_score INTEGER,
  best_badge TEXT,
  last_score INTEGER,
  last_badge TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.best_score,
    gp.best_badge,
    gp.last_score,
    gp.last_badge
  FROM game_progress gp
  WHERE gp.user_id = p_user_id
    AND gp.game_type = p_game_type
    AND gp.level = p_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Commentaires sur les tables
-- ============================================================================

COMMENT ON TABLE game_attempts IS 'Historique de toutes les tentatives de jeu des utilisateurs';
COMMENT ON TABLE game_progress IS 'Progression par niveau : meilleur score et dernier score pour chaque utilisateur';

COMMENT ON COLUMN game_attempts.wrong_ids IS 'Liste des IDs des questions ratées dans cette tentative';
COMMENT ON COLUMN game_progress.best_score IS 'Meilleur score obtenu pour ce niveau';
COMMENT ON COLUMN game_progress.last_score IS 'Dernier score obtenu pour ce niveau';

