-- ============================================================================
-- SCHEMA COMPLET - TOUTES LES TABLES NÉCESSAIRES
-- Portail Formations - Application complète
-- ============================================================================
-- Ce fichier contient toutes les tables nécessaires pour que l'application
-- fonctionne correctement. Exécutez ce script dans l'ordre indiqué.
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : TABLES DE BASE (supabase-schema.sql)
-- ============================================================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'instructor')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des cours/formations
CREATE TABLE IF NOT EXISTS courses (
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

-- Table des modules (contenus dans les cours)
CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items/leçons (contenus dans les modules)
CREATE TABLE IF NOT EXISTS items (
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

-- Table des inscriptions aux cours
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID, -- Ajouté par add-session-support.sql (référence ajoutée plus bas)
  UNIQUE(user_id, course_id)
);

-- Table des soumissions (réponses aux exercices)
CREATE TABLE IF NOT EXISTS submissions (
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
  session_id UUID, -- Ajouté par add-session-support.sql (référence ajoutée plus bas)
  UNIQUE(user_id, item_id)
);

-- Table des scores de jeux
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PARTIE 2 : TABLES POUR LES PROGRAMMES (add-programs-schema.sql)
-- ============================================================================

-- Table des programmes (regroupements de formations)
CREATE TABLE IF NOT EXISTS programs (
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

-- Table de liaison entre programmes et formations (avec ordre)
CREATE TABLE IF NOT EXISTS program_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, course_id)
);

-- Table d'inscription aux programmes
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- ============================================================================
-- PARTIE 3 : TABLES POUR LES CHAPITRES (add-chapters-schema.sql)
-- ============================================================================

-- Table pour les chapitres (contenus dans les items)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB, -- Contenu riche du chapitre (format TipTap/JSON)
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PARTIE 4 : TABLES POUR LES ORGANISATIONS ET SESSIONS (trainer-schema.sql)
-- ============================================================================

