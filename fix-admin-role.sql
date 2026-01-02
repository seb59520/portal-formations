-- Script pour vérifier et corriger le rôle admin d'un utilisateur
-- 
-- ÉTAPE 1: Trouver votre user ID
-- Exécutez cette requête pour trouver votre ID utilisateur :
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- ÉTAPE 2: Vérifier le profil actuel
-- Remplacez 'VOTRE_USER_ID' par votre ID réel
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';

-- ÉTAPE 3: Mettre à jour le rôle en admin
-- Remplacez 'VOTRE_USER_ID' par votre ID réel
UPDATE profiles 
SET role = 'admin'
WHERE id = 'VOTRE_USER_ID';

-- ÉTAPE 4: Vérifier que la mise à jour a fonctionné
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';

-- ÉTAPE 5: Si le profil n'existe pas, le créer
-- Remplacez 'VOTRE_USER_ID' par votre ID réel et 'Votre Nom' par votre nom
INSERT INTO profiles (id, role, full_name)
VALUES (
  'VOTRE_USER_ID',
  'admin',
  'Votre Nom'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- ÉTAPE 6: Vérifier tous les admins
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE role = 'admin';

