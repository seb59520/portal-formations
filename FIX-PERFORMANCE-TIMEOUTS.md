# Fix des problèmes de performance et timeouts

## Problème

Des timeouts se produisent lors du chargement des cours, notamment :
- `Items fetch timeout` après 5 secondes
- Latences importantes sur les requêtes Supabase
- Les politiques RLS sont trop lentes à cause de jointures complexes

## Solution

### 1. Optimiser les politiques RLS

Les politiques RLS pour `modules`, `items`, et `chapters` font des jointures complexes qui ralentissent les requêtes. La solution est d'utiliser des fonctions SQL réutilisables.

**Script à exécuter dans Supabase :**
```sql
-- Exécuter le script complet
optimize-all-policies-performance.sql
```

Ce script :
- Crée/remplace les fonctions SQL optimisées :
  - `user_has_course_access(course_id)` : vérifie l'accès à un cours
  - `get_course_id_from_item(item_id)` : obtient le course_id d'un item
  - `get_course_id_from_module(module_id)` : obtient le course_id d'un module
- Optimise les politiques RLS pour `modules`, `items`, et `chapters` en utilisant ces fonctions
- Crée tous les index nécessaires pour améliorer les performances

### 2. Augmenter les timeouts dans le code

Les timeouts ont été augmentés dans `CourseView.tsx` :
- **Modules** : 10 secondes (au lieu de 5)
- **Items** : 15 secondes (au lieu de 5)
- **Retries** : 2 tentatives avec délai progressif

### 3. Améliorer la gestion des erreurs

Le code détecte maintenant spécifiquement :
- Les timeouts SQL (code 57014)
- Les erreurs de permissions RLS (code PGRST301)
- Affiche des messages d'erreur plus informatifs

## Étapes de résolution

1. **Exécuter le script SQL d'optimisation** :
   - Ouvrir l'interface SQL de Supabase
   - Exécuter `optimize-all-policies-performance.sql`
   - Vérifier que toutes les fonctions et policies sont créées

2. **Vérifier les performances** :
   - Recharger la page du cours
   - Vérifier dans la console que les requêtes sont plus rapides
   - Les timeouts ne devraient plus se produire

3. **Si les problèmes persistent** :
   - Vérifier que les index sont bien créés
   - Analyser les performances avec `EXPLAIN ANALYZE` dans Supabase
   - Vérifier que les fonctions SQL utilisent `SECURITY DEFINER` et `STABLE`

## Scripts disponibles

- `optimize-all-policies-performance.sql` : Script complet pour optimiser toutes les policies
- `optimize-items-policy.sql` : Script spécifique pour les items uniquement
- `diagnose-chapters-rls.sql` : Script de diagnostic pour les chapters

## Notes techniques

- Les fonctions SQL utilisent `SECURITY DEFINER` pour s'exécuter avec les privilèges du créateur
- Les fonctions sont marquées `STABLE` pour permettre l'optimisation par PostgreSQL
- Les index sont créés sur toutes les colonnes utilisées dans les jointures
- Les politiques RLS utilisent maintenant des fonctions au lieu de sous-requêtes complexes

