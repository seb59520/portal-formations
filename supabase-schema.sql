-- Portail Formations - Schéma Supabase
-- À exécuter dans l'interface SQL de Supabase

-- Tables principales
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'instructor')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'payment_future')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

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

CREATE TABLE game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour optimiser les performances
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_position ON modules(course_id, position);
CREATE INDEX idx_items_module_id ON items(module_id);
CREATE INDEX idx_items_position ON items(module_id, position);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_item_id ON submissions(item_id);
CREATE INDEX idx_game_scores_user_course ON game_scores(user_id, course_id);

-- Trigger pour créer automatiquement un profil lors du signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour courses
CREATE POLICY "Published courses are viewable by everyone" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage their own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor') AND id = created_by
    )
  );

-- Policies pour modules
CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE c.id = modules.course_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage modules" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = modules.course_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

-- Policies pour items
CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE m.id = items.module_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = items.module_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

-- Policies pour enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments" ON enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour submissions
CREATE POLICY "Users can manage their own submissions" ON submissions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins and instructors can view submissions for their courses" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = submissions.item_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

-- Policies pour game_scores
CREATE POLICY "Users can manage their own game scores" ON game_scores
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all game scores" ON game_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage buckets (à créer dans l'interface Supabase Storage)
-- Bucket: course-assets (pour les fichiers des cours)
-- Bucket: submissions (pour les soumissions des étudiants)

-- Policies Storage pour course-assets
-- Lecture : utilisateurs inscrits aux cours ou créateurs
CREATE POLICY "Course assets readable by enrolled users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-assets' AND
    EXISTS (
      SELECT 1 FROM items i
      WHERE i.asset_path = storage.objects.name
      AND EXISTS (
        SELECT 1 FROM modules m
        JOIN courses c ON m.course_id = c.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
        WHERE m.id = i.module_id
        AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
      )
    )
  );

-- Écriture : admins et instructeurs pour leurs cours
CREATE POLICY "Course assets writable by admins and instructors" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-assets' AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'instructor')
    )
  );

-- Policies Storage pour submissions
-- Lecture/écriture : propriétaire uniquement
CREATE POLICY "Submissions accessible by owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'submissions' AND
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.file_path = storage.objects.name AND s.user_id = auth.uid()
    )
  );

-- Données de seed optionnelles
-- IMPORTANT: Ces inserts ne fonctionneront que si les utilisateurs existent dans auth.users
-- Pour créer des données de test, inscrivez-vous d'abord avec un compte admin
-- puis utilisez l'interface admin pour créer des formations

-- Exemple de données de seed (à adapter avec de vrais UUIDs d'utilisateurs):
-- INSERT INTO profiles (id, role, full_name) VALUES
--   ('votre-uuid-admin-ici', 'admin', 'Admin Principal');

-- INSERT INTO courses (id, title, description, status, access_type, created_by) VALUES
--   (gen_random_uuid(), 'Formation React Avancé', 'Maîtrisez React avec hooks, context et performance', 'published', 'free', 'votre-uuid-admin-ici');
