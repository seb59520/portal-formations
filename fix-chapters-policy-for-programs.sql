-- Correction de la policy RLS pour chapters afin de permettre l'accès via les programmes
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;

-- Créer la nouvelle policy qui inclut l'accès via les programmes
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

