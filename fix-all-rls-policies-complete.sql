-- ============================================================================
-- SCRIPT COMPLET POUR CORRIGER TOUTES LES POLICIES RLS
-- Portail Formations - Correction complète sans récursion
-- ============================================================================
-- Ce script recrée toutes les policies RLS en utilisant la fonction is_admin()
-- pour éviter les problèmes de récursion infinie.
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Créer la fonction helper is_admin() (si elle n'existe pas)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ÉTAPE 2 : Supprimer toutes les policies existantes
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Courses
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage their own courses" ON courses;

-- Modules
DROP POLICY IF EXISTS "Modules viewable with course access" ON modules;
DROP POLICY IF EXISTS "Admins and instructors can manage modules" ON modules;

-- Items
DROP POLICY IF EXISTS "Items viewable with course access" ON items;
DROP POLICY IF EXISTS "Admins and instructors can manage items" ON items;

-- Chapters
DROP POLICY IF EXISTS "Chapters viewable with item access" ON chapters;
DROP POLICY IF EXISTS "Admins and instructors can manage chapters" ON chapters;

-- Enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;

-- Submissions
DROP POLICY IF EXISTS "Users can manage their own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins and instructors can view submissions for their courses" ON submissions;

-- Game scores
DROP POLICY IF EXISTS "Users can manage their own game scores" ON game_scores;
DROP POLICY IF EXISTS "Admins can view all game scores" ON game_scores;

-- Programs
DROP POLICY IF EXISTS "Published programs are viewable by everyone" ON programs;
DROP POLICY IF EXISTS "Admins can manage all programs" ON programs;
DROP POLICY IF EXISTS "Instructors can manage their own programs" ON programs;

-- Program courses
DROP POLICY IF EXISTS "Program courses viewable with program access" ON program_courses;
DROP POLICY IF EXISTS "Admins and instructors can manage program courses" ON program_courses;

-- Program enrollments
DROP POLICY IF EXISTS "Users can view their own program enrollments" ON program_enrollments;
DROP POLICY IF EXISTS "Admins can manage all program enrollments" ON program_enrollments;

-- Orgs
DROP POLICY IF EXISTS "Admins can view all orgs" ON orgs;
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;

-- Org members
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can manage members in their orgs" ON org_members;

-- Sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view sessions in their org" ON sessions;
DROP POLICY IF EXISTS "Trainers can manage sessions in their org" ON sessions;

-- Exercises
DROP POLICY IF EXISTS "Exercises viewable with item access" ON exercises;
DROP POLICY IF EXISTS "Admins and instructors can manage exercises" ON exercises;

-- ============================================================================
-- ÉTAPE 3 : Recréer toutes les policies (SANS récursion)
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- COURSES
-- ============================================================================
CREATE POLICY "Published courses are viewable by everyone" ON courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Instructors can manage their own courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR (p.role = 'instructor' AND courses.created_by = p.id))
    )
  );

-- ============================================================================
-- MODULES
-- ============================================================================
CREATE POLICY "Modules viewable with course access" ON modules
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE c.id = modules.course_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
      OR EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pc.program_id = pe.program_id
        WHERE pc.course_id = c.id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
    )
  );

CREATE POLICY "Admins and instructors can manage modules" ON modules
  FOR ALL USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = modules.course_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- ITEMS
-- ============================================================================
CREATE POLICY "Items viewable with course access" ON items
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE m.id = items.module_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
      OR EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pc.program_id = pe.program_id
        WHERE pc.course_id = c.id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
    )
  );

CREATE POLICY "Admins and instructors can manage items" ON items
  FOR ALL USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = items.module_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- CHAPTERS
-- ============================================================================
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE i.id = chapters.item_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
      OR EXISTS (
        SELECT 1 FROM program_courses pc
        JOIN program_enrollments pe ON pc.program_id = pe.program_id
        WHERE pc.course_id = c.id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
    )
  );

CREATE POLICY "Admins and instructors can manage chapters" ON chapters
  FOR ALL USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = chapters.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments" ON enrollments
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================
CREATE POLICY "Users can manage their own submissions" ON submissions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins and instructors can view submissions for their courses" ON submissions
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = submissions.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- GAME_SCORES
-- ============================================================================
CREATE POLICY "Users can manage their own game scores" ON game_scores
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all game scores" ON game_scores
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- PROGRAMS
-- ============================================================================
CREATE POLICY "Published programs are viewable by everyone" ON programs
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all programs" ON programs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Instructors can manage their own programs" ON programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR (p.role = 'instructor' AND programs.created_by = p.id))
    )
  );

-- ============================================================================
-- PROGRAM_COURSES
-- ============================================================================
CREATE POLICY "Program courses viewable with program access" ON program_courses
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_courses.program_id
      AND (p.status = 'published' OR p.created_by = auth.uid())
      OR EXISTS (
        SELECT 1 FROM program_enrollments pe
        WHERE pe.program_id = p.id
        AND pe.user_id = auth.uid()
        AND pe.status = 'active'
      )
    )
  );

CREATE POLICY "Admins and instructors can manage program courses" ON program_courses
  FOR ALL USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM programs p
      JOIN profiles prof ON prof.id = auth.uid()
      WHERE p.id = program_courses.program_id
      AND prof.role = 'instructor' AND p.created_by = prof.id
    )
  );

-- ============================================================================
-- PROGRAM_ENROLLMENTS
-- ============================================================================
CREATE POLICY "Users can view their own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all program enrollments" ON program_enrollments
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================================
-- ORGS
-- ============================================================================
CREATE POLICY "Admins can view all orgs" ON orgs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = orgs.id
      AND om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ORG_MEMBERS
-- ============================================================================
CREATE POLICY "Users can view their own org memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL USING (public.is_admin(auth.uid()));

-- Créer la fonction helper pour org_members si elle n'existe pas
CREATE OR REPLACE FUNCTION public.is_org_member_with_role(
  p_user_id UUID,
  p_org_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = p_user_id
    AND org_id = p_org_id
    AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Trainers and admins can manage members in their orgs" ON org_members
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- ============================================================================
-- SESSIONS
-- ============================================================================
CREATE POLICY "Admins can view all sessions" ON sessions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view sessions in their org" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = sessions.org_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can manage sessions in their org" ON sessions
  FOR ALL USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = sessions.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'trainer')
    )
  );

-- ============================================================================
-- EXERCISES
-- ============================================================================
CREATE POLICY "Exercises viewable with item access" ON exercises
  FOR SELECT USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE i.id = exercises.item_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
    )
  );

CREATE POLICY "Admins and instructors can manage exercises" ON exercises
  FOR ALL USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = exercises.item_id
      AND p.role = 'instructor' AND c.created_by = p.id
    )
  );

-- ============================================================================
-- ÉTAPE 4 : Vérification
-- ============================================================================
-- Vérifier que toutes les policies sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

