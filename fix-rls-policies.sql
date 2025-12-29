-- Script pour corriger les policies RLS
-- À exécuter dans Supabase SQL Editor

-- Supprimer les policies existantes pour les recréer correctement
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

-- Recréer les policies avec une logique améliorée

-- Policies pour profiles (CRITIQUE : doit permettre l'accès à son propre profil)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy pour admins : utiliser une fonction pour éviter la récursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policies pour courses
CREATE POLICY "Published courses are viewable by everyone" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage their own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.role = 'instructor' AND courses.created_by = p.id))
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
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
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
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
