-- Script pour corriger l'accès au profil
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les policies RLS actuelles pour profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Supprimer les policies existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 4. Créer la fonction is_admin si elle n'existe pas (pour éviter la récursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Recréer les policies (SANS récursion)

-- Policy 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Les admins peuvent voir tous les profils (utilise la fonction pour éviter la récursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. Vérifier que les policies sont bien créées
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. Test : Vérifier que vous pouvez lire votre propre profil
-- (Cette requête devrait fonctionner maintenant)
SELECT 
  id,
  role,
  full_name,
  created_at
FROM profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- 8. Si nécessaire, forcer la mise à jour du rôle
UPDATE profiles 
SET role = 'admin' 
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

