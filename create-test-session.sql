-- Script pour créer rapidement une session de test
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer une organisation de test (si elle n'existe pas)
INSERT INTO orgs (name, slug)
VALUES ('Organisation de Test', 'test-org')
ON CONFLICT (slug) DO NOTHING;

-- 2. Récupérer l'ID de l'organisation
DO $$
DECLARE
  v_org_id UUID;
  v_course_id UUID;
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  -- Récupérer l'org_id
  SELECT id INTO v_org_id
  FROM orgs
  WHERE slug = 'test-org'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organisation "test-org" non trouvée. Exécutez d''abord la création de l''organisation.';
  END IF;

  -- Récupérer le premier cours disponible
  SELECT id INTO v_course_id
  FROM courses
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Aucun cours trouvé. Créez d''abord un cours.';
  END IF;

  -- Récupérer le premier utilisateur admin ou formateur
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.role IN ('admin', 'instructor')
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Utiliser l'utilisateur actuel si pas d'admin trouvé
    SELECT auth.uid() INTO v_user_id;
  END IF;

  -- Créer la session
  INSERT INTO sessions (org_id, course_id, title, status, created_by)
  VALUES (
    v_org_id,
    v_course_id,
    'Session de Test - ' || TO_CHAR(NOW(), 'DD/MM/YYYY'),
    'active',
    v_user_id
  )
  RETURNING id INTO v_session_id;

  RAISE NOTICE '✅ Session créée avec succès !';
  RAISE NOTICE '   - Session ID: %', v_session_id;
  RAISE NOTICE '   - Organisation: %', v_org_id;
  RAISE NOTICE '   - Cours: %', v_course_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes :';
  RAISE NOTICE '   1. Ajouter des étudiants à l''organisation :';
  RAISE NOTICE '      INSERT INTO org_members (org_id, user_id, role)';
  RAISE NOTICE '      VALUES (''%'', ''USER_ID'', ''student'');', v_org_id;
  RAISE NOTICE '';
  RAISE NOTICE '   2. Les étudiants peuvent maintenant s''inscrire à la formation';
  RAISE NOTICE '      et leurs soumissions seront automatiquement liées à cette session.';

END $$;

