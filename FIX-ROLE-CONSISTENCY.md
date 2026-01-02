# Fix : Rôle utilisateur qui change régulièrement

## Problème

L'utilisateur principal (Admin) voit son rôle changer régulièrement entre "Étudiant", "Admin", "Formateur" lors de la navigation, alors qu'il ne fait que naviguer dans l'application.

## Cause

Le problème venait de **deux sources de rôles différentes** qui n'étaient pas synchronisées :

1. **`profiles.role`** : Rôle global de l'utilisateur ('admin', 'student', 'instructor')
2. **`org_members.role`** : Rôle dans une organisation spécifique ('admin', 'trainer', 'student', 'auditor')

Le code utilisait parfois `profiles.role`, parfois `org_members.role`, créant des incohérences selon :
- Quelle requête était exécutée en premier
- Si l'utilisateur était dans plusieurs organisations
- Si les données étaient mises en cache différemment

## Solution

### 1. Fonction unifiée `getUserRole()`

Création d'une fonction centralisée dans `src/lib/queries/userRole.ts` qui détermine le rôle de manière cohérente :

**Priorité** :
1. Si `profiles.role === 'admin'` → retourne toujours `'admin'` (priorité absolue)
2. Sinon, si l'utilisateur est dans `org_members` → utilise `org_members.role`
3. Sinon → utilise `profiles.role` comme fallback

### 2. Hook `useUserRole()`

Création d'un hook React `src/hooks/useUserRole.tsx` qui :
- Utilise `getUserRole()` pour déterminer le rôle
- Fournit des helpers : `isAdmin`, `isTrainer`, `isStudent`, `roleLabel`
- Cache le résultat et le rafraîchit uniquement si l'utilisateur change

### 3. Mise à jour des composants

- **`AppHeader.tsx`** : Utilise maintenant `useUserRole()` au lieu de `profile?.role`
- **`getTrainerContext()`** : Utilise `getUserRole()` pour une détermination cohérente
- **`getSessions()`** : Accepte maintenant un paramètre `isAdmin` pour filtrer correctement

## Fichiers modifiés

1. **`src/lib/queries/userRole.ts`** (nouveau)
   - Fonction `getUserRole(userId)` : Détermine le rôle unifié
   - Fonction `getCurrentUserRole()` : Récupère le rôle de l'utilisateur actuel

2. **`src/hooks/useUserRole.tsx`** (nouveau)
   - Hook React pour utiliser le rôle unifié dans les composants

3. **`src/lib/queries/trainerQueries.ts`**
   - `getTrainerContext()` : Utilise maintenant `getUserRole()`
   - `getSessions()` : Accepte un paramètre `isAdmin`

4. **`src/components/AppHeader.tsx`**
   - Utilise `useUserRole()` au lieu de `profile?.role`

5. **`src/pages/trainer/TrainerDashboard.tsx`**
   - Passe le flag `isAdmin` à `getSessions()`

## Vérification

Pour vérifier que le problème est résolu :

1. **Ouvrir la console du navigateur** et chercher les logs :
   ```
   🔍 getUserRole - Début pour userId: ...
   ✅ Rôle déterminé: admin (depuis profiles)
   ```

2. **Vérifier que le rôle ne change plus** lors de la navigation

3. **Vérifier dans la base de données** :
   ```sql
   -- Vérifier le rôle dans profiles
   SELECT id, role FROM profiles WHERE id = 'VOTRE_USER_ID';
   
   -- Vérifier les membres d'organisation
   SELECT om.*, o.name as org_name 
   FROM org_members om
   JOIN orgs o ON o.id = om.org_id
   WHERE om.user_id = 'VOTRE_USER_ID';
   ```

## Script SQL de diagnostic

Exécuter `diagnose-user-role.sql` pour diagnostiquer les incohérences de rôles.

## Notes importantes

- **Les admins dans `profiles` ont toujours la priorité** : même s'ils sont aussi membres d'une organisation avec un rôle différent, ils restent `admin`
- **Les rôles `org_members` sont prioritaires** sur `profiles.role` sauf si `profiles.role === 'admin'`
- **Le mapping des rôles** :
  - `profiles.role: 'instructor'` → `UnifiedRole: 'trainer'`
  - `org_members.role: 'trainer'` → `UnifiedRole: 'trainer'`
  - `org_members.role: 'admin'` → `UnifiedRole: 'admin'` (mais moins prioritaire que `profiles.role === 'admin'`)

