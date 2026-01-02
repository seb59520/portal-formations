-- Optimisation de la policy RLS pour modules pour améliorer les performances
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;

-- Créer une policy optimisée qui vérifie d'abord les conditions simples
CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    -- Vérifier d'abord les conditions simples (plus rapides)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    -- Ou vérifier l'accès via le cours (conditions plus complexes en dernier)
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
      AND (
        -- Créateur : vérification directe (rapide)
        c.created_by = auth.uid()
        -- Formation gratuite et publiée : vérification directe (rapide)
        OR (c.status = 'published' AND c.access_type = 'free')
        -- Enrollment direct : une seule jointure (moyennement rapide)
        OR EXISTS (
          SELECT 1 FROM enrollments e
          WHERE e.course_id = c.id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
        -- Accès via programme : jointures multiples (plus lent, vérifié en dernier)
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

-- Créer un index pour améliorer les performances de la policy
-- (si l'index n'existe pas déjà)
CREATE INDEX IF NOT EXISTS idx_modules_course_id_access ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status ON enrollments(user_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_status ON program_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);

