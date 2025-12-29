# Guide d'aide - Portail Formations

## 📚 Vue d'ensemble

Ce guide explique comment utiliser chaque fonctionnalité du portail de formations pour créer et gérer vos contenus pédagogiques.

---

## 🎯 Catégories de contenu

### 1. 📄 Ressource (`resource`)

**Qu'est-ce que c'est ?**
Une ressource est un document, un lien ou un fichier que les étudiants peuvent télécharger ou consulter.

**Quand l'utiliser ?**
- Documents de référence (PDF, Word, etc.)
- Liens vers des sites web externes
- Fichiers à télécharger
- Documentation complémentaire
- Articles, guides, tutoriels

**Comment créer une ressource ?**

1. **Créer un élément de type "Ressource"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Ressource"

2. **Configurer la ressource**
   - **Titre** : Donnez un nom clair à la ressource
   - **Description** : Ajoutez une description courte (optionnel)
   - **URL externe** : Si c'est un lien web, entrez l'URL complète
   - **Fichier** : Ou uploadez un fichier (PDF, DOC, images, ZIP, etc.)

3. **Contenu principal** (optionnel)
   - Utilisez l'éditeur de texte riche pour ajouter du contenu
   - Vous pouvez ajouter des chapitres pour structurer le contenu

**Affichage pour les étudiants :**
- Si URL externe : Bouton "Accéder à la ressource"
- Si fichier PDF : Visualiseur PDF intégré
- Si autre fichier : Bouton "Télécharger le fichier"

---

### 2. 🎯 Support projeté (`slide`)

**Qu'est-ce que c'est ?**
Un support projeté est un document visuel (PDF, image) optimisé pour la projection ou la visualisation directe.

**Quand l'utiliser ?**
- Présentations PowerPoint converties en PDF
- Slides de cours
- Supports visuels pour présentation
- Images pédagogiques
- Documents à projeter en classe

**Comment créer un support ?**

1. **Créer un élément de type "Support projeté"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Support projeté"

2. **Configurer le support**
   - **Titre** : Nom du support
   - **Description** : Description courte (optionnel)
   - **Fichier** : Uploadez un PDF ou une image

3. **Contenu principal** (optionnel)
   - Ajoutez du contenu texte si nécessaire
   - Créez des chapitres pour structurer

**Affichage pour les étudiants :**
- PDF : Visualiseur PDF avec navigation et zoom
- Image : Affichage direct de l'image

**Différence avec Ressource :**
- **Ressource** : Fichier à télécharger
- **Support** : Document à visualiser directement

---

### 3. ✏️ Exercice (`exercise`)

**Qu'est-ce que c'est ?**
Un exercice est une question ou un problème que les étudiants doivent résoudre et soumettre.

**Quand l'utiliser ?**
- Questions à réponse courte
- Problèmes à résoudre
- Quiz
- Questions de compréhension
- Exercices pratiques

**Comment créer un exercice ?**

1. **Créer un élément de type "Exercice"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Exercice"

2. **Configurer l'exercice**
   - **Titre** : Nom de l'exercice
   - **Énoncé** : Utilisez l'éditeur de texte riche pour écrire la question
   - **Correction** : Ajoutez la correction (visible après notation)

3. **Contenu principal** (optionnel)
   - Ajoutez des informations complémentaires
   - Créez des chapitres pour structurer

**Fonctionnement pour les étudiants :**
1. L'étudiant voit l'énoncé
2. Il tape sa réponse dans le champ texte
3. Il soumet sa réponse
4. Une fois noté, il peut voir la correction

**Gestion des soumissions :**
- Les soumissions sont enregistrées automatiquement
- Vous pouvez noter les exercices (0-100)
- Les étudiants voient leur note et la correction après notation

---

### 4. 💻 Travaux pratiques (`tp`)

**Qu'est-ce que c'est ?**
Un TP est un travail pratique plus complexe qui peut inclure des fichiers à soumettre.

**Quand l'utiliser ?**
- Projets pratiques
- Travaux à rendre avec fichiers
- Devoirs complexes
- Projets de groupe
- Travaux avec livrables

**Comment créer un TP ?**

1. **Créer un élément de type "TP"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "TP"

2. **Configurer le TP**
   - **Titre** : Nom du TP
   - **Instructions** : Utilisez l'éditeur pour écrire les consignes
   - **Checklist** : Ajoutez une liste de points à vérifier (optionnel)

3. **Contenu principal** (optionnel)
   - Ajoutez des ressources complémentaires
   - Créez des chapitres pour structurer

**Fonctionnement pour les étudiants :**
1. L'étudiant voit les instructions et la checklist
2. Il décrit son travail dans le champ texte
3. Il peut uploader un fichier (PDF, DOC, ZIP, etc.)
4. Il soumet son travail
5. Une fois noté, il voit sa note

**Types de fichiers acceptés :**
- PDF, DOC, DOCX
- ZIP, RAR
- Images (JPG, PNG)

---

### 5. 🎮 Mini-jeu (`game`)

