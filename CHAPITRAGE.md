# Système de Chapitrage et Éditeur de Contenu

## Fonctionnalités ajoutées

### 1. Éditeur de contenu riche (TipTap)
- Éditeur WYSIWYG intégré pour écrire le contenu des formations directement dans l'application
- Support des formats : gras, italique, titres (H1, H2, H3), listes à puces, listes numérotées, liens
- Sauvegarde au format JSON (TipTap)

### 2. Système de chapitrage
- Possibilité de créer plusieurs chapitres pour chaque leçon (item)
- Chaque chapitre a :
  - Un titre
  - Un contenu riche (éditeur TipTap)
  - Une position (ordre d'affichage)
- Gestion complète : ajout, modification, suppression, réorganisation (drag & drop via boutons haut/bas)

### 3. Affichage pour les étudiants
- Affichage du contenu principal de la leçon
- Affichage des chapitres avec système d'accordéon (expand/collapse)
- Navigation facile entre les chapitres

## Installation

### 1. Base de données
Exécuter le script SQL pour créer la table `chapters` :
```sql
-- Voir le fichier add-chapters-schema.sql
```

### 2. Dépendances
Les dépendances ont déjà été installées :
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-placeholder`
- `@tiptap/extension-link`
- `@tiptap/extension-image`
- `@tailwindcss/typography`

## Utilisation

### Pour les administrateurs/formateurs

1. **Créer ou modifier une leçon** :
   - Aller dans `/admin/items/{itemId}/edit`
   - Remplir les informations de base (titre, type, module)

2. **Écrire le contenu principal** :
   - Une fois la leçon sauvegardée, l'éditeur de contenu riche apparaît
   - Écrire directement le contenu dans l'éditeur
   - Le contenu est sauvegardé automatiquement dans `item.content.body`

3. **Créer des chapitres** :
   - Cliquer sur "Ajouter un chapitre"
   - Donner un titre au chapitre
   - Écrire le contenu du chapitre dans l'éditeur riche
   - Les chapitres sont sauvegardés automatiquement après 2 secondes d'inactivité

4. **Réorganiser les chapitres** :
   - Utiliser les boutons flèches haut/bas pour déplacer un chapitre
   - Les positions sont mises à jour automatiquement

### Pour les étudiants

1. **Consulter une leçon** :
   - Aller dans `/items/{itemId}`
   - Le contenu principal s'affiche en premier (s'il existe)
   - Les chapitres s'affichent ensuite avec un système d'accordéon
   - Cliquer sur un chapitre pour le développer/réduire

## Structure des données

### Table `chapters`
```sql
- id: UUID (PK)
- item_id: UUID (FK vers items)
- title: TEXT
- content: JSONB (format TipTap)
- position: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Format du contenu
Le contenu est stocké au format JSON TipTap, qui est un format standard pour les éditeurs de texte riche.

## Composants créés

1. **RichTextEditor** (`src/components/RichTextEditor.tsx`)
   - Éditeur de contenu riche basé sur TipTap
   - Mode édition et lecture seule
   - Barre d'outils avec les principales fonctionnalités

2. **ChapterManager** (`src/components/ChapterManager.tsx`)
   - Gestion complète des chapitres (CRUD)
   - Auto-sauvegarde
   - Réorganisation par drag & drop

3. **ChapterViewer** (`src/components/ChapterViewer.tsx`)
   - Affichage des chapitres pour les étudiants
   - Système d'accordéon
   - Lecture seule

## Notes importantes

- Les chapitres ne sont disponibles qu'après la première sauvegarde de l'item
- Le contenu est sauvegardé automatiquement après 2 secondes d'inactivité
- Les chapitres sont triés par position (ordre croissant)
- Le premier chapitre s'ouvre automatiquement pour les étudiants

