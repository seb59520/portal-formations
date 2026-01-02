# Guide : Jeu "Types de fichiers JSON"

## Description

Ce jeu permet d'apprendre à reconnaître les différents types de fichiers JSON couramment utilisés dans les projets web modernes (package.json, tsconfig.json, .eslintrc.json, etc.).

## Fonctionnement

Le jeu fonctionne sur le principe du drag & drop :
1. Des exemples de contenu JSON sont affichés
2. L'utilisateur doit glisser le type de fichier approprié sur chaque exemple
3. Le système vérifie les réponses et affiche un score basé sur la précision et le temps

## Format JSON pour game_content

```json
{
  "gameType": "json-file-types",
  "description": "Apprenez à reconnaître les différents types de fichiers JSON",
  "instructions": "Glissez le type de fichier approprié pour chaque exemple",
  "fileTypes": [
    {
      "id": "package.json",
      "name": "package.json",
      "description": "Gestion des dépendances et scripts npm",
      "color": "bg-red-500"
    },
    {
      "id": "tsconfig.json",
      "name": "tsconfig.json",
      "description": "Configuration TypeScript",
      "color": "bg-blue-500"
    }
  ],
  "examples": [
    {
      "id": 1,
      "content": "{\n  \"name\": \"mon-projet\",\n  \"version\": \"1.0.0\"\n}",
      "correctType": "package.json",
      "explanation": "Ce fichier contient les métadonnées du projet.",
      "context": "Fichier à la racine d'un projet Node.js"
    }
  ]
}
```

## Structure des données

### fileTypes (array)

Tableau des types de fichiers disponibles dans le jeu.

**Propriétés :**
- `id` (string, requis) : Identifiant unique du type de fichier
- `name` (string, requis) : Nom affiché du fichier
- `description` (string, requis) : Description du fichier
- `color` (string, requis) : Classe Tailwind CSS pour la couleur (ex: "bg-red-500")

### examples (array)

Tableau des exemples de contenu JSON à identifier.

**Propriétés :**
- `id` (number, requis) : Identifiant unique de l'exemple
- `content` (string, requis) : Contenu JSON à identifier (peut contenir `\n` pour les sauts de ligne)
- `correctType` (string, requis) : ID du type de fichier correct (doit correspondre à un `id` dans `fileTypes`)
- `explanation` (string, requis) : Explication affichée après la vérification
- `context` (string, optionnel) : Contexte supplémentaire affiché au-dessus du contenu

## Types de fichiers JSON courants

### package.json
Gestion des dépendances, scripts et métadonnées d'un projet Node.js.

**Indices :**
- Contient `name`, `version`, `scripts`, `dependencies`
- Fichier à la racine du projet

### tsconfig.json
Configuration du compilateur TypeScript.

**Indices :**
- Contient `compilerOptions`, `include`, `exclude`
- Options comme `target`, `module`, `strict`

### .eslintrc.json
Configuration du linter ESLint.

**Indices :**
- Contient `extends`, `rules`, `env`
- Configuration des règles de linting

### package-lock.json
Verrouillage des versions exactes des dépendances npm.

**Indices :**
- Contient `lockfileVersion`, `packages`
- Généré automatiquement par npm

### tsconfig.node.json
Configuration TypeScript spécifique pour les fichiers Node.js.

**Indices :**
- Contient `compilerOptions` avec `composite: true`
- Utilisé pour les fichiers de configuration (vite.config.ts, etc.)

### vite.config.json
Configuration du bundler Vite.

**Indices :**
- Contient `build`, `server`, `plugins`
- Options de build et serveur de développement

### tailwind.config.json
Configuration Tailwind CSS.

**Indices :**
- Contient `plugins`, `theme`, `content`
- Configuration des couleurs, plugins et thème

### netlify.toml (ou netlify.json)
Configuration de déploiement Netlify.

**Indices :**
- Contient `build`, `redirects`, `headers`
- Configuration de déploiement et redirections

## Exemple complet

Voir le fichier `chapitre-jeu-json-file-types.json` pour un exemple complet avec 8 types de fichiers et 8 exemples.

## Utilisation dans un chapitre

1. Créez un chapitre avec `type: "game"`
2. Dans `game_content`, utilisez le format ci-dessus
3. Le jeu sera automatiquement rendu par `GameRenderer`

## Scoring

Le score est calculé sur 2000 points maximum :
- **Points de précision (max 1000 pts)** : Basé sur le nombre de bonnes réponses
- **Points de temps (max 1000 pts)** : -5 points par seconde écoulée

## Personnalisation

Vous pouvez :
- Ajouter de nouveaux types de fichiers dans `fileTypes`
- Ajouter de nouveaux exemples dans `examples`
- Personnaliser les couleurs avec les classes Tailwind CSS
- Ajouter du contexte supplémentaire avec le champ `context`

## Conseils pour créer des exemples

1. **Utilisez des exemples réalistes** : Inspirez-vous de vrais fichiers de projets
2. **Variez la difficulté** : Mélangez des exemples faciles et difficiles
3. **Ajoutez du contexte** : Le champ `context` aide à identifier le fichier
4. **Testez la validité JSON** : Assurez-vous que le `content` est du JSON valide (utilisez `\n` pour les sauts de ligne)

