-- Ajout du système de Programmes pour fusionner plusieurs formations
-- À exécuter dans l'interface SQL de Supabase

-- Table des programmes (regroupements de formations)
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

-- Table de liaison entre programmes et formations (avec ordre)
CREATE TABLE program_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, course_id)
);

-- Indexes pour optimiser les performances
CREATE INDEX idx_program_courses_program_id ON program_courses(program_id);
CREATE INDEX idx_program_courses_course_id ON program_courses(course_id);
CREATE INDEX idx_program_courses_position ON program_courses(program_id, position);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;

-- Policies pour programs
CREATE POLICY "Published programs are viewable by everyone" ON programs
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all programs" ON programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage their own programs" ON programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor') AND id = created_by
    )
  );

-- Policies pour program_courses
CREATE POLICY "Program courses viewable with program access" ON program_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programs p
      LEFT JOIN enrollments e ON p.id = e.course_id AND e.user_id = auth.uid()
      WHERE p.id = program_courses.program_id
      AND (p.status = 'published' OR p.created_by = auth.uid() OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage program courses" ON program_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programs p
      JOIN profiles prof ON prof.id = auth.uid()
      WHERE p.id = program_courses.program_id
      AND (prof.role = 'admin' OR (prof.role = 'instructor' AND p.created_by = prof.id))
    )
  );

-- Table d'inscription aux programmes (similaire à enrollments)
CREATE TABLE program_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX idx_program_enrollments_user_id ON program_enrollments(user_id);
CREATE INDEX idx_program_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX idx_program_enrollments_status ON program_enrollments(status);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all program enrollments" ON program_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

