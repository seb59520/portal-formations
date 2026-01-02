# Démarrage rapide : Sessions

## Problème

Votre table `sessions` est vide alors qu'un étudiant a soumis un exercice. C'est normal car :
1. **Les sessions doivent être créées manuellement** par un formateur/admin
2. **Les étudiants ne sont pas automatiquement liés à une session** lors de leur inscription

## Solution rapide (3 étapes)

### Étape 1 : Exécuter le script SQL de support des sessions

Exécutez `add-session-support.sql` dans l'interface SQL de Supabase. Ce script :
- Ajoute `session_id` aux tables `enrollments` et `submissions`
- Crée des triggers pour lier automatiquement les inscriptions et soumissions aux sessions
- Met à jour les données existantes

### Étape 2 : Créer une session de test

Exécutez `create-test-session.sql` dans l'interface SQL de Supabase. Ce script :
- Crée une organisation de test
- Crée une session pour votre premier cours
- Affiche les instructions pour ajouter des étudiants

### Étape 3 : Ajouter votre étudiant test à l'organisation

```sql
-- Remplacer 'USER_ID' par l'ID de votre étudiant test
INSERT INTO org_members (org_id, user_id, role)
SELECT 
  o.id,
  'USER_ID'::uuid,
  'student'
FROM orgs o
WHERE o.slug = 'test-org'
ON CONFLICT (org_id, user_id) DO NOTHING;
```

## Vérification

Après ces étapes, vérifiez que tout fonctionne :

```sql
-- Voir les sessions
SELECT * FROM sessions;

-- Voir les enrollments avec leur session
SELECT 
  e.id,
  p.full_name as student_name,
  c.title as course_title,
  s.title as session_title
FROM enrollments e
JOIN profiles p ON p.id = e.user_id
JOIN courses c ON c.id = e.course_id
LEFT JOIN sessions s ON s.id = e.session_id;

-- Voir les submissions avec leur session
SELECT 
  s.id,
  p.full_name as student_name,
  i.title as item_title,
  ses.title as session_title
FROM submissions s
JOIN profiles p ON p.id = s.user_id
JOIN items i ON i.id = s.item_id
LEFT JOIN sessions ses ON ses.id = s.session_id;
```

## Résultat attendu

Après ces étapes :
- ✅ Votre table `sessions` contiendra au moins une session
- ✅ Les enrollments existants seront liés à la session
- ✅ Les soumissions existantes seront liées à la session
- ✅ Les nouvelles soumissions seront automatiquement liées à la session
- ✅ Le dashboard formateur (`/trainer`) affichera les données

## Notes importantes

- **Les étudiants doivent être membres d'une organisation** pour être liés à une session
- **Une session doit être active** (`status = 'active'`) pour être utilisée automatiquement
- **Si plusieurs sessions existent pour un cours**, la plus récente est utilisée

