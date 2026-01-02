# Guide de gestion des utilisateurs

Ce guide explique comment utiliser la fonctionnalité de gestion des utilisateurs depuis l'interface d'administration.

## 📋 Prérequis

1. Avoir un compte avec le rôle **admin** dans l'application
2. Avoir exécuté le script SQL `create-user-function.sql` dans Supabase
3. (Optionnel) Désactiver la confirmation email dans Supabase pour créer des utilisateurs sans email de confirmation

## 🚀 Configuration initiale

### 1. Exécuter le script SQL

Exécutez le fichier `create-user-function.sql` dans l'éditeur SQL de Supabase. Ce script crée :

- La fonction `update_user_role` : permet aux admins de modifier les rôles des utilisateurs
- La fonction `create_profile_with_role` : permet aux admins de créer des profils avec un rôle spécifique
- Les policies RLS nécessaires pour permettre aux admins de gérer les profils

### 2. (Optionnel) Désactiver la confirmation email

Pour créer des utilisateurs sans qu'ils aient besoin de confirmer leur email :

1. Allez dans **Supabase Dashboard** → **Authentication** → **Settings**
2. Désactivez **"Enable email confirmations"** dans la section **Email Auth**
3. Sauvegardez les modifications

⚠️ **Note de sécurité** : Désactiver la confirmation email réduit la sécurité. Utilisez cette option uniquement dans un environnement de développement ou si vous avez d'autres mesures de sécurité en place.

### 3. Alternative : Utiliser une Edge Function

Pour une solution plus sécurisée en production, créez une Edge Function Supabase qui utilise l'API Admin pour créer des utilisateurs. Cette approche permet de :

- Créer des utilisateurs sans confirmation email
- Utiliser la clé service_role de manière sécurisée (côté serveur uniquement)
- Contrôler plus finement les permissions

## 📖 Utilisation

### Accéder à la page de gestion

1. Connectez-vous avec un compte admin
2. Accédez à `/admin/users` dans votre navigateur
3. Vous verrez la liste de tous les utilisateurs

### Créer un nouvel utilisateur

1. Cliquez sur le bouton **"Créer un utilisateur"**
2. Remplissez le formulaire :
   - **Email** : L'adresse email de l'utilisateur (requis)
   - **Mot de passe** : Le mot de passe initial (minimum 6 caractères, requis)
   - **Nom complet** : Le nom de l'utilisateur (optionnel)
   - **Rôle** : Sélectionnez le rôle (Étudiant, Formateur, ou Administrateur)
3. Cliquez sur **"Créer l'utilisateur"**

### Modifier le rôle d'un utilisateur

1. Dans la liste des utilisateurs, trouvez l'utilisateur concerné
2. Cliquez sur le menu déroulant dans la colonne **"Rôle"**
3. Sélectionnez le nouveau rôle
4. Confirmez la modification

### Supprimer un utilisateur

1. Dans la liste des utilisateurs, trouvez l'utilisateur à supprimer
2. Cliquez sur l'icône de poubelle dans la colonne **"Actions"**
3. Confirmez la suppression

⚠️ **Attention** : La suppression supprime uniquement le profil. Pour supprimer complètement l'utilisateur de Supabase Auth, vous devez utiliser l'API Admin ou l'interface Supabase.

### Rechercher un utilisateur

Utilisez la barre de recherche en haut de la page pour filtrer les utilisateurs par nom ou ID.

## 🔐 Rôles disponibles

- **Étudiant (student)** : Accès aux formations publiées
- **Formateur (instructor)** : Peut créer et gérer des formations
- **Administrateur (admin)** : Accès complet à toutes les fonctionnalités, y compris la gestion des utilisateurs

## 🛠️ Dépannage

### L'utilisateur est créé mais le rôle n'est pas correct

Si l'utilisateur est créé mais que le rôle n'est pas celui attendu :

1. Vérifiez que le script SQL a bien été exécuté
2. Vérifiez que vous avez bien le rôle admin
3. Essayez de modifier le rôle manuellement via le menu déroulant

### Erreur lors de la création d'un utilisateur

Si vous obtenez une erreur lors de la création :

1. Vérifiez que l'email n'est pas déjà utilisé
2. Vérifiez que le mot de passe respecte les critères (minimum 6 caractères)
3. Vérifiez les logs de la console pour plus de détails
4. Si la confirmation email est activée, l'utilisateur devra confirmer son email avant de pouvoir se connecter

### Les policies RLS bloquent les opérations

Si vous obtenez des erreurs de permissions :

1. Vérifiez que vous avez bien le rôle admin dans la table `profiles`
2. Vérifiez que les policies RLS ont bien été créées (voir `create-user-function.sql`)
3. Exécutez à nouveau le script SQL si nécessaire

## 📝 Notes importantes

- La création d'utilisateurs via `signUp` nécessite que l'email confirmation soit désactivée ou que l'utilisateur confirme son email
- Pour une solution de production, envisagez d'utiliser une Edge Function Supabase avec l'API Admin
- La suppression d'un utilisateur ne supprime que le profil, pas l'utilisateur dans `auth.users`
- Les utilisateurs créés manuellement par un admin peuvent se connecter immédiatement si l'email confirmation est désactivée

## 🔗 Liens utiles

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)

