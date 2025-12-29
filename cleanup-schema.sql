-- Nettoyage complet des tables existantes
-- À exécuter AVANT le schéma principal

-- Supprimer les politiques de stockage d'abord
DROP POLICY IF EXISTS "Course assets readable by enrolled users" ON storage.objects;
DROP POLICY IF EXISTS "Course assets writable by admins and instructors" ON storage.objects;
DROP POLICY IF EXISTS "Submissions accessible by owner" ON storage.objects;

-- Supprimer les politiques RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage their own courses" ON courses;

DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;
DROP POLICY IF EXISTS "Admins and instructors can manage modules" ON modules;

DROP POLICY IF EXISTS "Items viewable with course access" ON items;
DROP POLICY IF EXISTS "Admins and instructors can manage items" ON items;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;

DROP POLICY IF EXISTS "Users can manage their own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins and instructors can view submissions for their courses" ON submissions;

DROP POLICY IF EXISTS "Users can manage their own game scores" ON game_scores;
DROP POLICY IF EXISTS "Admins can view all game scores" ON game_scores;

-- Désactiver RLS avant suppression
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_scores DISABLE ROW LEVEL SECURITY;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les tables (dans l'ordre des dépendances)
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Supprimer les indexes
DROP INDEX IF EXISTS idx_modules_course_id;
DROP INDEX IF EXISTS idx_modules_position;
DROP INDEX IF EXISTS idx_items_module_id;
DROP INDEX IF EXISTS idx_items_position;
DROP INDEX IF EXISTS idx_enrollments_user_id;
DROP INDEX IF EXISTS idx_enrollments_course_id;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_submissions_user_id;
DROP INDEX IF EXISTS idx_submissions_item_id;
DROP INDEX IF EXISTS idx_game_scores_user_course;
