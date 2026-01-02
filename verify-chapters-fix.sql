-- Script de vérification pour s'assurer que le fix des chapitres est bien appliqué
-- À exécuter dans l'interface SQL de Supabase

-- 1. Vérifier que les fonctions existent
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('user_has_course_access', 'get_course_id_from_item')
ORDER BY routine_name;

-- 2. Vérifier que la policy existe et utilise les fonctions
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

-- 3. Vérifier que les index existent
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('chapters', 'items', 'modules', 'courses', 'enrollments', 'program_courses', 'program_enrollments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 4. Vérifier la définition complète de la policy (pour voir si elle utilise les fonctions)
SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('user_has_course_access', 'get_course_id_from_item')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Si les fonctions n'existent pas, vous verrez 0 lignes
-- Dans ce cas, réexécutez la partie 1 et 2 du script fix-chapters-policy-performance.sql

