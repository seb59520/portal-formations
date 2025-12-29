# Guide de création de cours et leçons

## 📚 Comment créer un cours

### Étape 1 : Accéder à l'administration
1. Connectez-vous avec un compte **admin**
2. Cliquez sur le bouton **"Administration"** dans le header (en haut à droite)
3. Vous arrivez sur la page `/admin` qui liste toutes les formations

### Étape 2 : Créer une nouvelle formation
1. Cliquez sur le bouton **"Nouvelle formation"** (en haut à droite)
2. Vous êtes redirigé vers `/admin/courses/new`

### Étape 3 : Remplir les informations de base
Dans la section **"Informations générales"** :
- **Titre** * (obligatoire) : Le nom de votre formation
- **Description** : Une description de la formation
- **Statut** : 
  - `Brouillon` : La formation n'est pas visible par les étudiants
  - `Publié` : La formation est visible et accessible
- **Type d'accès** :
  - `Gratuit` : Accès libre
  - `Payant` : Accès payant (nécessite un prix)
  - `Sur invitation` : Accès sur invitation uniquement
- **Prix** (si payant) : Le prix en centimes (ex: 5000 = 50€)

### Étape 4 : Sauvegarder la formation
1. Cliquez sur le bouton **"Sauvegarder"** (en haut à droite)
2. La formation est créée et vous êtes redirigé vers la page d'édition avec l'ID de la formation

---

## 📖 Comment créer des modules et leçons

### Étape 1 : Ajouter un module
Une fois la formation sauvegardée :
1. Dans la section **"Modules et éléments"**, cliquez sur **"Ajouter un module"**
2. Un nouveau module apparaît avec le titre "Nouveau module"
3. Cliquez sur le titre pour le modifier
4. Les modules sont automatiquement sauvegardés quand vous sauvegardez la formation

### Étape 2 : Ajouter une leçon (item) dans un module
1. Dans un module, cliquez sur le bouton **"+ Élément"** (à droite du titre du module)
2. Un nouvel élément apparaît avec le titre "Nouvel élément"
3. Cliquez sur le titre pour le modifier
4. **Important** : Les éléments temporaires ne peuvent pas être modifiés directement

### Étape 3 : Sauvegarder la formation pour activer les éléments
1. Cliquez sur **"Sauvegarder"** en haut de la page
2. Les modules et éléments temporaires sont sauvegardés dans la base de données
3. Les éléments obtiennent un ID réel (plus de "temp-")

### Étape 4 : Modifier une leçon
Une fois la formation sauvegardée :
1. Cliquez sur l'icône **✏️ Modifier** (icône crayon) à côté d'un élément
2. Vous êtes redirigé vers `/admin/items/{itemId}/edit`
3. Vous pouvez maintenant :
   - Modifier le titre et le type de l'élément
   - Écrire le contenu avec l'éditeur de texte riche
   - Ajouter des chapitres
   - Uploader des fichiers
   - Configurer les options spécifiques selon le type

---

## 🎯 Types de leçons disponibles

### 1. Ressource (`resource`)
- Pour partager des documents, liens, fichiers
- Peut contenir :
  - Une description
  - Un fichier (PDF, DOC, images, etc.)
  - Une URL externe

### 2. Support projeté (`slide`)
- Pour les présentations, slides
- Peut contenir :
  - Un fichier PDF ou image
  - Une description

### 3. Exercice (`exercise`)
- Pour les exercices à faire
- Peut contenir :
  - Un énoncé (éditeur de texte riche)
  - Une correction (éditeur de texte riche)
  - Les étudiants peuvent soumettre leurs réponses

### 4. TP (`tp`)
- Pour les travaux pratiques
- Peut contenir :
  - Des instructions (éditeur de texte riche)
  - Une checklist
  - Les étudiants peuvent soumettre leurs travaux

### 5. Mini-jeu (`game`)
- Pour les jeux éducatifs
- Peut contenir :
  - Une description
  - Un système de score

---

## ✍️ Écrire le contenu d'une leçon

