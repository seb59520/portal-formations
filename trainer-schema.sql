-- Schéma pour le dashboard Formateur
-- À exécuter dans l'interface SQL de Supabase après le schéma principal

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

-- Indexes pour optimiser les performances
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

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON module_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_notes_updated_at
  BEFORE UPDATE ON trainer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_notes ENABLE ROW LEVEL SECURITY;

-- Policies pour orgs
CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = orgs.id AND user_id = auth.uid()
    )
  );

-- Policies pour org_members
CREATE POLICY "Users can view their own org memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Trainers and admins can view all members in their orgs" ON org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- Policies pour sessions
CREATE POLICY "Users can view sessions in their orgs" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = sessions.org_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers and admins can manage sessions in their orgs" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = sessions.org_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'trainer')
    )
  );

-- Policies pour exercises
CREATE POLICY "Exercises viewable with course access" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE i.id = exercises.item_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
    )
  );

CREATE POLICY "Trainers and admins can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = exercises.item_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

-- Policies pour exercise_attempts
CREATE POLICY "Users can view their own attempts" ON exercise_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attempts" ON exercise_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers and admins can view attempts in their orgs" ON exercise_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercises ex
      JOIN items i ON ex.item_id = i.id
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN org_members om ON om.org_id IN (
        SELECT org_id FROM sessions WHERE id = exercise_attempts.session_id
      )
      WHERE ex.id = exercise_attempts.exercise_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- Policies pour module_progress
CREATE POLICY "Users can view their own progress" ON module_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own progress" ON module_progress
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Trainers and admins can view progress in their orgs" ON module_progress
  FOR SELECT USING (
    session_id IS NULL OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN org_members om ON om.org_id = s.org_id
      WHERE s.id = module_progress.session_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- Policies pour activity_events
CREATE POLICY "Users can create their own events" ON activity_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own events" ON activity_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Trainers and admins can view events in their orgs" ON activity_events
  FOR SELECT USING (
    session_id IS NULL OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN org_members om ON om.org_id = s.org_id
      WHERE s.id = activity_events.session_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- Policies pour trainer_notes
CREATE POLICY "Trainers can manage their own notes" ON trainer_notes
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "Admins can view all notes in their orgs" ON trainer_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = trainer_notes.org_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

