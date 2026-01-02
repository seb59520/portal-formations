# Guide : Héritage automatique des droits aux formations via les programmes

Ce guide explique comment fonctionne l'héritage automatique des droits d'accès aux formations lorsqu'un utilisateur est inscrit à un programme.

## 🎯 Principe

Lorsqu'un utilisateur est inscrit à un **programme**, il hérite automatiquement de l'accès à **toutes les formations** contenues dans ce programme.

## 🔧 Installation

### Étape 1 : Exécuter le script SQL

Exécutez le fichier `add-program-inheritance-triggers.sql` dans l'interface SQL de Supabase :

```sql
-- Ce script crée :
-- - Des triggers pour créer automatiquement les enrollments aux formations
-- - Des triggers pour mettre à jour les enrollments quand le statut change
-- - Des triggers pour révoquer les enrollments quand on retire l'accès au programme
-- - Une fonction helper pour vérifier l'accès via un programme
```

## 📋 Fonctionnement

### 1. Inscription à un programme

**Quand** : Un utilisateur est inscrit à un programme avec le statut `active`

**Action automatique** :
- ✅ Création automatique d'un `enrollment` pour chaque formation du programme
- ✅ Les enrollments sont créés avec le même statut que l'inscription au programme
- ✅ Si un enrollment existe déjà, il n'est pas dupliqué

**Exemple** :
```
Utilisateur inscrit au "Programme Développement Web"
  → Accès automatique à "Formation HTML/CSS"
  → Accès automatique à "Formation JavaScript"
  → Accès automatique à "Formation React"
```

### 2. Modification du statut d'inscription

**Quand** : Le statut d'inscription au programme change

**Actions automatiques** :
- **Statut passe à `active`** : Création/mise à jour des enrollments à `active`
- **Statut passe à `revoked` ou `pending`** : Révoque les enrollments (statut → `revoked`)

### 3. Retrait d'accès au programme

**Quand** : L'inscription au programme est supprimée

**Action automatique** :
- ✅ Révoque tous les enrollments aux formations du programme
- ✅ Les enrollments passent au statut `revoked`

### 4. Ajout d'une formation à un programme

**Quand** : Une nouvelle formation est ajoutée à un programme existant

**Action automatique** :
- ✅ Création automatique d'enrollments pour tous les utilisateurs déjà inscrits au programme
- ✅ Seulement pour les utilisateurs avec un statut `active`

## 🔍 Vérification d'accès

### Dans le code frontend

Les pages `CourseView` et `ItemView` vérifient maintenant l'accès de deux manières :

1. **Enrollment direct** : L'utilisateur est directement inscrit à la formation
2. **Accès via programme** : L'utilisateur est inscrit à un programme contenant la formation

### Logique de vérification

```typescript
// 1. Vérifier l'enrollment direct
const enrollment = await checkDirectEnrollment(userId, courseId)

// 2. Si pas d'enrollment direct, vérifier via programme
if (!enrollment) {
  const programAccess = await checkProgramAccess(userId, courseId)
  if (!programAccess) {
    // Accès refusé
  }
}
```

## 📊 Cas d'usage

### Cas 1 : Inscription à un programme

1. Admin crée un programme "Formation Complète API"
2. Admin ajoute 3 formations au programme
3. Admin inscrit un utilisateur au programme
4. ✅ **Automatiquement** : L'utilisateur a accès aux 3 formations

### Cas 2 : Ajout d'une formation à un programme existant

1. Programme "Formation Complète API" existe avec 2 utilisateurs inscrits
2. Admin ajoute une 4ème formation au programme
3. ✅ **Automatiquement** : Les 2 utilisateurs ont accès à la nouvelle formation

### Cas 3 : Révoquer l'accès au programme

1. Utilisateur est inscrit au programme "Formation Complète API"
2. Admin révoque l'accès (statut → `revoked`)
3. ✅ **Automatiquement** : Tous les enrollments aux formations sont révoqués

### Cas 4 : Suppression de l'inscription

