-- Triggers pour hériter automatiquement des droits aux formations via les programmes
-- À exécuter dans l'interface SQL de Supabase après add-programs-schema.sql

-- Fonction pour créer automatiquement les enrollments aux formations
-- quand un utilisateur est inscrit à un programme
CREATE OR REPLACE FUNCTION inherit_course_access_from_program()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
BEGIN
  -- Si l'inscription au programme est active, créer les enrollments aux formations
  IF NEW.status = 'active' THEN
    -- Parcourir toutes les formations du programme
    FOR course_record IN
      SELECT course_id
      FROM program_courses
      WHERE program_id = NEW.program_id
    LOOP
      -- Vérifier si l'enrollment existe déjà
      IF NOT EXISTS (
        SELECT 1
        FROM enrollments
        WHERE user_id = NEW.user_id
          AND course_id = course_record.course_id
      ) THEN
        -- Créer l'enrollment avec le même statut et source
        INSERT INTO enrollments (
          user_id,
          course_id,
          status,
          source,
          enrolled_at
        )
        VALUES (
          NEW.user_id,
          course_record.course_id,
          NEW.status,
          'manual', -- Source manuelle car héritée du programme
          NEW.enrolled_at
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : créer les enrollments quand on inscrit quelqu'un à un programme
CREATE TRIGGER on_program_enrollment_created
  AFTER INSERT ON program_enrollments
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION inherit_course_access_from_program();

-- Fonction pour mettre à jour les enrollments quand le statut du programme change
CREATE OR REPLACE FUNCTION update_course_access_from_program()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
BEGIN
  -- Si le statut passe à 'active', créer les enrollments manquants
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    FOR course_record IN
      SELECT course_id
      FROM program_courses
      WHERE program_id = NEW.program_id
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM enrollments
        WHERE user_id = NEW.user_id
          AND course_id = course_record.course_id
      ) THEN
        INSERT INTO enrollments (
          user_id,
          course_id,
          status,
          source,
          enrolled_at
        )
        VALUES (
          NEW.user_id,
          course_record.course_id,
          'active',
          'manual',
          NEW.enrolled_at
        )
        ON CONFLICT (user_id, course_id) DO NOTHING;
      ELSE
        -- Mettre à jour le statut si l'enrollment existe déjà
        UPDATE enrollments
        SET status = 'active'
        WHERE user_id = NEW.user_id
          AND course_id = course_record.course_id
          AND status != 'active';
      END IF;
    END LOOP;
  END IF;

  -- Si le statut passe à 'revoked' ou 'pending', révoquer les enrollments
  IF NEW.status IN ('revoked', 'pending') AND OLD.status = 'active' THEN
    FOR course_record IN
      SELECT course_id
      FROM program_courses
      WHERE program_id = NEW.program_id
    LOOP
      -- Révoquer l'enrollment seulement s'il vient du programme
      -- On vérifie que l'enrollment a été créé après l'inscription au programme
      UPDATE enrollments
      SET status = 'revoked'
      WHERE user_id = NEW.user_id
        AND course_id = course_record.course_id
        AND status = 'active'
        AND source = 'manual'
        AND enrolled_at >= NEW.enrolled_at;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : mettre à jour les enrollments quand le statut du programme change
CREATE TRIGGER on_program_enrollment_updated
  AFTER UPDATE ON program_enrollments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_course_access_from_program();

-- Fonction pour supprimer/révoquer les enrollments quand on retire l'accès au programme
CREATE OR REPLACE FUNCTION revoke_course_access_from_program()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
BEGIN
  -- Quand on supprime une inscription au programme, révoquer les enrollments
  FOR course_record IN
    SELECT course_id
    FROM program_courses
    WHERE program_id = OLD.program_id
  LOOP
    -- Révoquer l'enrollment seulement s'il vient du programme
    UPDATE enrollments
    SET status = 'revoked'
    WHERE user_id = OLD.user_id
      AND course_id = course_record.course_id
      AND status = 'active'
      AND source = 'manual'
      AND enrolled_at >= OLD.enrolled_at;
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : révoquer les enrollments quand on supprime l'inscription au programme
CREATE TRIGGER on_program_enrollment_deleted
  AFTER DELETE ON program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION revoke_course_access_from_program();

-- Fonction pour ajouter automatiquement les enrollments quand on ajoute une formation à un programme
-- pour tous les utilisateurs déjà inscrits au programme
CREATE OR REPLACE FUNCTION add_course_access_to_program_enrollees()
RETURNS TRIGGER AS $$
DECLARE
  enrollment_record RECORD;
BEGIN
  -- Parcourir tous les utilisateurs inscrits au programme
  FOR enrollment_record IN
    SELECT user_id, status, enrolled_at
    FROM program_enrollments
    WHERE program_id = NEW.program_id
      AND status = 'active'
  LOOP
    -- Créer l'enrollment à la formation si elle n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1
      FROM enrollments
      WHERE user_id = enrollment_record.user_id
        AND course_id = NEW.course_id
    ) THEN
      INSERT INTO enrollments (
        user_id,
        course_id,
        status,
        source,
        enrolled_at
      )
      VALUES (
        enrollment_record.user_id,
        NEW.course_id,
        enrollment_record.status,
        'manual',
        enrollment_record.enrolled_at
      )
      ON CONFLICT (user_id, course_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : ajouter les enrollments quand on ajoute une formation à un programme
CREATE TRIGGER on_course_added_to_program
  AFTER INSERT ON program_courses
  FOR EACH ROW
  EXECUTE FUNCTION add_course_access_to_program_enrollees();

-- Fonction helper pour vérifier l'accès à une formation via un programme
CREATE OR REPLACE FUNCTION has_course_access_via_program(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM program_enrollments pe
    JOIN program_courses pc ON pe.program_id = pc.program_id
    WHERE pe.user_id = p_user_id
      AND pc.course_id = p_course_id
      AND pe.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

