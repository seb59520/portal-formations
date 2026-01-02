-- Optimisation de la policy RLS pour items (similaire à chapters)
-- Le problème : timeout causé par trop de jointures imbriquées
-- Solution : utiliser la fonction SQL user_has_course_access déjà créée
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer une fonction pour obtenir le course_id d'un module (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION public.get_course_id_from_module(module_id_param UUID)
RETURNS UUID AS $func3$
BEGIN
  RETURN (
    SELECT c.id
    FROM modules m
    JOIN courses c ON m.course_id = c.id
    WHERE m.id = module_id_param
    LIMIT 1
  );
END;
$func3$ LANGUAGE plpgsql STABLE;

-- 2. Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Items viewable with course access" ON items;

-- 3. Créer la nouvelle policy optimisée utilisant les fonctions
CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_module(items.module_id)
    )
  );

-- 4. Créer/améliorer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status_access ON courses(status, access_type);

-- 5. Index composite pour optimiser la jointure items -> modules -> courses
CREATE INDEX IF NOT EXISTS idx_items_module_published ON items(module_id, published) 
  WHERE published = true;

-- 6. Vérifier que la policy est bien créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'items' AND policyname = 'Items viewable with course access';

-- 7. Analyser les performances (optionnel - à exécuter après quelques requêtes)
-- ANALYZE items;
-- ANALYZE modules;
-- ANALYZE courses;

