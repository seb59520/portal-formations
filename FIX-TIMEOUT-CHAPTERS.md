# Fix : Timeout SQL (57014) lors de la récupération des chapitres

## Problème
Lors de la récupération des chapitres pour les étudiants inscrits via un programme, une erreur de timeout SQL se produit :
- **Error code**: `57014`
- **Error message**: `"canceling statement due to statement timeout"`

## Cause
La policy RLS pour les chapitres fait trop de jointures imbriquées :
- `chapters` → `items` → `modules` → `courses` → `program_courses` → `program_enrollments`
- Chaque chapitre vérifie l'accès en faisant ces jointures, ce qui est très coûteux
- Avec 12 items et potentiellement plusieurs chapitres par item, cela multiplie les vérifications

## Solution

### 1. Exécuter le script SQL optimisé

Exécutez le script suivant dans l'interface SQL de Supabase :

**Fichier**: `fix-chapters-policy-performance.sql`

Ce script :
1. **Crée une fonction SQL réutilisable** `user_has_course_access()` qui vérifie l'accès à un cours une seule fois
2. **Crée une fonction SQL** `get_course_id_from_item()` pour obtenir le course_id d'un item
3. **Utilise ces fonctions dans la policy** pour éviter les jointures multiples
4. **Crée des index optimisés** pour améliorer les performances
5. **Crée des index composites** pour optimiser les jointures

### 2. Avantages de cette approche

- **Performance** : Les fonctions SQL sont optimisées et mises en cache par PostgreSQL
- **Réutilisabilité** : La fonction `user_has_course_access()` peut être utilisée ailleurs
- **Maintenabilité** : La logique d'accès est centralisée dans une fonction
- **Index optimisés** : Les index composites accélèrent les jointures

### 3. Vérification

Après avoir exécuté le script :

1. **Vérifiez que les fonctions sont créées** :
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('user_has_course_access', 'get_course_id_from_item');
```

2. **Vérifiez que la policy est créée** :
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'chapters' AND policyname = 'Chapters viewable with item access';
```

3. **Testez l'accès** :
   - Rechargez la page du cours
   - Vérifiez la console : les chapitres devraient être récupérés sans timeout
   - Les logs devraient afficher `✅ Chapters fetched successfully`

### 4. Si le problème persiste

Si vous avez encore des timeouts après avoir exécuté le script :

1. **Vérifiez les index** :
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('chapters', 'items', 'modules', 'courses', 'enrollments', 'program_courses', 'program_enrollments')
ORDER BY tablename, indexname;
```

2. **Analysez les statistiques** :
```sql
ANALYZE chapters;
ANALYZE items;
ANALYZE modules;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE program_courses;
ANALYZE program_enrollments;
```

3. **Vérifiez le plan d'exécution** (optionnel) :
```sql
EXPLAIN ANALYZE
SELECT * FROM chapters
WHERE item_id IN (
  SELECT id FROM items LIMIT 12
);
```

## Structure de la solution

### Fonction `user_has_course_access(course_id_param UUID)`
Vérifie l'accès à un cours dans cet ordre (du plus rapide au plus lent) :
1. Admin : Accès direct
2. Créateur : Vérification directe
3. Formation gratuite : Vérification directe
4. Enrollment direct : Une jointure
5. Accès via programme : Jointures multiples (mais optimisées avec index)

### Fonction `get_course_id_from_item(item_id_param UUID)`
Récupère le course_id d'un item via les jointures items → modules → courses.

### Policy optimisée
```sql
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    public.user_has_course_access(
      public.get_course_id_from_item(chapters.item_id)
    )
  );
```

Cette approche est beaucoup plus performante car :
- Les fonctions sont mises en cache par PostgreSQL
- Les index optimisent les jointures
- La vérification est faite une seule fois par chapitre au lieu de multiples jointures imbriquées

