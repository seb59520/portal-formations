# Guide : Utiliser l'interface pour créer et gérer des programmes

Ce guide explique comment utiliser l'interface admin pour créer des programmes (fusion de formations) et gérer les accès.

## 📋 Prérequis

1. **Avoir exécuté le schéma SQL** : Assurez-vous d'avoir exécuté `add-programs-schema.sql` dans Supabase
2. **Avoir un compte admin** : Vous devez être connecté avec un compte ayant le rôle `admin`
3. **Avoir des formations existantes** : Vous devez avoir au moins une formation créée pour pouvoir l'ajouter à un programme

## 🚀 Créer un programme

### Étape 1 : Accéder à la page des programmes

1. Connectez-vous avec un compte **admin**
2. Cliquez sur **"Administration"** dans le header
3. Cliquez sur le bouton **"Programmes"** dans la barre d'outils
4. Vous arrivez sur la page `/admin/programs`

### Étape 2 : Créer un nouveau programme

1. Cliquez sur le bouton **"Nouveau programme"** (en haut à droite)
2. Vous êtes redirigé vers `/admin/programs/new`

### Étape 3 : Remplir les informations générales

Dans la section **"Informations générales"** :

- **Titre** * (obligatoire) : Le nom de votre programme
- **Description** : Une description du programme
- **Statut** :
  - `Brouillon` : Le programme n'est pas visible par les utilisateurs
  - `Publié` : Le programme est visible et accessible
- **Type d'accès** :
  - `Gratuit` : Accès libre
  - `Payant` : Accès payant (nécessite un prix)
  - `Sur invitation` : Accès sur invitation uniquement
- **Prix** (si payant) : Le prix en centimes (ex: 5000 = 50€)

### Étape 4 : Ajouter des formations au programme

1. Dans la section **"Formations du programme"**, cliquez sur **"Ajouter des formations"**
2. Une modal s'ouvre avec la liste des formations disponibles
3. Cochez les formations que vous souhaitez ajouter au programme
4. Cliquez sur **"Ajouter X formation(s)"**
5. Les formations apparaissent dans la liste, dans l'ordre d'ajout

### Étape 5 : Réorganiser l'ordre des formations

Une fois les formations ajoutées, vous pouvez réorganiser leur ordre :

- Utilisez les flèches **↑** et **↓** à gauche de chaque formation pour la déplacer
- L'ordre défini ici sera l'ordre dans lequel les formations apparaîtront dans le programme

### Étape 6 : Sauvegarder le programme

1. Cliquez sur le bouton **"Sauvegarder"** (en haut à droite)
2. Le programme est créé et vous êtes redirigé vers la page d'édition avec l'ID du programme

## 👥 Gérer les accès au programme

### Accéder à la gestion des accès

1. Depuis la liste des programmes (`/admin/programs`)
2. Cliquez sur le bouton **"Accès"** à côté du programme
3. Vous arrivez sur `/admin/programs/{programId}/enrollments`

### Ajouter des personnes

1. Cliquez sur **"Ajouter des personnes"**
2. Une modal s'ouvre avec la liste des utilisateurs disponibles
3. Utilisez la barre de recherche pour filtrer les utilisateurs
4. Cochez les personnes à qui vous souhaitez donner accès
5. Cliquez sur **"Ajouter X personne(s)"**

### Gérer les statuts d'accès

Pour chaque personne ayant accès, vous pouvez modifier son statut :

- **Actif** : La personne a accès au programme
- **En attente** : L'accès est en attente de validation
- **Révoqué** : L'accès a été révoqué

Utilisez le menu déroulant à droite de chaque personne pour changer le statut.

### Retirer l'accès

1. Cliquez sur l'icône **X** à droite de la personne
2. Confirmez la suppression
3. La personne perd l'accès au programme

## ✏️ Modifier un programme existant

1. Depuis la liste des programmes, cliquez sur **"Modifier"** à côté du programme
2. Vous pouvez :
   - Modifier les informations générales (titre, description, statut, etc.)
   - Ajouter ou retirer des formations
   - Réorganiser l'ordre des formations
3. Cliquez sur **"Sauvegarder"** pour enregistrer les modifications

## 🔍 Fonctionnalités avancées

### Rechercher des personnes

Dans la page de gestion des accès, utilisez la barre de recherche en haut pour filtrer les personnes ayant accès au programme.

### Dupliquer un programme

1. Depuis la liste des programmes, cliquez sur l'icône **📋** à côté du programme
2. Un nouveau programme est créé avec le même titre suivi de "(Copie)"
3. Vous pouvez ensuite le modifier comme vous le souhaitez

### Supprimer un programme

1. Depuis la liste des programmes, cliquez sur l'icône **🗑️** à côté du programme
2. Confirmez la suppression
3. ⚠️ **Attention** : Cette action supprime également toutes les associations avec les formations et toutes les inscriptions

## 📊 Structure des données

Un programme est composé de :

- **Informations du programme** : titre, description, statut, type d'accès, prix
- **Formations associées** : liste de formations avec un ordre défini (position)
- **Inscriptions** : liste des personnes ayant accès au programme avec leur statut

## 🐛 Dépannage

### Erreur : "Le titre est obligatoire"
- Assurez-vous d'avoir rempli le champ "Titre" avant de sauvegarder

### Erreur : "Veuillez sélectionner au moins une formation"
- Vous devez ajouter au moins une formation au programme avant de sauvegarder

### Les formations ne s'affichent pas dans la modal
- Vérifiez que vous avez bien créé des formations au préalable
- Les formations déjà ajoutées au programme n'apparaissent pas dans la liste disponible

### Impossible de réorganiser l'ordre
- Assurez-vous d'avoir sauvegardé le programme au moins une fois
- Les formations temporaires (non sauvegardées) peuvent avoir des problèmes d'ordre

## 📝 Notes importantes

- **Les formations restent indépendantes** : Modifier une formation n'affecte pas le programme, et vice versa
- **L'ordre est important** : L'ordre défini dans le programme détermine l'ordre d'affichage pour les utilisateurs
- **Les inscriptions sont indépendantes** : Donner accès à un programme ne donne pas automatiquement accès aux formations individuelles
- **Les programmes peuvent être réutilisés** : Une formation peut appartenir à plusieurs programmes

## 🎯 Prochaines étapes

Une fois les programmes créés, vous pouvez :

1. **Adapter le frontend** pour afficher les programmes aux utilisateurs
2. **Créer une vue programme** qui affiche les formations dans l'ordre défini
3. **Ajouter des métriques** de progression par programme
4. **Implémenter la navigation** entre formations dans un programme

