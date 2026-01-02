-- Policy RLS optimisée pour chapters avec accès via programmes
-- Cette version optimise les performances en vérifiant d'abord les conditions simples
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

-- Créer la nouvelle policy optimisée
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    -- Vérification rapide : Admin a toujours accès
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Vérifier l'accès via le cours parent
    EXISTS (
      SELECT 1 
      FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE i.id = chapters.item_id
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
        -- Accès via un programme (vérifié en dernier car plus coûteux)
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

-- Créer des index pour améliorer les performances de la policy
-- (si les index n'existent pas déjà)
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON chapters(item_id);
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status_access ON courses(status, access_type);

-- Vérifier que la policy est bien créée
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';

