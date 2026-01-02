-- Ajout du support des jeux entre les chapitres
-- À exécuter dans l'interface SQL de Supabase
-- IMPORTANT : Copiez-collez uniquement le contenu de ce fichier dans l'éditeur SQL de Supabase

DO $$ 
BEGIN
  -- Ajouter la colonne type à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'type'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN type TEXT DEFAULT 'content' CHECK (type IN ('content', 'game'));
  END IF;

  -- Ajouter la colonne game_content à la table chapters (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'game_content'
  ) THEN
    ALTER TABLE chapters 
    ADD COLUMN game_content JSONB;
  END IF;

  -- Mettre à jour les chapitres existants pour avoir le type 'content' par défaut
  UPDATE chapters 
  SET type = 'content' 
  WHERE type IS NULL;

END $$;

-- Index pour optimiser les requêtes par type
CREATE INDEX IF NOT EXISTS idx_chapters_type ON chapters(item_id, type);

-- Commentaires pour la documentation
COMMENT ON COLUMN chapters.type IS 'Type de chapitre : content (contenu normal) ou game (jeu interactif)';
COMMENT ON COLUMN chapters.game_content IS 'Contenu du jeu si type = game. Structure dépend du gameType (matching, column-matching, api-types, format-files)';