**Qu'est-ce que c'est ?**
Un mini-jeu est une activité ludique interactive pour renforcer l'apprentissage.

**Quand l'utiliser ?**
- Quiz interactifs
- Jeux éducatifs
- Activités ludiques
- Renforcement de l'apprentissage
- Évaluation gamifiée

**Comment créer un mini-jeu ?**

1. **Créer un élément de type "Mini-jeu"**
   - Dans l'édition d'une formation, cliquez sur "+ Élément" dans un module
   - Sélectionnez le type "Mini-jeu"

2. **Configurer le jeu**
   - **Titre** : Nom du jeu
   - **Description** : Expliquez les règles et l'objectif

**Fonctionnement :**
- Les scores sont enregistrés automatiquement
- Les étudiants peuvent voir leur progression
- Les meilleurs scores peuvent être affichés (à implémenter)

---

## ✍️ Éditeur de texte riche

### Fonctionnalités disponibles

L'éditeur de texte riche permet de formater votre contenu avec :

#### Formatage de base
- **Gras** : Mettre en évidence des mots importants
- **Italique** : Mettre en emphase
- **Titres** : H1, H2, H3 pour structurer le contenu

#### Listes
- **Liste à puces** : Pour énumérer des éléments
- **Liste numérotée** : Pour des étapes ordonnées

#### Mise en page avancée
- **Alignement** : Gauche, centre, droite, justifié
- **Couleur du texte** : Personnaliser la couleur
- **Liens** : Ajouter des liens vers d'autres ressources
- **Vidéos YouTube** : Intégrer des vidéos YouTube directement dans le contenu

#### Navigation
- **Annuler** : Revenir en arrière
- **Refaire** : Avancer à nouveau

### Intégrer une vidéo YouTube

1. **Dans l'éditeur de texte riche**
   - Cliquez sur l'icône YouTube (rouge) dans la barre d'outils
   - Entrez l'URL de la vidéo ou juste l'ID de la vidéo

2. **Formats d'URL acceptés**
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`
   - `VIDEO_ID` (juste l'ID de la vidéo)

3. **Exemple**
   - URL complète : `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Ou juste l'ID : `dQw4w9WgXcQ`

**Affichage :**
- La vidéo s'affiche dans un lecteur YouTube intégré
- Format responsive (s'adapte à la largeur de l'écran)
- Ratio 16:9 automatique

### Conseils d'utilisation

1. **Structurez votre contenu**
   - Utilisez les titres (H1, H2, H3) pour créer une hiérarchie
   - Séparez les paragraphes avec des sauts de ligne

2. **Mettez en évidence**
   - Utilisez le **gras** pour les mots-clés
   - Utilisez l'*italique* pour les termes techniques

3. **Organisez avec des listes**
   - Listes à puces pour des éléments non ordonnés
   - Listes numérotées pour des étapes

4. **Alignement**
   - Centrez les titres importants
   - Justifiez les paragraphes longs pour une meilleure lisibilité

---

## 📑 Système de chapitres

### Qu'est-ce qu'un chapitre ?

Un chapitre est une section structurée à l'intérieur d'un élément (leçon). Il permet de diviser le contenu en parties logiques.

### Comment créer des chapitres ?

1. **Dans l'édition d'un élément**
   - Allez dans la section "Chapitres"
   - Cliquez sur "Ajouter un chapitre"

2. **Configurer le chapitre**
   - **Titre** : Nom du chapitre
   - **Contenu** : Utilisez l'éditeur de texte riche
   - **Position** : Réorganisez avec les flèches haut/bas

3. **Gérer les chapitres**
   - **Modifier** : Cliquez sur le titre pour éditer
   - **Supprimer** : Cliquez sur la poubelle
   - **Réorganiser** : Utilisez les flèches pour changer l'ordre

### Affichage pour les étudiants

Les chapitres s'affichent sous forme d'accordéon :
- Cliquez sur un chapitre pour l'ouvrir
- Le contenu s'affiche avec le formatage
- Navigation facile entre les chapitres

---

## 🎨 Options de mise en page

### Dans l'éditeur de texte riche

#### Alignement
- **Gauche** : Alignement par défaut
- **Centre** : Pour les titres ou citations
- **Droite** : Pour des éléments spécifiques
- **Justifié** : Pour les paragraphes longs

