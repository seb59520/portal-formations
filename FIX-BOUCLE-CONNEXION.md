# Correction des boucles de connexion

## Problème identifié

**Symptôme** : La connexion "tourne en rond" - l'application reste bloquée sur un écran de chargement ou redirige en boucle entre les pages.

## Causes possibles

1. **Session Supabase corrompue** : Le localStorage contient une session invalide
2. **Profil manquant** : L'utilisateur existe mais n'a pas de profil dans la table `profiles`
3. **Timeout trop long** : Le chargement prend trop de temps et bloque l'interface
4. **Boucles de redirection** : Les redirections entre pages créent une boucle infinie

## Corrections apportées

### 1. Timeouts réduits et plus agressifs

**Avant** :
- Timeout auth : 10 secondes
- Timeout ProtectedRoute : 5 secondes
- Timeout profile fetch : pas de timeout

**Après** :
- Timeout auth : 5 secondes
- Timeout ProtectedRoute : 3 secondes
- Timeout profile fetch : 5 secondes
- Timeout session fetch : 3 secondes

### 2. Protection contre les boucles de redirection

- Vérification si on est déjà sur la bonne page avant de rediriger
- Utilisation de `replace` au lieu de `push` pour éviter l'historique
- Flag pour éviter les redirections multiples

### 3. Gestion améliorée des erreurs

- En cas de timeout, on force `loading = false`
- En cas d'erreur de profil, on continue sans profil
- Nettoyage de l'état en cas d'erreur

### 4. Récupération de session avec timeout

- Utilisation de `Promise.race` pour limiter le temps de récupération
- Si la session prend trop de temps, on continue sans session

## Solutions de dépannage

### Solution 1 : Nettoyer le localStorage

Si vous êtes bloqué, ouvrez la console du navigateur (F12) et exécutez :

```javascript
// Nettoyer le localStorage Supabase
localStorage.removeItem('sb-auth-token')
localStorage.removeItem('supabase.auth.token')

// Recharger la page
window.location.reload()
```

### Solution 2 : Vérifier les variables d'environnement

Assurez-vous que `.env` ou `.env.local` contient :
```
VITE_SUPABASE_URL=votre_url
VITE_SUPABASE_ANON_KEY=votre_clé
```

### Solution 3 : Vérifier le profil dans Supabase

Si l'utilisateur existe mais n'a pas de profil :

1. Aller dans Supabase SQL Editor
2. Exécuter :
```sql
-- Vérifier si le profil existe
SELECT * FROM profiles WHERE id = 'votre-user-id';

-- Créer le profil si nécessaire
INSERT INTO profiles (id, role, full_name)
VALUES ('votre-user-id', 'student', 'Nom Utilisateur')
ON CONFLICT (id) DO NOTHING;
```

### Solution 4 : Réinitialiser complètement

Si rien ne fonctionne :

1. Ouvrir la console (F12)
2. Exécuter :
```javascript
// Tout nettoyer
localStorage.clear()
sessionStorage.clear()
window.location.href = '/login'
```

## Fichiers modifiés

1. **`src/hooks/useAuth.tsx`**
   - Timeouts réduits
   - Gestion améliorée des erreurs
   - Timeout sur la récupération de session

2. **`src/components/ProtectedRoute.tsx`**
   - Protection contre les boucles de redirection
   - Vérification de la page actuelle avant redirection
   - Timeout réduit

## Tests à effectuer

1. **Test de connexion normale** :
   - Se connecter avec un compte valide
   - Vérifier que la redirection fonctionne
   - Vérifier qu'il n'y a pas de boucle

2. **Test avec session invalide** :
   - Nettoyer le localStorage
   - Recharger la page
   - Vérifier qu'on est redirigé vers /login

3. **Test avec profil manquant** :
   - Se connecter avec un compte sans profil
   - Vérifier que l'application fonctionne quand même
   - Vérifier qu'on peut créer un profil

4. **Test de timeout** :
   - Simuler une connexion lente
   - Vérifier que le timeout fonctionne
   - Vérifier que l'application ne reste pas bloquée

## Notes importantes

- Les timeouts sont des mesures de sécurité, pas des solutions idéales
- Si le problème persiste, vérifier les logs Supabase
- Un profil manquant n'empêche plus l'utilisation de l'application
- Les redirections utilisent `replace` pour éviter l'historique

