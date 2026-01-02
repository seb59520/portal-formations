-- ============================================================================
-- SCRIPT DE DIAGNOSTIC - ÉTAT ACTUEL DE LA BASE DE DONNÉES
-- ============================================================================
-- Exécutez ce script dans l'interface SQL de Supabase pour vérifier
-- quelles tables existent déjà et lesquelles manquent.
-- ============================================================================

-- 1. Liste de toutes les tables attendues
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'courses',
    'modules',
    'items',
    'enrollments',
    'submissions',
    'game_scores',
    'programs',
    'program_courses',
    'program_enrollments',
    'chapters',
    'orgs',
    'org_members',
    'sessions',
    'exercises',
    'exercise_attempts',
    'module_progress',
    'activity_events',
    'trainer_notes',
    'game_attempts',
    'game_progress',
    'user_settings'
  ]) AS table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
)
SELECT 
  et.table_name AS "Table attendue",
  CASE 
    WHEN EXISTS (SELECT 1 FROM existing_tables WHERE table_name = et.table_name) 
    THEN '✅ EXISTE' 
    ELSE '❌ MANQUANTE' 
  END AS "Statut",
  CASE 
    WHEN EXISTS (SELECT 1 FROM existing_tables WHERE table_name = et.table_name) 
    THEN (
      SELECT COUNT(*)::TEXT 
      FROM information_schema.columns 
      WHERE table_name = et.table_name
    )
    ELSE '0'
  END AS "Nombre de colonnes"
FROM expected_tables et
ORDER BY 
  CASE 
    WHEN EXISTS (SELECT 1 FROM existing_tables WHERE table_name = et.table_name) 
    THEN 0 
    ELSE 1 
  END,
  et.table_name;

-- 2. Détails des tables existantes avec leurs colonnes
SELECT 
  t.table_name AS "Table",
  c.column_name AS "Colonne",
  c.data_type AS "Type",
  c.is_nullable AS "Nullable",
  c.column_default AS "Défaut"
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY t.table_name, c.ordinal_position;

-- 3. Vérification des clés étrangères
SELECT
  tc.table_name AS "Table",
  kcu.column_name AS "Colonne",
  ccu.table_name AS "Table référencée",
  ccu.column_name AS "Colonne référencée",
  tc.constraint_name AS "Contrainte"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 4. Vérification des indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY tablename, indexname;

-- 5. Vérification du RLS (Row Level Security)
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Activé' ELSE '❌ Désactivé' END AS "RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY tablename;

-- 6. Vérification des politiques RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS "Commande",
  CASE WHEN qual IS NOT NULL THEN 'Oui' ELSE 'Non' END AS "Condition USING",
  CASE WHEN with_check IS NOT NULL THEN 'Oui' ELSE 'Non' END AS "Condition WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY tablename, policyname;

-- 7. Vérification des fonctions
SELECT
  routine_schema,
  routine_name,
  routine_type,
  data_type AS "Type retour"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_updated_at_column',
    'is_admin',
    'get_user_session_for_course',
    'update_enrollment_session',
    'update_submission_session',
    'get_program_modules',
    'get_best_score_for_level',
    'is_org_member_with_role'
  )
ORDER BY routine_name;

-- 8. Vérification des triggers
SELECT
  trigger_schema,
  event_object_table AS "Table",
  trigger_name AS "Trigger",
  event_manipulation AS "Événement",
  action_timing AS "Timing",
  action_statement AS "Action"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 
    'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings',
    'auth.users'
  )
ORDER BY event_object_table, trigger_name;

-- 9. Résumé des colonnes manquantes dans les tables existantes
-- (Vérifie si session_id existe dans enrollments et submissions)
SELECT 
  'enrollments' AS "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'enrollments' AND column_name = 'session_id'
    ) THEN '✅ session_id existe'
    ELSE '❌ session_id MANQUANT'
  END AS "Colonne session_id"
UNION ALL
SELECT 
  'submissions' AS "Table",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'submissions' AND column_name = 'session_id'
    ) THEN '✅ session_id existe'
    ELSE '❌ session_id MANQUANT'
  END AS "Colonne session_id";

-- 10. Compte des enregistrements par table (pour voir si des données existent)
SELECT 
  'profiles' AS table_name,
  COUNT(*)::BIGINT AS row_count
FROM profiles
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'modules', COUNT(*) FROM modules
UNION ALL
SELECT 'items', COUNT(*) FROM items
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'game_scores', COUNT(*) FROM game_scores
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'program_courses', COUNT(*) FROM program_courses
UNION ALL
SELECT 'program_enrollments', COUNT(*) FROM program_enrollments
UNION ALL
SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL
SELECT 'orgs', COUNT(*) FROM orgs
UNION ALL
SELECT 'org_members', COUNT(*) FROM org_members
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL
SELECT 'exercise_attempts', COUNT(*) FROM exercise_attempts
UNION ALL
SELECT 'module_progress', COUNT(*) FROM module_progress
UNION ALL
SELECT 'activity_events', COUNT(*) FROM activity_events
UNION ALL
SELECT 'trainer_notes', COUNT(*) FROM trainer_notes
UNION ALL
SELECT 'game_attempts', COUNT(*) FROM game_attempts
UNION ALL
SELECT 'game_progress', COUNT(*) FROM game_progress
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
ORDER BY table_name;

