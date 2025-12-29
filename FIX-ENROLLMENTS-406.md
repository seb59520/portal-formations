# Correction de l'erreur 406 sur enrollments

## Problème identifié

**Erreur** : `Failed to load resource: the server responded with a status of 406 () (enrollments, line 0)`

**Cause** : L'erreur 406 (Not Acceptable) se produit lorsque :
1. On utilise `.single()` sur une requête qui peut ne pas retourner de résultat
2. L'utilisateur n'est pas encore chargé (`user?.id` est undefined)
3. Les policies RLS rejettent la requête avec un format d'erreur spécifique

## Corrections apportées

### 1. Remplacement de `.single()` par `.maybeSingle()`

**Avant** :
```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  .eq('user_id', user?.id)
  .eq('course_id', courseId)
  .eq('status', 'active')
  .single() // ❌ Erreur si aucun résultat
```

**Après** :
```typescript
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  .eq('user_id', user.id)
  .eq('course_id', courseId)
  .eq('status', 'active')
  .maybeSingle() // ✅ Retourne null si aucun résultat
```

### 2. Vérification de l'utilisateur avant les requêtes

**Avant** :
```typescript
.eq('user_id', user?.id) // ❌ Peut être undefined
```

**Après** :
```typescript
if (!user?.id) {
  setLoading(false)
  return
}
// ...
.eq('user_id', user.id) // ✅ Garanti d'être défini
```

### 3. Gestion améliorée des erreurs

**Avant** :
```typescript
if (accessError && profile?.role !== 'admin') {
  setError('Vous n\'avez pas accès...')
  return
}
```

**Après** :
```typescript
if (accessError || !accessCheck) {
  setError('Vous n\'avez pas accès...')
  return
}
```

### 4. Vérification du rôle admin avant la requête

**Avant** :
```typescript
// Fait la requête même pour les admins
const { data, error } = await supabase
  .from('enrollments')
  .select('id')
  // ...
```

**Après** :
```typescript
// Skip la vérification pour les admins
if (profile?.role !== 'admin' && user?.id) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    // ...
}
```

## Fichiers modifiés

1. **`src/pages/CourseView.tsx`**
   - Remplacement de `.single()` par `.maybeSingle()`
   - Vérification du rôle admin avant la requête
   - Vérification de `user` dans le `useEffect`

2. **`src/pages/ItemView.tsx`**
   - Remplacement de `.single()` par `.maybeSingle()`
   - Vérification du rôle admin avant la requête
   - Amélioration de la gestion des erreurs

3. **`src/pages/Dashboard.tsx`**
   - Vérification de `user?.id` avant la requête
   - Gestion améliorée des erreurs (ne bloque pas si erreur mineure)

## Différence entre `.single()` et `.maybeSingle()`

- **`.single()`** : 
  - Attend exactement 1 résultat
  - Retourne une erreur si 0 ou 2+ résultats
  - Utilisé quand on est sûr qu'il y a un résultat

- **`.maybeSingle()`** :
  - Accepte 0 ou 1 résultat
  - Retourne `null` si aucun résultat (pas d'erreur)
  - Retourne une erreur seulement si 2+ résultats
  - Utilisé quand le résultat peut ne pas exister

## Tests à effectuer

1. **Test avec utilisateur non inscrit** :
   - Accéder à une formation sans être inscrit
   - Vérifier qu'un message d'erreur approprié s'affiche
   - Vérifier qu'il n'y a pas d'erreur 406 dans la console

2. **Test avec admin** :
   - Se connecter en tant qu'admin
   - Accéder à une formation
   - Vérifier qu'il n'y a pas de requête vers enrollments
   - Vérifier que l'accès fonctionne

3. **Test avec utilisateur inscrit** :
   - S'inscrire à une formation
   - Accéder à la formation
   - Vérifier que tout fonctionne normalement

4. **Test de chargement** :
   - Rafraîchir la page pendant le chargement
   - Vérifier qu'il n'y a pas d'erreur 406

## Notes importantes

- L'erreur 406 peut aussi être causée par des problèmes de configuration Supabase (RLS, CORS, etc.)
- Si le problème persiste, vérifier les logs Supabase pour plus de détails
- Les admins n'ont pas besoin d'être inscrits pour accéder aux formations

