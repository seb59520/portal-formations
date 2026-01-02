# Guide de configuration de la base Supabase

Ce guide vous explique comment configurer votre base de données Supabase pour que l'application fonctionne correctement.

## 📋 Informations de connexion

- **URL Supabase** : https://fsbeyfjzrhkozhlmssil.supabase.co
- **Mot de passe de base** : magTuj-2qorgu-bymfyp
- **Anon key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYmV5Zmp6cmhrb3pobG1zc2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMDU0ODQsImV4cCI6MjA4Mjg4MTQ4NH0.NRobIt5qn7fj-QPXvWmop7c4cbzBBIOmvMlv0HkePY4`

## 🚀 Étapes de configuration

### Étape 1 : Diagnostic de l'état actuel

1. Connectez-vous à votre projet Supabase : https://fsbeyfjzrhkozhlmssil.supabase.co
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **New query**
4. Copiez-collez le contenu du fichier `diagnostic-schema-complet.sql`
5. Cliquez sur **Run** (ou `Ctrl/Cmd + Enter`)

**Résultat attendu** : Vous verrez plusieurs tableaux montrant :
- ✅ Les tables qui existent déjà
- ❌ Les tables qui manquent
- Les colonnes de chaque table
- Les indexes, RLS, politiques, fonctions, triggers

**📝 Note** : Copiez les résultats et partagez-les avec moi si vous avez besoin d'aide pour interpréter les résultats.

### Étape 2 : Créer les tables manquantes

1. Dans le **SQL Editor** de Supabase
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `creer-tables-manquantes.sql`
4. Cliquez sur **Run**

**Résultat attendu** : 
- Des messages `NOTICE` indiquant quelles tables ont été créées
- Un tableau récapitulatif montrant le statut de chaque table

**⚠️ Important** : Ce script ne supprime pas les tables existantes, il crée uniquement celles qui manquent.

### Étape 3 : Créer toutes les tables d'un coup (alternative)

Si vous préférez créer toutes les tables d'un coup (même si certaines existent déjà) :

1. Dans le **SQL Editor** de Supabase
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`
4. Cliquez sur **Run**

**⚠️ Note** : Ce script utilise `CREATE TABLE IF NOT EXISTS`, donc il ne créera pas de doublons.

### Étape 4 : Configurer les politiques RLS

Après avoir créé les tables, vous devez configurer les politiques RLS (Row Level Security) pour que les utilisateurs puissent accéder aux données.

Exécutez ces fichiers dans l'ordre :

1. **`supabase-schema.sql`** - Politiques pour les tables de base
2. **`add-programs-schema.sql`** - Politiques pour les programmes
3. **`add-chapters-schema.sql`** - Politiques pour les chapitres
4. **`trainer-schema.sql`** - Politiques pour orgs, sessions, etc.
5. **`game-format-files-schema.sql`** - Politiques pour les jeux
6. **`add-user-settings-schema.sql`** - Politiques pour les paramètres
7. **`fix-orgs-rls-policies.sql`** - Corrections des politiques orgs
8. **`fix-sessions-rls-for-admins.sql`** - Politiques sessions pour admins
9. **`add-session-support.sql`** - Triggers et fonctions pour les sessions

**📝 Note** : Certains de ces fichiers créent aussi des tables. Si vous avez déjà exécuté `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`, vous pouvez ignorer les parties `CREATE TABLE` et exécuter uniquement les parties `CREATE POLICY`.

### Étape 5 : Créer les indexes (optionnel)

Les indexes sont déjà inclus dans `SCHEMA-COMPLET-TOUTES-LES-TABLES.sql`. Si vous avez créé les tables manuellement, vérifiez que tous les indexes existent en exécutant la section "PARTIE 7 : INDEXES" du fichier consolidé.

### Étape 6 : Vérification finale

Exécutez à nouveau `diagnostic-schema-complet.sql` pour vérifier que tout est en place :

- ✅ Toutes les 22 tables doivent exister
- ✅ Toutes les colonnes doivent être présentes
- ✅ RLS doit être activé sur toutes les tables
- ✅ Les politiques RLS doivent être créées
- ✅ Les fonctions et triggers doivent exister

## 🔍 Vérification rapide

Exécutez cette requête pour voir rapidement l'état de vos tables :

```sql
SELECT 
  table_name AS "Table",
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN '✅' 
    ELSE '❌' 
  END AS "Statut"
FROM (VALUES
  ('profiles'), ('courses'), ('modules'), ('items'), ('enrollments'), ('submissions'), ('game_scores'),
  ('programs'), ('program_courses'), ('program_enrollments'),
  ('chapters'),
  ('orgs'), ('org_members'), ('sessions'), ('exercises'), ('exercise_attempts'), ('module_progress'), 
  ('activity_events'), ('trainer_notes'),
  ('game_attempts'), ('game_progress'),
  ('user_settings')
) AS t(table_name)
ORDER BY t.table_name;
```

## 📊 Liste complète des 22 tables

Voir le fichier `LISTE-TOUTES-LES-TABLES.md` pour la liste détaillée avec descriptions.

## ⚠️ Problèmes courants

### Erreur : "relation already exists"
- **Cause** : La table existe déjà
- **Solution** : Utilisez `CREATE TABLE IF NOT EXISTS` ou supprimez d'abord la table si vous voulez la recréer

### Erreur : "permission denied"
- **Cause** : Vous n'avez pas les permissions nécessaires
- **Solution** : Vérifiez que vous êtes connecté en tant qu'administrateur du projet Supabase

### Erreur : "foreign key constraint"
- **Cause** : Vous essayez de créer une table qui référence une table qui n'existe pas encore
- **Solution** : Créez les tables dans l'ordre (profiles → courses → modules → items, etc.)

### Erreur : "function already exists"
- **Cause** : La fonction existe déjà
- **Solution** : Utilisez `CREATE OR REPLACE FUNCTION` au lieu de `CREATE FUNCTION`

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Exécutez `diagnostic-schema-complet.sql` et partagez les résultats
2. Copiez le message d'erreur exact
3. Indiquez quelle étape vous avez atteinte

Je pourrai alors vous aider à résoudre le problème spécifique.

## 📝 Notes de sécurité

⚠️ **Important** : Ne partagez jamais votre mot de passe de base ou votre service_role key publiquement. Les informations partagées ici sont pour votre usage personnel uniquement.

Pour la production, utilisez des variables d'environnement et ne commitez jamais les clés dans votre dépôt Git.

