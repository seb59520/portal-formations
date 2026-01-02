-- Script pour corriger les politiques RLS de la table 'orgs'
-- Permet aux admins de créer et gérer des organisations
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer une fonction helper pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Supprimer les anciennes politiques pour orgs
DROP POLICY IF EXISTS "Users can view orgs they belong to" ON orgs;
DROP POLICY IF EXISTS "Admins can view all orgs" ON orgs;
DROP POLICY IF EXISTS "Admins can manage orgs" ON orgs;

-- 3. Politique SELECT : Les utilisateurs peuvent voir les orgs auxquelles ils appartiennent
CREATE POLICY "Users can view orgs they belong to" ON orgs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = orgs.id AND user_id = auth.uid()
    )
  );

-- 4. Politique SELECT supplémentaire : Les admins peuvent voir toutes les orgs
CREATE POLICY "Admins can view all orgs" ON orgs
  FOR SELECT USING (public.is_admin());

-- 5. Politique INSERT/UPDATE/DELETE : Les admins peuvent créer et gérer toutes les orgs
CREATE POLICY "Admins can manage orgs" ON orgs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'orgs'
ORDER BY policyname;

-- 7. Vérifier aussi les politiques pour org_members (pour permettre l'ajout de membres)
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admins can manage org members" ON org_members;
DROP POLICY IF EXISTS "Trainers and admins can manage members in their orgs" ON org_members;

-- Politique pour permettre aux admins de gérer tous les membres
CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Vérifier si la fonction is_org_member_with_role existe (créée dans fix-org-members-rls-recursion.sql)
-- Si elle n'existe pas, la créer
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

-- Politique pour permettre aux trainers/admins d'org de gérer les membres de leur org
-- Utiliser la fonction helper pour éviter la récursion
CREATE POLICY "Trainers and admins can manage members in their orgs" ON org_members
  FOR ALL USING (
    -- Si c'est leur propre membership, ils peuvent la modifier
    user_id = auth.uid()
    OR
    -- Sinon, vérifier via la fonction (qui contourne RLS)
    public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
  )
  WITH CHECK (
    -- Pour INSERT, vérifier qu'ils sont admin ou trainer dans cette org
    public.is_org_member_with_role(
      auth.uid(),
      org_id,
      ARRAY['admin', 'trainer']::TEXT[]
    )
    OR public.is_admin()
  );

-- 8. Vérifier les politiques pour org_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'org_members'
ORDER BY policyname;