#### Couleurs
- Cliquez sur l'icône palette
- Entrez une couleur (ex: #FF0000, red, rgb(255,0,0))
- Le texte prend la couleur choisie

### Formatage de la description des formations

Dans la description d'une formation, vous pouvez utiliser :

- **`**texte**`** : Pour créer un titre en gras
- **`- Item`** ou **`* Item`** : Pour créer une liste à puces
- **Sauts de ligne** : Pour créer des paragraphes

Exemple :
```
**Voici les thématiques abordées:**

**API Paradigms:**
- RESTful
- GraphQL
- RPC/gRPC
```

---

## ⚙️ Paramètres utilisateur

### Zoom PDF

Le niveau de zoom des PDFs est sauvegardé automatiquement :
- Choisissez votre niveau de zoom (50%, 75%, 100%, 125%, 150%, 200%)
- Votre préférence est enregistrée
- Le zoom est restauré à chaque ouverture de PDF

### Comment ça fonctionne ?

1. Ouvrez un PDF
2. Changez le zoom dans le menu déroulant
3. Votre choix est sauvegardé automatiquement
4. La prochaine fois, le même zoom sera utilisé

---

## 📊 Tuiles de fonctionnalités

Sur la page d'une formation, vous trouverez des tuiles pour :

### Vue d'ensemble
- Aperçu général de la formation
- Description et informations principales

### Ressources
- Nombre de ressources disponibles
- Cliquez pour filtrer et voir uniquement les ressources

### Supports
- Nombre de supports projetés
- Cliquez pour filtrer et voir uniquement les supports

### Exercices
- Nombre d'exercices
- Cliquez pour filtrer et voir uniquement les exercices

### Travaux pratiques
- Nombre de TPs
- Cliquez pour filtrer et voir uniquement les TPs

### Mini-jeux
- Nombre de jeux
- Cliquez pour filtrer et voir uniquement les jeux

### Progression
- Suivez votre avancement dans la formation
- Voir les éléments complétés

---

## 🔄 Workflow de création

### 1. Créer une formation

1. Allez dans **Admin** → **Formations**
2. Cliquez sur **"Nouvelle formation"**
3. Remplissez les informations :
   - Titre
   - Description (utilisez le formatage pour structurer)
   - Statut (Brouillon/Publié)
   - Type d'accès (Gratuit/Payant/Sur invitation)
4. Cliquez sur **"Sauvegarder"**

### 2. Ajouter des modules

1. Dans l'édition de la formation, cliquez sur **"Ajouter un module"**
2. Donnez un nom au module
3. Les modules sont automatiquement ordonnés

### 3. Ajouter des éléments

1. Dans un module, cliquez sur **"+ Élément"**
2. Donnez un titre à l'élément
3. Choisissez le type (Ressource, Support, Exercice, TP, Mini-jeu)
4. **Important** : Cliquez sur **"Sauvegarder"** la formation pour activer les éléments

### 4. Modifier un élément

1. Une fois la formation sauvegardée, cliquez sur l'icône **✏️ Modifier**
2. Vous pouvez maintenant :
   - Modifier le titre et le type
   - Écrire le contenu avec l'éditeur de texte riche
   - Ajouter des chapitres
   - Uploader des fichiers
   - Configurer les options spécifiques

### 5. Publier la formation

1. Changez le statut en **"Publié"**
2. Les étudiants inscrits pourront y accéder
3. Les formations gratuites sont accessibles à tous

---

## 💡 Conseils et bonnes pratiques

### Organisation du contenu

1. **Structurez avec des modules**
   - Un module = un thème ou une semaine
   - Nommez clairement vos modules

2. **Utilisez les chapitres**
   - Divisez les leçons longues en chapitres
   - Facilite la navigation pour les étudiants

3. **Mélangez les types de contenu**
   - Ressources pour la théorie
   - Supports pour les présentations
   - Exercices pour la pratique
   - TPs pour les projets

### Rédaction

1. **Soyez clair et concis**
   - Utilisez des titres pour structurer
   - Séparez les paragraphes
   - Utilisez des listes pour énumérer

2. **Mettez en évidence**
   - Utilisez le **gras** pour les mots-clés
   - Utilisez l'*italique* pour les termes techniques

3. **Ajoutez des liens**
   - Liez vers d'autres ressources
   - Liez vers des sites externes pertinents

### Gestion des fichiers

1. **Nommez vos fichiers clairement**
   - Ex: "Cours-API-REST.pdf" plutôt que "document.pdf"

2. **Optimisez la taille**
   - Compressez les images
   - Utilisez PDF pour les documents

3. **Vérifiez les formats**
   - PDF pour les documents
   - Images (JPG, PNG) pour les visuels
   - ZIP pour les archives

---

## ❓ Questions fréquentes

### Comment supprimer un élément ?
- Cliquez sur l'icône poubelle à côté de l'élément
- Confirmez la suppression

### Comment réorganiser les éléments ?
- Utilisez les flèches dans l'édition d'un élément
- Ou modifiez la position dans la base de données

### Les étudiants peuvent-ils modifier le contenu ?
- Non, seuls les admins et instructeurs peuvent modifier
- Les étudiants peuvent seulement consulter et soumettre leurs travaux

### Comment noter un exercice ou un TP ?
- Allez dans les soumissions (à implémenter dans l'interface admin)
- Attribuez une note de 0 à 100
- Ajoutez des commentaires si nécessaire

### Le zoom PDF est-il sauvegardé ?
- Oui, votre préférence de zoom est sauvegardée automatiquement
- Elle est restaurée à chaque ouverture de PDF

---

## 🆘 Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les guides spécifiques (CHAPITRAGE.md, etc.)
3. Contactez l'administrateur du système

---

**Dernière mise à jour** : 2024