### Contenu principal
1. Dans la page d'édition d'un élément, vous verrez la section **"Contenu principal"**
2. Utilisez l'éditeur de texte riche pour écrire directement votre contenu
3. Le contenu est sauvegardé automatiquement dans `item.content.body`

### Fonctionnalités de l'éditeur
- **Gras** : Mettre en gras
- **Italique** : Mettre en italique
- **Titres** : H1, H2, H3
- **Listes** : À puces ou numérotées
- **Liens** : Ajouter des liens hypertextes
- **Annuler/Refaire** : Gérer l'historique

### Chapitres
1. Dans la section **"Chapitres"**, cliquez sur **"Ajouter un chapitre"**
2. Donnez un titre au chapitre
3. Cliquez sur le chapitre pour le développer
4. Écrivez le contenu du chapitre dans l'éditeur
5. Les chapitres sont sauvegardés automatiquement après 2 secondes d'inactivité

### Réorganiser les chapitres
- Utilisez les flèches ⬆️ ⬇️ pour déplacer un chapitre
- Les positions sont mises à jour automatiquement

---

## 🔄 Workflow recommandé

### Pour créer une formation complète :

1. **Créer la formation**
   - Aller sur `/admin`
   - Cliquer sur "Nouvelle formation"
   - Remplir les informations
   - Sauvegarder

2. **Créer les modules**
   - Dans la page d'édition de la formation
   - Cliquer sur "Ajouter un module" pour chaque module
   - Modifier les titres des modules
   - Sauvegarder la formation

3. **Créer les leçons**
   - Dans chaque module, cliquer sur "+ Élément"
   - Modifier les titres des éléments
   - Sauvegarder la formation (important !)

4. **Écrire le contenu des leçons**
   - Cliquer sur ✏️ à côté d'un élément
   - Écrire le contenu principal
   - Ajouter des chapitres si nécessaire
   - Le contenu est sauvegardé automatiquement

5. **Publier la formation**
   - Revenir sur la page d'édition de la formation
   - Changer le statut de "Brouillon" à "Publié"
   - Sauvegarder

---

## ⚠️ Points importants

1. **Sauvegarder avant de modifier les éléments**
   - Les éléments avec un ID temporaire (`temp-XXX`) ne peuvent pas être modifiés
   - Il faut d'abord sauvegarder la formation pour obtenir des IDs réels

2. **Module ID obligatoire**
   - Pour créer un nouvel élément directement, vous devez passer le `module_id` dans l'URL
   - Format : `/admin/items/new?module_id={moduleId}`

3. **Ordre des éléments**
   - Les modules et éléments sont triés par position
   - Vous pouvez modifier la position dans les champs numériques

4. **Publication**
   - Seuls les éléments avec `published: true` sont visibles par les étudiants
   - Vous pouvez décocher "Publié" pour masquer temporairement un élément

---

## 🎨 Exemple de structure

```
Formation : "React Avancé"
├── Module 1 : "Introduction"
│   ├── Leçon 1 : "Qu'est-ce que React ?" (resource)
│   └── Leçon 2 : "Installation" (slide)
├── Module 2 : "Les Hooks"
│   ├── Leçon 3 : "useState" (resource)
│   ├── Leçon 4 : "useEffect" (exercise)
│   └── Leçon 5 : "TP : Créer un compteur" (tp)
└── Module 3 : "Pratique"
    └── Leçon 6 : "Quiz React" (game)
```

---

## 🔗 URLs importantes

- **Liste des formations** : `/admin`
- **Créer une formation** : `/admin/courses/new`
- **Modifier une formation** : `/admin/courses/{courseId}`
- **Créer une leçon** : `/admin/items/new?module_id={moduleId}`
- **Modifier une leçon** : `/admin/items/{itemId}/edit`

---

## 💡 Astuces

1. **Dupliquer une formation** : Utilisez l'icône 📋 dans la liste des formations
2. **Voir la formation** : Utilisez l'icône 👁️ pour voir comment les étudiants la voient
3. **Filtrage** : Les étudiants peuvent filtrer par type de contenu via les tuiles de fonctionnalités
4. **Chapitres** : Utilisez les chapitres pour organiser le contenu long en sections

