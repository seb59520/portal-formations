# Diagnostic et correction du timeout de profil

## Problème

L'erreur `Profile fetch timeout` indique que la requête vers la table `profiles` prend plus de 10 secondes ou est bloquée.

## Causes possibles

1. **Policies RLS récursives** : Les policies RLS peuvent créer une récursion infinie
2. **Profil manquant** : Le profil n'existe pas dans la base de données
3. **Problème réseau** : Connexion lente vers Supabase
4. **Session invalide** : La session Supabase est corrompue

## Solutions

### Solution 1 : Vérifier et corriger les policies RLS

Exécutez le script `fix-rls-recursion.sql` dans Supabase SQL Editor :

```sql
-- Vérifier si la fonction is_admin existe
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'is_admin'
);

-- Si elle n'existe pas, la créer
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier les policies actuelles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Recréer les policies sans récursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin(auth.uid()));
```

### Solution 2 : Vérifier si le profil existe

Dans Supabase SQL Editor, exécutez :

```sql
-- Remplacer 'votre-user-id' par l'ID de l'utilisateur (visible dans la console)
SELECT * FROM profiles WHERE id = 'votre-user-id';

-- Si le profil n'existe pas, le créer
INSERT INTO profiles (id, role, full_name)
VALUES ('votre-user-id', 'student', 'Nom Utilisateur')
ON CONFLICT (id) DO NOTHING;
```

### Solution 3 : Vérifier la session

Dans la console du navigateur (F12), vérifiez :

```javascript
// Vérifier la session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Vérifier l'ID utilisateur
console.log('User ID:', session?.user?.id)
```

### Solution 4 : Tester la requête directement

Dans Supabase SQL Editor, testez la requête avec votre ID utilisateur :

```sql
-- Remplacer 'votre-user-id' par votre ID
SELECT * FROM profiles WHERE id = 'votre-user-id';
```

Si cette requête prend du temps, c'est un problème de base de données ou de policies RLS.

### Solution 5 : Nettoyer et recréer le profil

Si le profil est corrompu :

```sql
-- Supprimer le profil (ATTENTION : cela supprimera toutes les données associées)
DELETE FROM profiles WHERE id = 'votre-user-id';

-- Recréer le profil
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
VALUES (
  'votre-user-id',
  'student',
  'Nom Utilisateur',
  NOW(),
  NOW()
);
```

## Corrections apportées dans le code

1. **Timeout augmenté** : De 5 à 10 secondes
2. **Utilisation de `maybeSingle()`** : Au lieu de `single()` pour éviter les erreurs si le profil n'existe pas
3. **Meilleure gestion des erreurs** : Distinction entre timeout, profil manquant, et erreurs réseau
4. **Logs améliorés** : Pour faciliter le diagnostic

## Test après correction

1. Ouvrir la console du navigateur (F12)
2. Se connecter
3. Vérifier les logs :
   - `Fetching profile for user: ...`
   - `Profile fetched successfully: ...` ou `No profile found for user: ...`
4. Si le timeout persiste, vérifier les policies RLS avec la Solution 1

## Notes importantes

- Le timeout de 10 secondes est une mesure de sécurité
- Si le problème persiste, c'est probablement un problème de policies RLS
- Un profil manquant n'empêche plus l'utilisation de l'application
- Les logs dans la console aideront à identifier le problème exact

