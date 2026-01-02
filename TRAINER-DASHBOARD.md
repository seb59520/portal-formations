# Dashboard Formateur - Guide d'installation et d'utilisation

## Vue d'ensemble

Le dashboard Formateur est un système complet de suivi et d'analyse pour les formateurs et administrateurs. Il permet de :

- Visualiser les KPIs en temps réel (apprenants actifs, taux de complétion, scores moyens)
- Suivre la progression des apprenants par session
- Analyser les modules et exercices en difficulté
- Gérer des notes privées par formateur

## Prérequis

- Node.js 18+ et npm
- Un projet Supabase configuré
- Les variables d'environnement Supabase configurées (voir `.env.example`)

## Installation

### 1. Exécuter le schéma SQL

Exécutez le fichier `trainer-schema.sql` dans l'interface SQL de Supabase pour créer les tables nécessaires :

```sql
-- Exécuter trainer-schema.sql dans Supabase SQL Editor
```

Ce schéma crée les tables suivantes :
- `orgs` : Organisations
- `org_members` : Membres d'organisation avec rôles
- `sessions` : Sessions de formation
- `exercises` : Détails des exercices
- `exercise_attempts` : Tentatives d'exercices
- `module_progress` : Progression par module
- `activity_events` : Événements d'activité
- `trainer_notes` : Notes privées formateur

### 2. Configuration des variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 3. Installation des dépendances

```bash
npm install
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

## Structure du code

```
src/
├── components/
│   └── trainer/
│       ├── KPICard.tsx          # Carte KPI réutilisable
│       ├── AlertCard.tsx         # Carte d'alerte
│       ├── LearnersTable.tsx     # Table des apprenants
│       └── TrainerRouteGuard.tsx # Guard de route pour formateurs
├── pages/
│   └── trainer/
│       ├── TrainerDashboard.tsx  # Page principale (/trainer)
│       ├── SessionLearners.tsx   # Liste apprenants (/trainer/session/:id)
│       ├── SessionAnalytics.tsx  # Analyses (/trainer/analytics/:id)
│       └── TrainerNotes.tsx      # Notes privées (/trainer/notes)
├── lib/
│   └── queries/
│       └── trainerQueries.ts    # Toutes les requêtes Supabase
└── utils/
    └── trainerUtils.ts           # Utilitaires (format, dates, etc.)
```

## Utilisation

### Accès au dashboard

1. Connectez-vous avec un compte ayant le rôle `trainer` ou `admin` dans `org_members`
2. Accédez à `/trainer`

### Pages disponibles

#### 1. Dashboard principal (`/trainer`)

Affiche :
- **KPIs** : Apprenants actifs (7j), taux de complétion, score moyen, modules en difficulté
- **Alertes** : Notifications automatiques (apprenants inactifs, modules en difficulté, etc.)
- **Actions rapides** : Liens vers les autres pages

#### 2. Liste des apprenants (`/trainer/session/:sessionId`)

Affiche pour chaque apprenant :
- Nom d'affichage
- Pourcentage de complétion
- Score moyen
- Dernière activité
- Blocage principal

Actions disponibles :
- **Relancer** : Envoyer un rappel (à implémenter)
- **Ressource** : Assigner une ressource (à implémenter)
- **Note** : Ajouter une note privée

#### 3. Analyses détaillées (`/trainer/analytics/:sessionId`)

Deux onglets :

**Modules en difficulté** :
- Taux d'abandon
- Temps moyen de complétion
- Score moyen

**Exercices** :
- Taux d'échec
- Score moyen
- Erreurs fréquentes

#### 4. Notes privées (`/trainer/notes`)

CRUD complet pour les notes privées :
- Créer, modifier, supprimer
- Filtrer par course, module, session, utilisateur
- Tags pour organisation
- Notes privées par défaut

## Requêtes Supabase

Toutes les requêtes sont centralisées dans `src/lib/queries/trainerQueries.ts` :

- `getTrainerContext()` : Récupère l'org et le rôle du formateur
- `getSessions(orgId)` : Liste des sessions actives
- `getSessionKPIs(sessionId)` : KPIs d'une session
- `getLearnersTable(sessionId)` : Table des apprenants
- `getModuleAnalytics(sessionId)` : Analytics des modules
- `getExerciseAnalytics(sessionId)` : Analytics des exercices
- `getTrainerNotes()` : Liste des notes
- `createTrainerNote()` : Créer une note
- `updateTrainerNote()` : Modifier une note
- `deleteTrainerNote()` : Supprimer une note

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont des policies RLS activées :
- Les formateurs peuvent voir les données de leur organisation
- Les apprenants ne peuvent voir que leurs propres données
- Les admins peuvent tout voir

### Route Guards

Le composant `TrainerRouteGuard` vérifie :
- L'authentification de l'utilisateur
- Le rôle dans `org_members` (doit être `trainer` ou `admin`)
- Redirige vers `/login` ou affiche "Accès refusé" si non autorisé

## Données de test

Pour tester le dashboard, vous devez :

1. **Créer une organisation** :
```sql
INSERT INTO orgs (id, name, slug) VALUES
  (gen_random_uuid(), 'Organisation Test', 'org-test');
```

2. **Créer un membre formateur** :
```sql
-- Remplacez USER_ID par l'ID d'un utilisateur existant
INSERT INTO org_members (org_id, user_id, role, display_name)
SELECT 
  (SELECT id FROM orgs LIMIT 1),
  'USER_ID',
  'trainer',
  'Formateur Test';
```

3. **Créer une session** :
```sql
-- Remplacez COURSE_ID et USER_ID
INSERT INTO sessions (org_id, course_id, title, status, created_by)
SELECT 
  (SELECT id FROM orgs LIMIT 1),
  'COURSE_ID',
  'Session Test',
  'active',
  'USER_ID';
```

## Optimisations possibles

### Vues SQL (optionnel)

Pour améliorer les performances, vous pouvez créer des vues SQL :

```sql
-- Vue pour les KPIs de session
CREATE VIEW session_kpis_view AS
SELECT 
  s.id as session_id,
  COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '7 days') as active_learners_7d,
  -- ... autres calculs
FROM sessions s
LEFT JOIN activity_events ae ON ae.session_id = s.id
GROUP BY s.id;
```

### Pagination

Les requêtes actuelles chargent toutes les données. Pour de grandes sessions, ajoutez la pagination :

```typescript
const { data, error } = await supabase
  .from('learners')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

## Dépannage

### Erreur "Aucune organisation trouvée"

- Vérifiez que l'utilisateur a un enregistrement dans `org_members` avec le rôle `trainer` ou `admin`

### Erreur "Accès refusé"

- Vérifiez les policies RLS dans Supabase
- Vérifiez que l'utilisateur est bien authentifié

### Données vides

- Vérifiez que les sessions existent et sont actives
- Vérifiez que les enrollments sont liés aux bons cours
- Vérifiez que les activity_events sont créés lors des interactions

## Prochaines étapes

- [ ] Implémenter la relance par email
- [ ] Implémenter l'assignation de ressources
- [ ] Ajouter des graphiques (Chart.js ou Recharts)
- [ ] Exporter les données en CSV/Excel
- [ ] Notifications en temps réel (Supabase Realtime)
- [ ] Mode offline (PWA)

## Support

Pour toute question ou problème, consultez la documentation Supabase ou ouvrez une issue.

