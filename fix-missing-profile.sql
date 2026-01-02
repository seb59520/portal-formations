-- Script pour diagnostiquer et corriger un profil manquant
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si le profil existe pour votre utilisateur
-- Remplacez 'VOTRE_USER_ID' par votre ID utilisateur (visible dans la console du navigateur)
SELECT 
  id,
  role,
  full_name,
  created_at
FROM profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

-- 2. Si le profil n'existe pas, le créer avec le rôle admin
-- ATTENTION : Remplacez 'VOTRE_USER_ID' et 'Votre Nom' par vos valeurs
INSERT INTO profiles (id, role, full_name)
VALUES (
  '25e68bd5-be89-4c93-ab84-b657a89f1070',
  'admin',
  'Admin User'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 3. Vérifier les policies RLS pour profiles
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

-- 4. Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 5. Si nécessaire, recréer les policies pour profiles (sans récursion)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Policy pour que les utilisateurs voient leur propre profil
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy pour que les utilisateurs modifient leur propre profil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Créer la fonction is_admin si elle n'existe pas
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Policy pour que les admins voient tous les profils
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. Vérifier que le profil est maintenant accessible
SELECT 
  id,
  role,
  full_name,
  created_at
FROM profiles
WHERE id = '25e68bd5-be89-4c93-ab84-b657a89f1070';

