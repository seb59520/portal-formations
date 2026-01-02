-- Correction de la policy RLS pour program_courses
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer l'ancienne policy incorrecte
DROP POLICY IF EXISTS "Program courses viewable with program access" ON program_courses;

-- Créer la nouvelle policy correcte
CREATE POLICY "Program courses viewable with program access" ON program_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_courses.program_id
      AND (
        -- Admin : toujours accès (même aux programmes non publiés)
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        -- Créateur du programme : toujours accès
        OR p.created_by = auth.uid()
        -- Programme publié et gratuit : accessible à tous
        OR (p.status = 'published' AND p.access_type = 'free')
        -- Utilisateur inscrit au programme : accès
        OR EXISTS (
          SELECT 1 FROM program_enrollments pe
          WHERE pe.program_id = p.id
            AND pe.user_id = auth.uid()
            AND pe.status = 'active'
        )
      )
    )
  );

