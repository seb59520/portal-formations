# Guide : Création et gestion des sessions

## Problème identifié

Les étudiants peuvent soumettre des exercices, mais la table `sessions` est vide car :
1. **Les sessions doivent être créées manuellement** par un formateur/admin
2. **Les étudiants ne sont pas automatiquement liés à une session** lors de leur inscription à une formation
3. **Les soumissions d'exercices ne sont pas liées à une session** par défaut

## Solution implémentée

### 1. Ajout de `session_id` aux tables existantes

- **`enrollments`** : Ajout de la colonne `session_id` pour lier les inscriptions aux sessions
- **`submissions`** : Ajout de la colonne `session_id` pour lier les soumissions aux sessions

### 2. Attribution automatique de session

Un système automatique a été mis en place :
- Quand un étudiant s'inscrit à une formation (`enrollments`), le système cherche automatiquement une session active pour ce cours et l'organisation de l'étudiant
- Quand un étudiant soumet un exercice (`submissions`), le système lie automatiquement la soumission à la session correspondante

### 3. Fonction `get_user_session_for_course()`

Cette fonction détermine automatiquement la session d'un utilisateur pour un cours donné :
- Cherche l'organisation de l'utilisateur via `org_members`
- Trouve une session active pour ce cours et cette organisation
- Retourne la session la plus récente si plusieurs existent

## Comment créer une session

### Option 1 : Via SQL (pour tester rapidement)

```sql
-- 1. Créer une organisation si elle n'existe pas
INSERT INTO orgs (name, slug)
VALUES ('Mon Organisation', 'mon-org')
ON CONFLICT (slug) DO NOTHING;

-- 2. Créer une session pour un cours
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  o.id,
  'VOTRE_COURSE_ID'::uuid,
  'Session de test - ' || c.title,
  'active',
  'VOTRE_USER_ID'::uuid
FROM orgs o
CROSS JOIN courses c
WHERE o.slug = 'mon-org'
  AND c.id = 'VOTRE_COURSE_ID'::uuid
LIMIT 1;
```

### Option 2 : Via l'interface (à implémenter)

Une interface de création de sessions devrait être ajoutée dans le portail formateur (`/trainer`).

## Workflow recommandé

1. **Créer une organisation** (si pas déjà fait)
   - Via SQL ou interface admin

2. **Ajouter des membres à l'organisation**
   ```sql
   INSERT INTO org_members (org_id, user_id, role)
   VALUES ('ORG_ID', 'USER_ID', 'student');
   ```

3. **Créer une session pour un cours**
   ```sql
   INSERT INTO sessions (org_id, course_id, title, status, created_by)
   VALUES ('ORG_ID', 'COURSE_ID', 'Session Automne 2024', 'active', 'TRAINER_ID');
   ```

4. **Les étudiants peuvent maintenant :**
   - S'inscrire à la formation (via `enrollments`)
   - Leur inscription sera automatiquement liée à la session
   - Leurs soumissions seront automatiquement liées à la session

## Vérification

Pour vérifier que tout fonctionne :

```sql
-- Voir les sessions
SELECT * FROM sessions;

-- Voir les enrollments avec leur session
SELECT e.*, s.title as session_title
FROM enrollments e
LEFT JOIN sessions s ON s.id = e.session_id;

-- Voir les submissions avec leur session
SELECT s.*, ses.title as session_title
FROM submissions s
LEFT JOIN sessions ses ON ses.id = s.session_id;
```

## Notes importantes

- **Les sessions sont optionnelles** : Si un étudiant n'a pas de session, il peut quand même soumettre des exercices, mais ils ne seront pas visibles dans le dashboard formateur
- **Une session doit être liée à une organisation** : Les étudiants doivent être membres de l'organisation pour être liés à la session
- **Le statut de la session** : Seules les sessions avec `status = 'active'` sont utilisées pour l'attribution automatique

