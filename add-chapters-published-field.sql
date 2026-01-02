-- Ajout du champ published aux chapitres pour pouvoir les activer/désactiver
-- À exécuter dans l'interface SQL de Supabase

-- 1. Ajouter la colonne published (par défaut true pour les chapitres existants)
ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

-- 2. Créer un index pour optimiser les requêtes filtrées par published
CREATE INDEX IF NOT EXISTS idx_chapters_item_id_published ON chapters(item_id, published) 
  WHERE published = true;

-- 3. Commentaire pour documenter la colonne
COMMENT ON COLUMN chapters.published IS 'Indique si le chapitre est publié et visible dans le mode cours. Les chapitres non publiés restent visibles en mode admin.';

