# Liste complète de toutes les tables nécessaires

Ce document liste toutes les tables que vous devez créer pour que l'application fonctionne correctement.

## 📊 Résumé

**Total : 22 tables**

## 📋 Liste détaillée des tables

### 1. Tables de base (7 tables)

#### 1. `profiles`
- **Description** : Profils utilisateurs (liés à `auth.users`)
- **Colonnes principales** : `id`, `role`, `full_name`, `created_at`
- **Fichier source** : `supabase-schema.sql`

#### 2. `courses`
- **Description** : Cours/formations disponibles
- **Colonnes principales** : `id`, `title`, `description`, `status`, `access_type`, `price_cents`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `supabase-schema.sql`

#### 3. `modules`
- **Description** : Modules contenus dans les cours
- **Colonnes principales** : `id`, `course_id`, `title`, `position`, `created_at`
- **Fichier source** : `supabase-schema.sql`

#### 4. `items`
- **Description** : Items/leçons contenus dans les modules (ressources, slides, exercices, TP, jeux)
- **Colonnes principales** : `id`, `module_id`, `type`, `title`, `content` (JSONB), `position`, `published`, `created_at`, `updated_at`
- **Fichier source** : `supabase-schema.sql`

#### 5. `enrollments`
- **Description** : Inscriptions des utilisateurs aux cours
- **Colonnes principales** : `id`, `user_id`, `course_id`, `status`, `source`, `enrolled_at`, `session_id`
- **Fichier source** : `supabase-schema.sql` + `add-session-support.sql`

#### 6. `submissions`
- **Description** : Soumissions/réponses des étudiants aux exercices
- **Colonnes principales** : `id`, `user_id`, `item_id`, `answer_text`, `answer_json`, `file_path`, `status`, `grade`, `submitted_at`, `graded_at`, `session_id`
- **Fichier source** : `supabase-schema.sql` + `add-session-support.sql`

#### 7. `game_scores`
- **Description** : Scores des jeux
- **Colonnes principales** : `id`, `user_id`, `course_id`, `item_id`, `score`, `metadata`, `created_at`
- **Fichier source** : `supabase-schema.sql`

---

### 2. Tables pour les programmes (3 tables)

#### 8. `programs`
- **Description** : Programmes (regroupements de formations)
- **Colonnes principales** : `id`, `title`, `description`, `status`, `access_type`, `price_cents`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `add-programs-schema.sql`

#### 9. `program_courses`
- **Description** : Liaison entre programmes et cours (avec ordre)
- **Colonnes principales** : `id`, `program_id`, `course_id`, `position`, `created_at`
- **Fichier source** : `add-programs-schema.sql`

#### 10. `program_enrollments`
- **Description** : Inscriptions aux programmes
- **Colonnes principales** : `id`, `user_id`, `program_id`, `status`, `source`, `enrolled_at`
- **Fichier source** : `add-programs-schema.sql`

---

### 3. Tables pour les chapitres (1 table)

#### 11. `chapters`
- **Description** : Chapitres contenus dans les items/leçons
- **Colonnes principales** : `id`, `item_id`, `title`, `content` (JSONB), `position`, `created_at`, `updated_at`
- **Fichier source** : `add-chapters-schema.sql`

---

### 4. Tables pour les organisations et sessions (7 tables)

#### 12. `orgs`
- **Description** : Organisations (multi-tenant)
- **Colonnes principales** : `id`, `name`, `slug`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 13. `org_members`
- **Description** : Membres des organisations (rôles par organisation)
- **Colonnes principales** : `id`, `org_id`, `user_id`, `role`, `display_name`, `created_at`
- **Fichier source** : `trainer-schema.sql`

#### 14. `sessions`
- **Description** : Sessions de formation (groupes de formation)
- **Colonnes principales** : `id`, `org_id`, `course_id`, `title`, `start_date`, `end_date`, `status`, `created_by`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 15. `exercises`
- **Description** : Détails des exercices (pour les items de type 'exercise')
- **Colonnes principales** : `id`, `item_id`, `type`, `correct_answer` (JSONB), `max_attempts`, `passing_score`, `metadata`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 16. `exercise_attempts`
- **Description** : Tentatives d'exercices (historique des tentatives)
- **Colonnes principales** : `id`, `user_id`, `exercise_id`, `session_id`, `answer_text`, `answer_json`, `score`, `is_correct`, `feedback`, `attempt_number`, `submitted_at`
- **Fichier source** : `trainer-schema.sql`

