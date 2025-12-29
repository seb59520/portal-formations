-- Créer manuellement le profil admin pour l'utilisateur actuel
-- Remplacez VOTRE_USER_ID par l'ID réel de votre utilisateur

-- D'abord, trouvez votre user ID dans auth.users
-- SELECT id, email FROM auth.users;

-- Puis créez votre profil (remplacez 'your-user-id-here' par votre vrai ID)
INSERT INTO public.profiles (id, role, full_name)
VALUES (
  'your-user-id-here',  -- ← Remplacez par votre vrai user ID
  'admin',
  'Admin Principal'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Admin Principal';

-- Vérifiez que c'est bien créé
SELECT * FROM profiles WHERE role = 'admin';
