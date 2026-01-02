-- Script pour corriger la récursion infinie dans les politiques RLS de org_members
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer une fonction helper pour vérifier le rôle sans récursion
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

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can view all members in their orgs" ON org_members;

-- 3. Recréer les politiques sans récursion

-- Politique simple : les utilisateurs peuvent voir leur propre membership
CREATE POLICY "Users can view their own org memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- Politique pour trainers/admins : utiliser la fonction pour éviter la récursion
CREATE POLICY "Trainers and admins can view all members in their orgs" ON org_members
  FOR SELECT USING (
    -- Si c'est leur propre membership, toujours autorisé
    user_id = auth.uid()
    OR
    -- Sinon, vérifier via la fonction (qui contourne RLS)
    public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- 4. Corriger aussi les politiques pour sessions qui utilisent org_members
DROP POLICY IF EXISTS "Users can view sessions in their orgs" ON sessions;
DROP POLICY IF EXISTS "Trainers and admins can manage sessions in their orgs" ON sessions;

-- Politique pour sessions : utiliser la fonction pour éviter la récursion
CREATE POLICY "Users can view sessions in their orgs" ON sessions
  FOR SELECT USING (
    public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer', 'student', 'auditor']::TEXT[]
    )
  );

CREATE POLICY "Trainers and admins can manage sessions in their orgs" ON sessions
  FOR ALL USING (
    public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  );

-- 5. Corriger aussi les politiques pour orgs
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;

CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    public.is_org_member_with_role(
      auth.uid(),
      id,
      ARRAY['admin', 'trainer', 'student', 'auditor']::TEXT[]
    )
  );

-- 6. Vérifier que tout fonctionne
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('org_members', 'sessions', 'orgs')
ORDER BY tablename, policyname;

