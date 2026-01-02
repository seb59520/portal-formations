-- Script pour corriger la contrainte CHECK sur la colonne type de chapters
-- À exécuter dans l'interface SQL de Supabase

DO $$ 
BEGIN
  -- 1. S'assurer que la colonne type existe et a les bonnes propriétés
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chapters' AND column_name = 'type'
  ) THEN
    -- Mettre à jour les valeurs NULL ou invalides
    UPDATE chapters 
    SET type = 'content' 
    WHERE type IS NULL OR (type NOT IN ('content', 'game'));
    
    -- Modifier la colonne pour être NOT NULL avec DEFAULT
    ALTER TABLE chapters 
    ALTER COLUMN type SET DEFAULT 'content',
    ALTER COLUMN type SET NOT NULL;
    
    -- Supprimer l'ancienne contrainte si elle existe
    ALTER TABLE chapters DROP CONSTRAINT IF EXISTS chapters_type_check;
    
    -- Recréer la contrainte CHECK
    ALTER TABLE chapters 
    ADD CONSTRAINT chapters_type_check 
    CHECK (type IN ('content', 'game'));
    
    RAISE NOTICE 'Contrainte chapters_type_check corrigée avec succès';
  ELSE
    -- Si la colonne n'existe pas, la créer
    ALTER TABLE chapters 
    ADD COLUMN type TEXT NOT NULL DEFAULT 'content' 
    CHECK (type IN ('content', 'game'));
    
    -- Mettre à jour les chapitres existants
    UPDATE chapters 
    SET type = 'content' 
    WHERE type IS NULL;
    
    RAISE NOTICE 'Colonne type créée avec la contrainte CHECK';
  END IF;
END $$;

-- Vérifier que tout est correct
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  (SELECT constraint_name 
   FROM information_schema.constraint_column_usage 
   WHERE table_name = 'chapters' 
   AND column_name = 'type' 
   LIMIT 1) as constraint_name
FROM information_schema.columns 
WHERE table_name = 'chapters' 
AND column_name = 'type';

