# Corrections des erreurs

## Problèmes identifiés et corrigés

### 1. Warning TipTap : Extensions dupliquées
**Erreur** : `[tiptap warn]: Duplicate extension names found: ['link']`

**Cause** : Le `StarterKit` inclut déjà l'extension `Link`, et on l'ajoutait aussi séparément, créant une duplication.

**Solution** : Désactivation de `Link` dans `StarterKit` puis ajout séparé avec configuration personnalisée.

```typescript
StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
  link: false, // Désactiver Link dans StarterKit
}),
Link.configure({
  // Configuration personnalisée
}),
```

### 2. Erreur 400 lors du chargement des items
**Erreur** : `Failed to load resource: the server responded with a status of 400 () (items, line 0)`

**Causes possibles** :
- L'itemId n'est pas valide (peut être "new" ou un ID temporaire)
- L'item n'existe pas dans la base de données
- Problème de permissions RLS (Row Level Security)

**Solutions appliquées** :
1. Vérification de la validité de `itemId` avant de faire la requête
2. Meilleure gestion des erreurs avec messages spécifiques :
   - `PGRST116` : Item non trouvé
   - `42501` : Problème de permissions
   - Autres erreurs : Message d'erreur détaillé
3. Gestion du cas où `itemId` est "new" ou commence par "temp-"

### 3. Amélioration de la gestion d'erreurs
- Messages d'erreur plus explicites
- Gestion spécifique des codes d'erreur Supabase
- Vérification de la validité des données avant de les utiliser

## Fichiers modifiés

1. **`src/components/RichTextEditor.tsx`**
   - Désactivation de `Link` dans `StarterKit` pour éviter la duplication

2. **`src/pages/admin/AdminItemEdit.tsx`**
   - Vérification de la validité de `itemId` avant la requête
   - Meilleure gestion des erreurs avec messages spécifiques
   - Gestion des cas d'erreur courants (item non trouvé, permissions, etc.)

## Tests à effectuer

1. **Test de création d'item** :
   - Créer un nouvel item depuis `/admin/courses/{courseId}`
   - Vérifier qu'il n'y a pas d'erreur 400

2. **Test d'édition d'item** :
   - Éditer un item existant
   - Vérifier que l'item se charge correctement
   - Vérifier qu'il n'y a pas de warning TipTap

3. **Test avec item invalide** :
   - Essayer d'accéder à un item qui n'existe pas
   - Vérifier qu'un message d'erreur approprié s'affiche

4. **Test de l'éditeur** :
   - Utiliser l'éditeur de contenu riche
   - Vérifier qu'il n'y a pas de warning dans la console
   - Tester toutes les fonctionnalités (gras, italique, liens, etc.)

## Notes importantes

- Les warnings TipTap ne bloquent pas l'application mais peuvent causer des comportements inattendus
- L'erreur 400 peut aussi venir d'un problème de configuration RLS dans Supabase
- Si le problème persiste, vérifier les logs Supabase pour plus de détails

