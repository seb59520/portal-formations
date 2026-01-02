-- Correction de la policy RLS pour courses afin de permettre l'accès via les programmes
-- À exécuter dans l'interface SQL de Supabase

-- Vérifier les policies existantes
-- SELECT * FROM pg_policies WHERE tablename = 'courses';

-- Supprimer l'ancienne policy si elle existe déjà
DROP POLICY IF EXISTS "Courses accessible via program enrollment" ON courses;

-- Ajouter une policy pour permettre l'accès aux formations via un programme
-- Cette policy sera en plus des policies existantes (OR avec les autres policies)
CREATE POLICY "Courses accessible via program enrollment" ON courses
  FOR SELECT USING (
    -- Si l'utilisateur est inscrit à un programme contenant cette formation
    EXISTS (
      SELECT 1
      FROM program_courses pc
      JOIN program_enrollments pe ON pc.program_id = pe.program_id
      WHERE pc.course_id = courses.id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
    )
    -- Ou si l'utilisateur est admin (pour voir toutes les formations)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    -- Ou si l'utilisateur est le créateur de la formation
    OR courses.created_by = auth.uid()
    -- Ou si la formation est gratuite et publiée (déjà géré par la policy existante, mais on le met quand même)
    OR (courses.status = 'published' AND courses.access_type = 'free')
    -- Ou si l'utilisateur a un enrollment direct
    OR EXISTS (
      SELECT 1 FROM enrollments
      WHERE course_id = courses.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