1. Utilisateur est inscrit au programme "Formation Complète API"
2. Admin supprime complètement l'inscription
3. ✅ **Automatiquement** : Tous les enrollments aux formations sont révoqués

## ⚠️ Notes importantes

### Enrollments existants

- Si un enrollment existe déjà (créé manuellement), il n'est **pas écrasé**
- Les enrollments créés automatiquement ont `source: 'manual'`
- Les enrollments créés automatiquement ont `enrolled_at` = date d'inscription au programme

### Révoquation intelligente

- Seuls les enrollments créés **après** l'inscription au programme sont révoqués
- Les enrollments créés manuellement avant l'inscription au programme ne sont **pas** révoqués
- Cela permet de préserver les accès directs même si l'accès au programme est révoqué

### Performance

- Les triggers sont optimisés pour éviter les doublons
- Utilisation de `ON CONFLICT DO NOTHING` pour éviter les erreurs
- Les vérifications d'accès dans le frontend sont optimisées (2 requêtes max)

## 🐛 Dépannage

### Les enrollments ne sont pas créés automatiquement

**Vérifications** :
1. Les triggers sont-ils installés ? (vérifier dans Supabase)
2. Le statut de l'inscription au programme est-il `active` ?
3. Y a-t-il des erreurs dans les logs Supabase ?

**Solution** :
```sql
-- Vérifier que les triggers existent
SELECT * FROM pg_trigger WHERE tgname LIKE '%program%';

-- Tester manuellement la fonction
SELECT inherit_course_access_from_program();
```

### Les enrollments ne sont pas révoqués

**Vérifications** :
1. Le trigger `on_program_enrollment_deleted` existe-t-il ?
2. Les enrollments ont-ils été créés après l'inscription au programme ?

**Solution** :
```sql
-- Vérifier les enrollments d'un utilisateur
SELECT e.*, pe.enrolled_at as program_enrolled_at
FROM enrollments e
JOIN program_courses pc ON e.course_id = pc.course_id
JOIN program_enrollments pe ON pc.program_id = pe.program_id
WHERE e.user_id = 'user-uuid-here';
```

### Accès refusé même avec inscription au programme

**Vérifications** :
1. Le statut de l'inscription au programme est-il `active` ?
2. La formation est-elle bien dans le programme ?
3. Les triggers ont-ils bien créé les enrollments ?

**Solution** :
```sql
-- Vérifier l'accès via programme
SELECT 
  pe.id as program_enrollment_id,
  pe.status as program_status,
  pc.course_id,
  e.id as course_enrollment_id,
  e.status as course_enrollment_status
FROM program_enrollments pe
JOIN program_courses pc ON pe.program_id = pc.program_id
LEFT JOIN enrollments e ON e.user_id = pe.user_id AND e.course_id = pc.course_id
WHERE pe.user_id = 'user-uuid-here'
  AND pc.course_id = 'course-uuid-here';
```

## 📝 Exemples SQL

### Créer manuellement un enrollment pour tester

```sql
-- Inscrire un utilisateur à un programme
INSERT INTO program_enrollments (user_id, program_id, status)
VALUES ('user-uuid', 'program-uuid', 'active');

-- Les enrollments aux formations seront créés automatiquement
```

### Vérifier les enrollments créés automatiquement

```sql
-- Voir tous les enrollments créés via un programme
SELECT 
  e.*,
  c.title as course_title,
  p.title as program_title
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN program_courses pc ON c.id = pc.course_id
JOIN programs p ON pc.program_id = p.id
JOIN program_enrollments pe ON p.id = pe.program_id
WHERE e.user_id = pe.user_id
  AND e.source = 'manual'
  AND e.enrolled_at >= pe.enrolled_at;
```

## ✅ Checklist de vérification

- [ ] Les triggers sont installés (`add-program-inheritance-triggers.sql`)
- [ ] Les triggers fonctionnent (tester avec une inscription)
- [ ] Les enrollments sont créés automatiquement
- [ ] Les enrollments sont révoqués quand on retire l'accès
- [ ] L'accès via programme fonctionne dans `CourseView`
- [ ] L'accès via programme fonctionne dans `ItemView`

