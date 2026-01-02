-- Script pour ajouter le support des sessions aux tables existantes
-- À exécuter dans l'interface SQL de Supabase

-- ============================================================================
-- PARTIE 1 : Ajouter les colonnes session_id aux tables
-- ============================================================================

DO $$
BEGIN
  -- 1. Ajouter session_id à la table enrollments (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_enrollments_session_id ON enrollments(session_id);
    RAISE NOTICE 'Colonne session_id ajoutée à enrollments.';
  ELSE
    RAISE NOTICE 'Colonne session_id existe déjà dans enrollments.';
  END IF;

  -- 2. Ajouter session_id à la table submissions (si elle n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE submissions ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
    RAISE NOTICE 'Colonne session_id ajoutée à submissions.';
  ELSE
    RAISE NOTICE 'Colonne session_id existe déjà dans submissions.';
  END IF;
END $$;

-- ============================================================================
-- PARTIE 2 : Créer les fonctions (doit être en dehors du bloc DO)
-- ============================================================================

-- 3. Créer une fonction pour déterminer automatiquement la session d'un enrollment
--    basée sur le course_id et l'org_id de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_session_for_course(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_org_id UUID;
BEGIN
  -- Trouver l'org_id de l'utilisateur
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Si pas d'org, retourner NULL
  IF v_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Trouver une session active pour ce cours et cette org
  SELECT id INTO v_session_id
  FROM sessions
  WHERE course_id = p_course_id
    AND org_id = v_org_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Créer un trigger pour mettre à jour automatiquement session_id dans enrollments
--    quand un enrollment est créé ou mis à jour
CREATE OR REPLACE FUNCTION update_enrollment_session()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Si session_id n'est pas déjà défini, le déterminer automatiquement
  IF NEW.session_id IS NULL THEN
    v_session_id := get_user_session_for_course(NEW.user_id, NEW.course_id);
    IF v_session_id IS NOT NULL THEN
      NEW.session_id := v_session_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer un trigger pour mettre à jour automatiquement session_id dans submissions
--    quand une soumission est créée ou mise à jour
CREATE OR REPLACE FUNCTION update_submission_session()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_session_id UUID;
BEGIN
  -- Si session_id n'est pas déjà défini, le déterminer automatiquement
  IF NEW.session_id IS NULL THEN
    -- Trouver le course_id via l'item_id
    SELECT m.course_id INTO v_course_id
    FROM items i
    JOIN modules m ON m.id = i.module_id
    WHERE i.id = NEW.item_id;

    IF v_course_id IS NOT NULL THEN
      v_session_id := get_user_session_for_course(NEW.user_id, v_course_id);
      IF v_session_id IS NOT NULL THEN
        NEW.session_id := v_session_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTIE 3 : Créer les triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_enrollment_session ON enrollments;
CREATE TRIGGER trigger_update_enrollment_session
  BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_session();

DROP TRIGGER IF EXISTS trigger_update_submission_session ON submissions;
CREATE TRIGGER trigger_update_submission_session
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submission_session();

-- ============================================================================
-- PARTIE 4 : Mettre à jour les données existantes
-- ============================================================================

DO $$
BEGIN
  -- 6. Mettre à jour les enrollments existants avec leur session_id
  UPDATE enrollments e
  SET session_id = get_user_session_for_course(e.user_id, e.course_id)
  WHERE e.session_id IS NULL
    AND e.status = 'active';

  RAISE NOTICE 'Enrollments existants mis à jour avec session_id.';

  -- 7. Mettre à jour les submissions existantes avec leur session_id
  UPDATE submissions s
  SET session_id = get_user_session_for_course(
    s.user_id,
    (SELECT m.course_id FROM items i JOIN modules m ON m.id = i.module_id WHERE i.id = s.item_id)
  )
  WHERE s.session_id IS NULL;

  RAISE NOTICE 'Submissions existantes mises à jour avec session_id.';
END $$;

