-- Fix de performance pour la policy RLS des chapters
-- Le problème : timeout (57014) causé par trop de jointures imbriquées
-- Solution : utiliser une fonction SQL pour optimiser les vérifications
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer une fonction pour vérifier l'accès à un cours (réutilisable)
CREATE OR REPLACE FUNCTION public.user_has_course_access(course_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérification rapide : Admin a toujours accès
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Vérifier l'accès au cours
  RETURN EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_id_param
    AND (
      -- Créateur de la formation : toujours accès
      c.created_by = auth.uid()
      -- Formation gratuite et publiée : accessible à tous
      OR (c.status = 'published' AND c.access_type = 'free')
      -- Enrollment direct à la formation
      OR EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = c.id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
      )
      -- Accès via un programme
      OR EXISTS (
        SELECT 1
        FROM program_courses pc
        JOIN program_enrollments pe ON pc.program_id = pe.program_id
        WHERE pc.course_id = c.id
          AND pe.user_id = auth.uid()
          AND pe.status = 'active'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Créer une fonction pour obtenir le course_id d'un item
CREATE OR REPLACE FUNCTION public.get_course_id_from_item(item_id_param UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT c.id
    FROM items i
    JOIN modules m ON i.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE i.id = item_id_param
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

-- 4. Créer la nouvelle policy optimisée utilisant les fonctions
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_item(chapters.item_id)
    )
  );

-- 5. Créer/améliorer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON chapters(item_id);
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status_access ON courses(status, access_type);

-- 6. Index composite pour optimiser la jointure items -> modules -> courses
CREATE INDEX IF NOT EXISTS idx_items_module_course ON items(module_id) 
  INCLUDE (id); -- Include id pour éviter un lookup supplémentaire

-- 7. Index composite pour optimiser program_courses -> program_enrollments
CREATE INDEX IF NOT EXISTS idx_program_courses_program_course ON program_courses(program_id, course_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_program_status ON program_enrollments(user_id, program_id, status);

-- 8. Vérifier que la policy est bien créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';

-- 9. Analyser les performances (optionnel - à exécuter après quelques requêtes)
-- ANALYZE chapters;
-- ANALYZE items;
-- ANALYZE modules;
-- ANALYZE courses;
-- ANALYZE enrollments;
-- ANALYZE program_courses;
-- ANALYZE program_enrollments;

