-- Script de diagnostic et correction pour les erreurs de chargement des chapitres
-- À exécuter dans l'interface SQL de Supabase
-- Ce script vérifie et corrige les problèmes de permissions RLS

-- 1. Créer les fonctions nécessaires (si elles n'existent pas déjà)
-- Note: On ne peut pas utiliser CREATE FUNCTION dans un bloc DO avec $$, donc on les crée directement

-- Fonction user_has_course_access
CREATE OR REPLACE FUNCTION public.user_has_course_access(course_id_param UUID)
RETURNS BOOLEAN AS $func1$
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
$func1$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction get_course_id_from_item
CREATE OR REPLACE FUNCTION public.get_course_id_from_item(item_id_param UUID)
RETURNS UUID AS $func2$
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
$func2$ LANGUAGE plpgsql STABLE;

-- 2. Vérifier que la table chapters existe et activer RLS si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'chapters'
  ) THEN
    RAISE EXCEPTION 'La table chapters n''existe pas!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'chapters'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE '⚠️ RLS n''est pas activé sur chapters. Activation...';
    ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur chapters';
  ELSE
    RAISE NOTICE '✅ RLS est déjà activé sur chapters';
  END IF;
END $$;

-- 3. Supprimer et recréer la policy SELECT optimisée
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_item(chapters.item_id)
    )
  );

-- 4. Supprimer et recréer la policy INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins and instructors can manage chapters" ON chapters;

CREATE POLICY "Admins and instructors can manage chapters" ON chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = chapters.item_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

-- 5. Vérifier et créer les index nécessaires
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON chapters(item_id);
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status_access ON courses(status, access_type);

-- 6. Afficher un résumé
SELECT 
  'Résumé de la configuration RLS pour chapters' as info,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'chapters') as policies_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'chapters') as indexes_count,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('user_has_course_access', 'get_course_id_from_item') AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as functions_count;

-- 7. Lister les policies existantes
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%user_has_course_access%' THEN '✅ Utilise les fonctions optimisées'
    ELSE '⚠️ N''utilise pas les fonctions optimisées'
  END as status
FROM pg_policies
WHERE tablename = 'chapters';

