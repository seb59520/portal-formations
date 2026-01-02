# Création du Cours "Développement d'API Professionnelles"

Ce guide explique comment créer la structure complète du cours dans votre base de données Supabase.

## 📋 Prérequis

1. Avoir un compte admin ou instructor dans votre base de données
2. Accès à l'interface SQL de Supabase
3. Les tables `courses`, `modules`, `items`, et `chapters` doivent exister (voir `supabase-schema.sql` et `add-chapters-schema.sql`)

## 🚀 Étapes d'installation

### 1. Obtenir votre UUID utilisateur

Exécutez cette requête dans l'éditeur SQL de Supabase pour obtenir votre UUID :

```sql
SELECT id, role, full_name 
FROM profiles 
WHERE role IN ('admin', 'instructor') 
LIMIT 1;
```

Copiez l'UUID retourné (format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Modifier le script SQL

Ouvrez le fichier `create-api-course-structure.sql` et remplacez la ligne 17 :

```sql
user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
```

Par votre UUID, par exemple :

```sql
user_uuid UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;
```

### 3. Exécuter le script

1. Ouvrez l'éditeur SQL de Supabase
2. Copiez-collez le contenu complet de `create-api-course-structure.sql`
3. Cliquez sur "Run" ou exécutez le script

### 4. Vérifier la création

Exécutez cette requête pour vérifier que tout a été créé :

```sql
SELECT 
  c.title as course,
  COUNT(DISTINCT m.id) as modules,
  COUNT(DISTINCT i.id) as items,
  COUNT(DISTINCT ch.id) as chapters
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN items i ON i.module_id = m.id
LEFT JOIN chapters ch ON ch.item_id = i.id
WHERE c.title = 'Développement d''API Professionnelles'
GROUP BY c.id, c.title;
```

Vous devriez voir :
- **1 cours**
- **11 modules**
- **47 items (leçons)**
- **~188 chapitres**

## 📊 Structure créée

Le script crée la hiérarchie complète :

```
📚 Développement d'API Professionnelles
  ├── 📦 Module 1: Fondamentaux et Paradigmes d'API (4 leçons)
  ├── 📦 Module 2: Spécifications et Contrats (3 leçons)
  ├── 📦 Module 3: Modélisation et Persistance (4 leçons)
  ├── 📦 Module 4: Sécurité by Design (5 leçons)
  ├── 📦 Module 5: Gestion des Erreurs et Observabilité (4 leçons)
  ├── 📦 Module 6: Tests et Qualité (4 leçons)
  ├── 📦 Module 7: Performance et Scalabilité (4 leçons)
  ├── 📦 Module 8: Architecture Micro-services et Event-Driven (5 leçons)
  ├── 📦 Module 9: Documentation et Portail Développeur (3 leçons)
  ├── 📦 Module 10: Déploiement Continu (4 leçons)
  └── 📦 Module 11: Projet Fil Rouge - Application Full-Stack PWA (7 leçons)
```

## ⚠️ Notes importantes

- **Le cours est créé en statut `published`** : il sera visible par tous les utilisateurs
- **Le cours est en accès `free`** : vous pouvez le modifier après création
- **Tous les chapitres sont vides** : vous devrez ajouter le contenu via l'interface d'édition
- **Les items du module 11 sont de type `tp`** (travaux pratiques) : les autres sont de type `resource`

## 🔧 Personnalisation

Après la création, vous pouvez :

1. **Modifier le contenu** via l'interface admin (`/admin/courses/{courseId}/edit`)
2. **Ajouter du contenu aux chapitres** via l'éditeur TipTap
3. **Réorganiser les modules/leçons** via l'interface
4. **Ajouter des exercices** en créant des items de type `exercise` ou `game`

## 🐛 Dépannage

### Erreur : "invalid input syntax for type uuid"

- Vérifiez que vous avez bien remplacé `'VOTRE_USER_ID'` par un UUID valide
- L'UUID doit être au format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Erreur : "violates foreign key constraint"

- Vérifiez que l'utilisateur avec l'UUID existe dans la table `profiles`
- Vérifiez que l'utilisateur a le rôle `admin` ou `instructor`

### Erreur : "relation does not exist"

- Vérifiez que toutes les tables existent (exécutez `supabase-schema.sql` et `add-chapters-schema.sql`)

### Le cours est créé mais vide

- Vérifiez les logs dans la console Supabase
- Le script utilise un bloc `DO $$` qui peut masquer certaines erreurs
- Essayez d'exécuter le script section par section

## 📝 Prochaines étapes

Une fois le cours créé :

1. **Ajouter le contenu** dans chaque chapitre via l'éditeur riche
2. **Créer des exercices** pour renforcer l'apprentissage
3. **Ajouter des ressources** (PDF, vidéos, liens externes)
4. **Tester le parcours** en vous inscrivant comme étudiant
5. **Publier le cours** (déjà en `published` mais vous pouvez le mettre en `draft` pour travailler dessus)

## 📚 Ressources

- [Documentation Supabase SQL](https://supabase.com/docs/guides/database)
- [Guide de chapitrage](./CHAPITRAGE.md)
- [Schéma de base de données](./supabase-schema.sql)

