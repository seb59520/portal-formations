-- Script pour corriger les politiques RLS des sessions pour permettre aux admins de voir toutes les sessions
-- À exécuter dans l'interface SQL de Supabase

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Users can view sessions in their orgs" ON sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;

-- Nouvelle politique : Les utilisateurs peuvent voir les sessions de leur organisation
CREATE POLICY "Users can view sessions in their orgs" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = sessions.org_id AND user_id = auth.uid()
    )
  );

-- Politique supplémentaire : Les admins (dans profiles) peuvent voir toutes les sessions
CREATE POLICY "Admins can view all sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Vérifier les politiques existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY policyname;