-- Table des organisations
CREATE TABLE IF NOT EXISTS orgs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres d'organisation (remplace/étend profiles pour multi-org)
CREATE TABLE IF NOT EXISTS org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'student', 'auditor')),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Table des sessions (groupes de formation)
CREATE TABLE IF NOT EXISTS sessions (
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

-- Ajouter les références session_id aux tables enrollments et submissions
-- (si elles n'existent pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE submissions ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Table des exercices (détails des items de type 'exercise')
CREATE TABLE IF NOT EXISTS exercises (
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

-- Table des tentatives d'exercices (remplace/étend submissions pour exercices)
CREATE TABLE IF NOT EXISTS exercise_attempts (
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

-- Table de progression par module
CREATE TABLE IF NOT EXISTS module_progress (
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

-- Table des événements d'activité (pour tracking)
CREATE TABLE IF NOT EXISTS activity_events (
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

-- Table des notes privées formateur
CREATE TABLE IF NOT EXISTS trainer_notes (
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

-- ============================================================================
-- PARTIE 5 : TABLES POUR LES JEUX (game-format-files-schema.sql)
-- ============================================================================

-- Table pour les tentatives de jeu
CREATE TABLE IF NOT EXISTS game_attempts (
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

-- Table pour la progression par niveau
CREATE TABLE IF NOT EXISTS game_progress (
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

-- ============================================================================
-- PARTIE 6 : TABLES POUR LES PARAMÈTRES UTILISATEUR (add-user-settings-schema.sql)
-- ============================================================================

-- Table pour les paramètres utilisateur
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pdf_zoom REAL DEFAULT 1.0 CHECK (pdf_zoom >= 0.5 AND pdf_zoom <= 2.0),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('small', 'normal', 'large')),
  layout_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PARTIE 7 : INDEXES POUR OPTIMISER LES PERFORMANCES
-- ============================================================================

-- Indexes pour les tables de base
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_position ON modules(course_id, position);
CREATE INDEX IF NOT EXISTS idx_items_module_id ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_items_position ON items(module_id, position);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_session_id ON enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_item_id ON submissions(item_id);
CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_course ON game_scores(user_id, course_id);

-- Indexes pour les programmes
CREATE INDEX IF NOT EXISTS idx_program_courses_program_id ON program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_position ON program_courses(program_id, position);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(status);

-- Indexes pour les chapitres
CREATE INDEX IF NOT EXISTS idx_chapters_item_id ON chapters(item_id);
CREATE INDEX IF NOT EXISTS idx_chapters_position ON chapters(item_id, position);

-- Indexes pour les organisations et sessions
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(role);
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_exercises_item_id ON exercises(item_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_session_id ON exercise_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_session_id ON module_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_session_id ON activity_events(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at);
CREATE INDEX IF NOT EXISTS idx_trainer_notes_trainer_id ON trainer_notes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_notes_org_id ON trainer_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_trainer_notes_session_id ON trainer_notes(session_id);

-- Indexes pour les jeux
CREATE INDEX IF NOT EXISTS idx_game_attempts_user_id ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_game_type ON game_attempts(game_type);
CREATE INDEX IF NOT EXISTS idx_game_attempts_level ON game_attempts(level);
CREATE INDEX IF NOT EXISTS idx_game_attempts_created_at ON game_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_game_type ON game_progress(game_type);
CREATE INDEX IF NOT EXISTS idx_game_progress_level ON game_progress(level);

-- Indexes pour les paramètres utilisateur
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- PARTIE 8 : FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour créer automatiquement un profil lors du signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orgs_updated_at ON orgs;
CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_progress_updated_at ON module_progress;
CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON module_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainer_notes_updated_at ON trainer_notes;
CREATE TRIGGER update_trainer_notes_updated_at
  BEFORE UPDATE ON trainer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction helper pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour déterminer automatiquement la session d'un enrollment
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

-- Fonction pour mettre à jour automatiquement session_id dans enrollments
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

-- Fonction pour mettre à jour automatiquement session_id dans submissions
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

-- Triggers pour les sessions
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

-- Fonction pour obtenir tous les modules d'un programme dans l'ordre
CREATE OR REPLACE FUNCTION get_program_modules(program_uuid UUID)
RETURNS TABLE (
  module_id UUID,
  module_title TEXT,
  module_position INTEGER,
  course_id UUID,
  course_title TEXT,
  course_position INTEGER,
  global_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered_modules AS (
    SELECT 
      m.id as mod_id,
      m.title as mod_title,
      m.position as mod_pos,
      c.id as cour_id,
      c.title as cour_title,
      pc.position as cour_pos,
      ROW_NUMBER() OVER (ORDER BY pc.position, m.position) as global_pos
    FROM programs p
    JOIN program_courses pc ON p.id = pc.program_id
    JOIN courses c ON pc.course_id = c.id
    JOIN modules m ON m.course_id = c.id
    WHERE p.id = program_uuid
    ORDER BY pc.position, m.position
  )
  SELECT 
    mod_id,
    mod_title,
    mod_pos,
    cour_id,
    cour_title,
    cour_pos,
    global_pos::INTEGER
  FROM ordered_modules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le meilleur score d'un utilisateur pour un niveau
CREATE OR REPLACE FUNCTION get_best_score_for_level(
  p_user_id UUID,
  p_game_type TEXT,
  p_level INTEGER
)
RETURNS TABLE (
  best_score INTEGER,
  best_badge TEXT,
  last_score INTEGER,
  last_badge TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.best_score,
    gp.best_badge,
    gp.last_score,
    gp.last_badge
  FROM game_progress gp
  WHERE gp.user_id = p_user_id
    AND gp.game_type = p_game_type
    AND gp.level = p_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour éviter la récursion dans les politiques RLS
CREATE OR REPLACE FUNCTION public.is_org_member_with_role(
  p_user_id UUID,
  p_org_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Cette fonction utilise SECURITY DEFINER pour contourner RLS
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = p_user_id
    AND org_id = p_org_id
    AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTIE 9 : ROW LEVEL SECURITY (RLS) - Activer RLS sur toutes les tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTE IMPORTANTE : POLITIQUES RLS
-- ============================================================================
-- Les politiques RLS (Row Level Security) sont complexes et nombreuses.
-- Elles sont définies dans les fichiers SQL séparés :
--   - supabase-schema.sql (pour les tables de base)
--   - add-programs-schema.sql (pour les programmes)
--   - add-chapters-schema.sql (pour les chapitres)
--   - trainer-schema.sql (pour les orgs, sessions, etc.)
--   - game-format-files-schema.sql (pour les jeux)
--   - add-user-settings-schema.sql (pour les paramètres)
--   - fix-orgs-rls-policies.sql (pour corriger les politiques orgs)
--   - fix-sessions-rls-for-admins.sql (pour les sessions)
--
-- Vous devrez exécuter ces fichiers séparément pour créer toutes les politiques.
-- ============================================================================

-- ============================================================================
-- RÉSUMÉ DES TABLES CRÉÉES
-- ============================================================================
-- 
-- TABLES DE BASE (7 tables) :
--   1. profiles
--   2. courses
--   3. modules
--   4. items
--   5. enrollments
--   6. submissions
--   7. game_scores
--
-- TABLES POUR LES PROGRAMMES (3 tables) :
--   8. programs
--   9. program_courses
--   10. program_enrollments
--
-- TABLES POUR LES CHAPITRES (1 table) :
--   11. chapters
--
-- TABLES POUR LES ORGANISATIONS ET SESSIONS (7 tables) :
--   12. orgs
--   13. org_members
--   14. sessions
--   15. exercises
--   16. exercise_attempts
--   17. module_progress
--   18. activity_events
--   19. trainer_notes
--
-- TABLES POUR LES JEUX (2 tables) :
--   20. game_attempts
--   21. game_progress
--
-- TABLES POUR LES PARAMÈTRES (1 table) :
--   22. user_settings
--
-- TOTAL : 22 tables
-- ============================================================================

