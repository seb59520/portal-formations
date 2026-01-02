-- Fonction pour permettre aux admins de créer des utilisateurs
-- Cette fonction doit être appelée via une Edge Function Supabase qui utilise l'API Admin
-- ou via l'API Supabase Admin directement depuis le backend

-- Fonction pour mettre à jour le rôle d'un utilisateur (accessible aux admins)
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent modifier les rôles';
  END IF;

  -- Vérifier que le rôle est valide
  IF new_role NOT IN ('admin', 'student', 'instructor') THEN
    RAISE EXCEPTION 'Rôle invalide: %', new_role;
  END IF;

  -- Mettre à jour le rôle
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Fonction pour créer un profil avec un rôle spécifique (après création de l'utilisateur)
CREATE OR REPLACE FUNCTION public.create_profile_with_role(
  user_id UUID,
  user_role TEXT,
  user_full_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent créer des profils';
  END IF;

  -- Vérifier que le rôle est valide
  IF user_role NOT IN ('admin', 'student', 'instructor') THEN
    RAISE EXCEPTION 'Rôle invalide: %', user_role;
  END IF;

  -- Créer ou mettre à jour le profil
  INSERT INTO profiles (id, role, full_name)
  VALUES (user_id, user_role, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  RETURN TRUE;
END;
$$;

-- Policy pour permettre aux admins de mettre à jour tous les profils
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy pour permettre aux admins d'insérer des profils
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

