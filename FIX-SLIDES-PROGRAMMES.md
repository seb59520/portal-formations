# Fix : Slides non visibles pour les étudiants via programmes

## Problème
Les profils étudiants ne voient pas les slides à partir d'un programme, même si les chapitres sont présents.

## Solution

### 1. Exécuter la policy optimisée pour les chapitres

Exécutez le script SQL suivant dans l'interface SQL de Supabase :

```sql
-- Fichier: optimize-chapters-policy.sql
```

Ce script :
- Supprime l'ancienne policy RLS pour `chapters`
- Crée une nouvelle policy optimisée qui inclut l'accès via programmes
- Crée des index pour améliorer les performances

### 2. Vérifier les logs dans la console

Après avoir exécuté le script, rechargez la page du cours et vérifiez la console du navigateur :

1. **Dans CourseView** :
   - `=== Fetching chapters ===` : Affiche le nombre d'items et leurs IDs
   - `Chapters query result` : Affiche les données récupérées et les erreurs éventuelles
   - Si erreur `PGRST301` ou message contenant "permission" → problème de RLS

2. **Dans ChapterViewer** :
   - `=== ChapterViewer: Fetching chapters ===` : Affiche l'item_id
   - `ChapterViewer query result` : Affiche les données récupérées

### 3. Vérifier que la policy est bien appliquée

Exécutez cette requête dans Supabase pour vérifier que la policy existe :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';
```

### 4. Tester l'accès

1. Connectez-vous avec un compte étudiant
2. Accédez à un programme
3. Cliquez sur une formation du programme
4. Cliquez sur une slide
5. Vérifiez que les chapitres s'affichent

### 5. Si le problème persiste

Vérifiez dans la console :
- Les logs `Chapters data:` et `Chapters error:`
- Si `chaptersData` est vide mais qu'il n'y a pas d'erreur → problème de RLS
- Si `chaptersError` contient un code d'erreur → notez le code et le message

## Structure de la policy

La policy vérifie l'accès aux chapitres dans cet ordre (du plus rapide au plus lent) :

1. **Admin** : Accès direct si l'utilisateur est admin
2. **Créateur** : Accès si l'utilisateur a créé la formation
3. **Formation gratuite** : Accès si la formation est publiée et gratuite
4. **Enrollment direct** : Accès si l'utilisateur est directement inscrit à la formation
5. **Accès via programme** : Accès si l'utilisateur est inscrit à un programme contenant la formation

## Index créés

Les index suivants sont créés pour optimiser les performances :

- `idx_chapters_item_id` : Pour les requêtes sur `chapters.item_id`
- `idx_items_module_id` : Pour les jointures `items → modules`
- `idx_modules_course_id` : Pour les jointures `modules → courses`
- `idx_enrollments_user_course_status` : Pour les vérifications d'enrollment
- `idx_program_enrollments_user_status` : Pour les vérifications d'enrollment programme
- `idx_program_courses_course_id` : Pour les jointures `program_courses → courses`
- `idx_courses_created_by` : Pour les vérifications de créateur
- `idx_courses_status_access` : Pour les vérifications de statut/accès

