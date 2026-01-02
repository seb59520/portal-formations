-- Correction complète des policies RLS pour permettre l'accès via les programmes
-- À exécuter dans l'interface SQL de Supabase
-- Ce script met à jour : modules, items, et chapters

-- ============================================
-- 1. MODULES : Ajouter l'accès via programmes
-- ============================================
DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;

CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
      AND (
        -- Admin : toujours accès
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        -- Créateur de la formation : toujours accès
        OR c.created_by = auth.uid()
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
    )
  );

-- ============================================
-- 2. ITEMS : Ajouter l'accès via programmes
-- ============================================
DROP POLICY IF EXISTS "Items viewable with course access" ON items;

CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = items.module_id
      AND (
        -- Admin : toujours accès
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        -- Créateur de la formation : toujours accès
        OR c.created_by = auth.uid()
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
    )
  );

-- ============================================
-- 3. CHAPTERS : Ajouter l'accès via programmes
-- ============================================
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE i.id = chapters.item_id
      AND (
        -- Admin : toujours accès
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        -- Créateur de la formation : toujours accès
        OR c.created_by = auth.uid()
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
    )
  );

