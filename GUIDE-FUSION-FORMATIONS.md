# Guide : Fusionner plusieurs formations

Ce guide explique comment fusionner plusieurs formations entre elles avec un ordre défini.

## 📋 Deux approches possibles

### Solution 1 : Système de Programmes (Recommandée) ⭐

**Avantages :**
- ✅ Les formations restent indépendantes et réutilisables
- ✅ Une formation peut appartenir à plusieurs programmes
- ✅ Pas de duplication de données
- ✅ Facile de réorganiser l'ordre
- ✅ Suivi des inscriptions par programme

**Inconvénients :**
- ⚠️ Nécessite une nouvelle table dans la base de données
- ⚠️ L'interface frontend doit être adaptée pour afficher les programmes

### Solution 2 : Concaténation directe

**Avantages :**
- ✅ Simple et rapide
- ✅ Utilise la structure existante
- ✅ Pas de modification du frontend nécessaire

**Inconvénients :**
- ⚠️ Duplication des données (modules copiés)
- ⚠️ Les formations originales et la fusionnée sont indépendantes
- ⚠️ Modifications dans une formation originale ne se répercutent pas dans la fusionnée

## 🚀 Solution 1 : Créer un Programme

### Étape 1 : Ajouter le schéma

Exécutez le fichier `add-programs-schema.sql` dans l'interface SQL de Supabase :

```sql
-- Ce script crée :
-- - La table `programs` (programmes)
-- - La table `program_courses` (liaison programmes ↔ formations avec ordre)
-- - La table `program_enrollments` (inscriptions aux programmes)
-- - Les policies RLS
-- - Une fonction `get_program_modules()` pour récupérer tous les modules dans l'ordre
```

### Étape 2 : Créer un programme

#### Option A : Utiliser le script d'exemple

1. Ouvrez `create-program-example.sql`
2. Remplacez `'VOTRE_USER_ID'` par votre UUID utilisateur
3. Exécutez le script

#### Option B : Créer manuellement

```sql
-- 1. Créer le programme
INSERT INTO programs (title, description, status, access_type, created_by)
VALUES (
  'Mon Programme Complet',
  'Description du programme',
  'published',
  'free',
  'votre-uuid-utilisateur'::UUID
)
RETURNING id;

-- 2. Ajouter les formations dans l'ordre souhaité
-- Remplacez les UUIDs par les IDs réels de vos formations
INSERT INTO program_courses (program_id, course_id, position) VALUES
  ('uuid-programme'::UUID, 'uuid-formation-1'::UUID, 0),  -- Position 0 = première
  ('uuid-programme'::UUID, 'uuid-formation-2'::UUID, 1),  -- Position 1 = deuxième
  ('uuid-programme'::UUID, 'uuid-formation-3'::UUID, 2);   -- Position 2 = troisième
```

### Étape 3 : Récupérer les modules dans l'ordre

```sql
-- Utiliser la fonction helper
SELECT * FROM get_program_modules('uuid-programme'::UUID);

-- Ou manuellement
SELECT 
  m.id,
  m.title,
  m.position as module_position,
  c.title as course_title,
  pc.position as course_position_in_program,
  ROW_NUMBER() OVER (ORDER BY pc.position, m.position) as global_position
FROM programs p
JOIN program_courses pc ON p.id = pc.program_id
JOIN courses c ON pc.course_id = c.id
JOIN modules m ON m.course_id = c.id
WHERE p.id = 'uuid-programme'::UUID
ORDER BY pc.position, m.position;
```

### Étape 4 : Gérer les inscriptions

```sql
-- Inscrire un utilisateur au programme
INSERT INTO program_enrollments (user_id, program_id, status)
VALUES ('uuid-utilisateur'::UUID, 'uuid-programme'::UUID, 'active');

-- Vérifier les inscriptions
SELECT 
  p.title as program,
  pr.full_name as user,
  pe.status,
  pe.enrolled_at
FROM program_enrollments pe
JOIN programs p ON pe.program_id = p.id
JOIN profiles pr ON pe.user_id = pr.id;
```

## 🔧 Solution 2 : Concaténation directe

### Étape 1 : Exécuter le script

1. Ouvrez `merge-courses-direct.sql`
2. Remplacez `'VOTRE_USER_ID'` par votre UUID utilisateur
3. Modifiez les IDs des formations à fusionner (ou laissez le script utiliser les premières formations trouvées)
4. Exécutez le script

### Étape 2 : Vérifier le résultat

```sql
-- Vérifier la formation fusionnée
SELECT 
  c.title,
  COUNT(DISTINCT m.id) as modules_count,
  COUNT(DISTINCT i.id) as items_count
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN items i ON i.module_id = m.id
WHERE c.title LIKE '%Fusionnée%'
GROUP BY c.id, c.title;
```

## 📊 Comparaison des deux solutions

| Critère | Solution 1 (Programmes) | Solution 2 (Concaténation) |
|---------|------------------------|---------------------------|
| **Flexibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Réutilisabilité** | ⭐⭐⭐⭐⭐ | ⭐ |
| **Simplicité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐⭐ | ⭐⭐ |

## 🎯 Recommandation

**Utilisez la Solution 1 (Programmes)** si :
- Vous voulez réutiliser les formations dans plusieurs parcours
- Vous voulez garder les formations originales intactes
- Vous avez besoin de flexibilité pour réorganiser l'ordre

**Utilisez la Solution 2 (Concaténation)** si :
- Vous voulez une solution rapide et simple
- Vous ne prévoyez pas de réutiliser les formations
- Vous êtes prêt à gérer la duplication des données

## 🔄 Réorganiser l'ordre dans un programme

```sql
-- Changer l'ordre des formations dans un programme
UPDATE program_courses 
SET position = 2 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-1'::UUID;

UPDATE program_courses 
SET position = 0 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-1'::UUID;

UPDATE program_courses 
SET position = 1 
WHERE program_id = 'uuid-programme'::UUID 
  AND course_id = 'uuid-formation-2'::UUID;
```

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"
- Vérifiez que tous les UUIDs sont au format correct : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Utilisez `::UUID` pour forcer le cast si nécessaire

### Erreur : "violates foreign key constraint"
- Vérifiez que les formations existent avant de les ajouter au programme
- Vérifiez que l'utilisateur créateur existe dans la table `profiles`

### Les modules ne s'affichent pas dans l'ordre
- Vérifiez que les `position` dans `program_courses` sont correctes
- Utilisez `ORDER BY pc.position, m.position` dans vos requêtes

## 📝 Prochaines étapes

1. **Adapter le frontend** pour afficher les programmes
2. **Créer une interface admin** pour gérer les programmes
3. **Ajouter des métriques** de progression par programme
4. **Implémenter la navigation** entre formations dans un programme

