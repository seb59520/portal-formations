-- ============================================================================
-- SCRIPT POUR CRÉER UNIQUEMENT LES TABLES MANQUANTES
-- ============================================================================
-- Ce script vérifie quelles tables manquent et les crée automatiquement
-- Exécutez ce script après avoir exécuté diagnostic-schema-complet.sql
-- ============================================================================

-- Fonction pour créer une table seulement si elle n'existe pas
DO $$
BEGIN
  -- ============================================================================
  -- TABLES DE BASE
  -- ============================================================================
  
  -- Table profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'instructor')),
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table profiles créée';
  END IF;

  -- Table courses
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TABLE courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'paid', 'invite')),
      price_cents INTEGER,
      currency TEXT DEFAULT 'EUR',
      is_paid BOOLEAN DEFAULT FALSE,
      created_by UUID REFERENCES profiles(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table courses créée';
  END IF;

  -- Table modules
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules') THEN
    CREATE TABLE modules (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table modules créée';
  END IF;

  -- Table items
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
    CREATE TABLE items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('resource', 'slide', 'exercise', 'tp', 'game')),
      title TEXT NOT NULL,
      content JSONB,
      asset_path TEXT,
      external_url TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      published BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table items créée';
  END IF;

  -- Table enrollments
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    CREATE TABLE enrollments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
      source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
      enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    );
    RAISE NOTICE 'Table enrollments créée';
  END IF;

  -- Table submissions
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
    CREATE TABLE submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
      answer_text TEXT,
      answer_json JSONB,
      file_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
      grade INTEGER CHECK (grade >= 0 AND grade <= 100),
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      graded_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(user_id, item_id)
    );
    RAISE NOTICE 'Table submissions créée';
  END IF;

  -- Table game_scores
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_scores') THEN
    CREATE TABLE game_scores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
      item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
      score INTEGER NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table game_scores créée';
  END IF;

  -- ============================================================================
  -- TABLES POUR LES PROGRAMMES
  -- ============================================================================

  -- Table programs
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs') THEN
    CREATE TABLE programs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'paid', 'invite')),
      price_cents INTEGER,
      currency TEXT DEFAULT 'EUR',
      created_by UUID REFERENCES profiles(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table programs créée';
  END IF;

  -- Table program_courses
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_courses') THEN
    CREATE TABLE program_courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(program_id, course_id)
    );
    RAISE NOTICE 'Table program_courses créée';
  END IF;

  -- Table program_enrollments
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_enrollments') THEN
    CREATE TABLE program_enrollments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
      source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
      enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, program_id)
    );
    RAISE NOTICE 'Table program_enrollments créée';
  END IF;

  -- ============================================================================
  -- TABLES POUR LES CHAPITRES
  -- ============================================================================

  -- Table chapters
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters') THEN
    CREATE TABLE chapters (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      content JSONB,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table chapters créée';
  END IF;

  -- ============================================================================
  -- TABLES POUR LES ORGANISATIONS ET SESSIONS
  -- ============================================================================

  -- Table orgs
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orgs') THEN
    CREATE TABLE orgs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table orgs créée';
  END IF;

  -- Table org_members
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_members') THEN
    CREATE TABLE org_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'student', 'auditor')),
      display_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(org_id, user_id)
    );
    RAISE NOTICE 'Table org_members créée';
  END IF;

  -- Table sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
    CREATE TABLE sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
      created_by UUID REFERENCES profiles(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table sessions créée';
  END IF;

  -- Table exercises
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
    CREATE TABLE exercises (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'text', 'code', 'file', 'game')),
      correct_answer JSONB,
      max_attempts INTEGER DEFAULT 3,
      passing_score INTEGER DEFAULT 60,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table exercises créée';
  END IF;

  -- Table exercise_attempts
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_attempts') THEN
    CREATE TABLE exercise_attempts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
      session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
      answer_text TEXT,
      answer_json JSONB,
      score INTEGER CHECK (score >= 0 AND score <= 100),
      is_correct BOOLEAN,
      feedback TEXT,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, exercise_id, attempt_number)
    );
    RAISE NOTICE 'Table exercise_attempts créée';
  END IF;

  -- Table module_progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_progress') THEN
    CREATE TABLE module_progress (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
      session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
      percent INTEGER NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
      completed_at TIMESTAMP WITH TIME ZONE,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, module_id, session_id)
    );
    RAISE NOTICE 'Table module_progress créée';
  END IF;

  -- Table activity_events
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_events') THEN
    CREATE TABLE activity_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
      item_id UUID REFERENCES items(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'submit', 'abandon')),
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table activity_events créée';
  END IF;

  -- Table trainer_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainer_notes') THEN
    CREATE TABLE trainer_notes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
      course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
      module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
      session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
      user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      title TEXT,
      content TEXT NOT NULL,
      tags TEXT[],
      is_private BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table trainer_notes créée';
  END IF;

  -- ============================================================================
  -- TABLES POUR LES JEUX
  -- ============================================================================

  -- Table game_attempts
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_attempts') THEN
    CREATE TABLE game_attempts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      game_type TEXT NOT NULL DEFAULT 'format-files',
      level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
      score INTEGER NOT NULL CHECK (score >= 0),
      total INTEGER NOT NULL CHECK (total > 0),
      percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
      badge TEXT CHECK (badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
      wrong_ids TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table game_attempts créée';
  END IF;

  -- Table game_progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_progress') THEN
    CREATE TABLE game_progress (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      game_type TEXT NOT NULL DEFAULT 'format-files',
      level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
      best_score INTEGER CHECK (best_score >= 0),
      best_badge TEXT CHECK (best_badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
      last_score INTEGER CHECK (last_score >= 0),
      last_badge TEXT CHECK (last_badge IN ('🥉 Bronze', '🥈 Argent', '🥇 Or')),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, game_type, level)
    );
    RAISE NOTICE 'Table game_progress créée';
  END IF;

  -- ============================================================================
  -- TABLES POUR LES PARAMÈTRES
  -- ============================================================================

  -- Table user_settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    CREATE TABLE user_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
      pdf_zoom REAL DEFAULT 1.0 CHECK (pdf_zoom >= 0.5 AND pdf_zoom <= 2.0),
      theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
      font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('small', 'normal', 'large')),
      layout_preferences JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Table user_settings créée';
  END IF;

  -- ============================================================================
  -- AJOUT DES COLONNES MANQUANTES (session_id)
  -- ============================================================================

  -- Ajouter session_id à enrollments si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne session_id ajoutée à enrollments';
  END IF;

  -- Ajouter session_id à submissions si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE submissions ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
    RAISE NOTICE 'Colonne session_id ajoutée à submissions';
  END IF;

  RAISE NOTICE '✅ Vérification terminée. Toutes les tables nécessaires existent.';

END $$;

-- Afficher un résumé final
SELECT 
  table_name AS "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END AS "Statut"
FROM (VALUES
  ('profiles'), ('courses'), ('modules'), ('items'), ('enrollments'), ('submissions'), ('game_scores'),
  ('programs'), ('program_courses'), ('program_enrollments'),
  ('chapters'),
  ('orgs'), ('org_members'), ('sessions'), ('exercises'), ('exercise_attempts'), ('module_progress'), 
  ('activity_events'), ('trainer_notes'),
  ('game_attempts'), ('game_progress'),
  ('user_settings')
) AS t(table_name)
ORDER BY 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN 0 
    ELSE 1 
  END,
  t.table_name;

