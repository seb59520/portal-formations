-- Script d'optimisation complet pour toutes les policies RLS (modules, items, chapters)
-- Le problème : timeouts causés par trop de jointures imbriquées dans les policies
-- Solution : utiliser des fonctions SQL réutilisables pour optimiser les vérifications
-- À exécuter dans l'interface SQL de Supabase

-- ============================================
-- 1. S'assurer que les fonctions de base existent
-- ============================================

-- Fonction user_has_course_access (réutilisée pour tous)
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

-- Fonction get_course_id_from_item (pour chapters)
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

-- Fonction get_course_id_from_module (pour items et modules)
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

-- ============================================
-- 2. Optimiser la policy pour MODULES
-- ============================================
DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;

CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_module(modules.course_id)
    )
  );

-- ============================================
-- 3. Optimiser la policy pour ITEMS
-- ============================================
DROP POLICY IF EXISTS "Items viewable with course access" ON items;

CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_module(items.module_id)
    )
  );

-- ============================================
-- 4. Optimiser la policy pour CHAPTERS
-- ============================================
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    -- Utiliser la fonction pour vérifier l'accès (beaucoup plus rapide)
    public.user_has_course_access(
      public.get_course_id_from_item(chapters.item_id)
    )
  );

-- ============================================
-- 5. Créer/améliorer tous les index nécessaires
-- ============================================

-- Index pour modules
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

-- Index pour items
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_items_module_published ON items(module_id, published) 
  WHERE published = true;

-- Index pour chapters
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON chapters(item_id);

-- Index pour courses
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status_access ON courses(status, access_type);

-- Index pour enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);

-- Index pour programmes
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_program_course ON program_courses(program_id, course_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_program_status ON program_enrollments(user_id, program_id, status);

-- ============================================
-- 6. Vérification et résumé
-- ============================================

-- Vérifier que toutes les policies sont bien créées
SELECT 
  'Résumé des policies optimisées' as info,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'modules') as modules_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'items') as items_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'chapters') as chapters_policies,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('user_has_course_access', 'get_course_id_from_item', 'get_course_id_from_module') 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as functions_count;

-- Lister les policies et vérifier qu'elles utilisent les fonctions optimisées
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%user_has_course_access%' THEN '✅ Utilise les fonctions optimisées'
    ELSE '⚠️ N''utilise pas les fonctions optimisées'
  END as status
FROM pg_policies
WHERE tablename IN ('modules', 'items', 'chapters')
ORDER BY tablename, policyname;