#### 17. `module_progress`
- **Description** : Progression des utilisateurs par module
- **Colonnes principales** : `id`, `user_id`, `module_id`, `session_id`, `percent`, `completed_at`, `started_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

#### 18. `activity_events`
- **Description** : Événements d'activité (tracking des actions utilisateurs)
- **Colonnes principales** : `id`, `user_id`, `session_id`, `course_id`, `module_id`, `item_id`, `event_type`, `metadata`, `created_at`
- **Fichier source** : `trainer-schema.sql`

#### 19. `trainer_notes`
- **Description** : Notes privées des formateurs
- **Colonnes principales** : `id`, `trainer_id`, `org_id`, `course_id`, `module_id`, `session_id`, `user_id`, `title`, `content`, `tags`, `is_private`, `created_at`, `updated_at`
- **Fichier source** : `trainer-schema.sql`

---

### 5. Tables pour les jeux (2 tables)

#### 20. `game_attempts`
- **Description** : Historique de toutes les tentatives de jeu
- **Colonnes principales** : `id`, `user_id`, `game_type`, `level`, `score`, `total`, `percentage`, `badge`, `wrong_ids`, `created_at`
- **Fichier source** : `game-format-files-schema.sql`

#### 21. `game_progress`
- **Description** : Progression par niveau (meilleur score et dernier score)
- **Colonnes principales** : `id`, `user_id`, `game_type`, `level`, `best_score`, `best_badge`, `last_score`, `last_badge`, `updated_at`
- **Fichier source** : `game-format-files-schema.sql`

---

### 6. Tables pour les paramètres (1 table)

#### 22. `user_settings`
- **Description** : Paramètres utilisateur (zoom PDF, thème, taille de police, etc.)
- **Colonnes principales** : `id`, `user_id`, `pdf_zoom`, `theme`, `font_size`, `layout_preferences` (JSONB), `created_at`, `updated_at`
- **Fichier source** : `add-user-settings-schema.sql`

---

## 🚀 Comment créer toutes les tables

### Option 1 : Utiliser le fichier consolidé (recommandé)

Exécutez le fichier `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql` dans l'interface SQL de Supabase. Ce fichier contient :
- ✅ Toutes les 22 tables
- ✅ Tous les indexes
- ✅ Toutes les fonctions
- ✅ Tous les triggers
- ✅ Activation du RLS sur toutes les tables

**⚠️ Important** : Après avoir exécuté ce fichier, vous devrez également exécuter les fichiers de politiques RLS pour configurer les permissions :
- `supabase-schema.sql` (politiques pour les tables de base)
- `add-programs-schema.sql` (politiques pour les programmes)
- `add-chapters-schema.sql` (politiques pour les chapitres)
- `trainer-schema.sql` (politiques pour orgs, sessions, etc.)
- `game-format-files-schema.sql` (politiques pour les jeux)
- `add-user-settings-schema.sql` (politiques pour les paramètres)
- `fix-orgs-rls-policies.sql` (corrections des politiques orgs)
- `fix-sessions-rls-for-admins.sql` (politiques sessions pour admins)

### Option 2 : Exécuter les fichiers dans l'ordre

1. `supabase-schema.sql` (tables de base)
2. `add-programs-schema.sql` (programmes)
3. `add-chapters-schema.sql` (chapitres)
4. `trainer-schema.sql` (organisations et sessions)
5. `add-session-support.sql` (ajout de session_id aux tables)
6. `game-format-files-schema.sql` (jeux)
7. `add-user-settings-schema.sql` (paramètres utilisateur)
8. `fix-orgs-rls-policies.sql` (corrections politiques)
9. `fix-sessions-rls-for-admins.sql` (politiques sessions)

---

## 📝 Notes importantes

1. **Dépendances** : Les tables doivent être créées dans l'ordre car certaines référencent d'autres tables (clés étrangères).

2. **RLS (Row Level Security)** : Toutes les tables ont RLS activé. Assurez-vous d'exécuter les fichiers de politiques pour que les utilisateurs puissent accéder aux données.

3. **Triggers** : Plusieurs triggers sont créés automatiquement :
   - Création automatique de profil lors de l'inscription
   - Mise à jour automatique de `updated_at`
   - Attribution automatique de `session_id` dans enrollments et submissions

4. **Fonctions** : Plusieurs fonctions sont créées pour :
   - Vérifier si un utilisateur est admin
   - Déterminer la session d'un utilisateur pour un cours
   - Obtenir les modules d'un programme
   - Obtenir le meilleur score d'un jeu

5. **Indexes** : Tous les indexes nécessaires sont créés pour optimiser les performances.

---

## ✅ Vérification

Pour vérifier que toutes les tables ont été créées, exécutez cette requête :

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'profiles', 'courses', 'modules', 'items', 'enrollments', 'submissions', 'game_scores',
    'programs', 'program_courses', 'program_enrollments',
    'chapters',
    'orgs', 'org_members', 'sessions', 'exercises', 'exercise_attempts', 'module_progress', 'activity_events', 'trainer_notes',
    'game_attempts', 'game_progress',
    'user_settings'
  )
ORDER BY table_name;
```

Vous devriez voir 22 tables listées.

