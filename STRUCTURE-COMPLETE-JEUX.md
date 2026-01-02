# Structure complète des jeux

Ce document décrit l'ossature complète requise pour chaque type de jeu dans l'application.

## 📋 Structure de base commune

Tous les jeux doivent respecter cette structure de base :

### Pour un Item de type "game"

```json
{
  "type": "game",
  "title": "Titre du jeu",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

### Pour un Chapitre de type "game"

```json
{
  "title": "Titre du jeu",
  "position": 0,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",  // Type de jeu (requis)
    "description": "Description du jeu",  // Optionnel mais recommandé
    "instructions": "Instructions pour jouer"  // Optionnel mais recommandé
    // ... champs spécifiques selon le gameType
  }
}
```

⚠️ **IMPORTANT** : Pour les chapitres, le contenu du jeu va dans `game_content`, PAS dans `content`.

---

## 🎮 Types de jeux disponibles

### 1. Matching (Association de cartes)

**gameType** : `"matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur une carte pour la retourner, puis trouvez sa paire",
    "pairs": [
      {
        "term": "REST",
        "definition": "Architecture stateless avec ressources HTTP"
      },
      {
        "term": "GraphQL",
        "definition": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "term": "WebSocket",
        "definition": "Communication bidirectionnelle en temps réel"
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"matching"`
- ✅ `pairs`: Array d'objets avec `term` et `definition`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 2. Column Matching (Association de colonnes)

**gameType** : `"column-matching"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Associer les colonnes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "column-matching",
    "description": "Associez les éléments de la colonne gauche à ceux de la colonne droite",
    "instructions": "Glissez les éléments de la colonne gauche vers la colonne droite",
    "leftColumn": [
      "GET",
      "POST",
      "PUT",
      "DELETE"
    ],
    "rightColumn": [
      "Récupérer une ressource",
      "Créer une ressource",
      "Mettre à jour une ressource",
      "Supprimer une ressource"
    ],
    "correctMatches": [
      { "left": 0, "right": 0 },
      { "left": 1, "right": 1 },
      { "left": 2, "right": 2 },
      { "left": 3, "right": 3 }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"column-matching"`
- ✅ `leftColumn`: Array de strings (éléments de gauche)
- ✅ `rightColumn`: Array de strings (éléments de droite)
- ✅ `correctMatches`: Array d'objets avec `left` (index) et `right` (index)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

**Note** : Les indices dans `correctMatches` commencent à 0.

---

### 3. API Types (Choix de type d'API)

**gameType** : `"api-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Quel type d'API utiliser ?",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "api-types",
    "description": "Choisissez le bon type d'API pour chaque scénario",
    "instructions": "Glissez le type d'API approprié pour chaque scénario",
    "apiTypes": [
      {
        "id": "rest",
        "name": "REST API",
        "color": "bg-blue-500",
        "description": "Architecture stateless avec ressources HTTP"
      },
      {
        "id": "graphql",
        "name": "GraphQL",
        "color": "bg-pink-500",
        "description": "Requêtes flexibles avec un seul endpoint"
      },
      {
        "id": "websocket",
        "name": "WebSocket",
        "color": "bg-green-500",
        "description": "Communication bidirectionnelle en temps réel"
      },
      {
        "id": "grpc",
        "name": "gRPC",
        "color": "bg-purple-500",
        "description": "RPC haute performance avec Protocol Buffers"
      }
    ],
    "scenarios": [
      {
        "id": 1,
        "text": "Application de chat en temps réel",
        "correctType": "websocket",
        "explanation": "Les chats nécessitent une communication bidirectionnelle en temps réel."
      },
      {
        "id": 2,
        "text": "API publique pour un site e-commerce",
        "correctType": "rest",
        "explanation": "REST est idéal pour les APIs publiques avec des ressources bien définies."
      },
      {
        "id": 3,
        "text": "Application mobile avec besoins de données flexibles",
        "correctType": "graphql",
        "explanation": "GraphQL permet de récupérer exactement les données nécessaires."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"api-types"`
- ✅ `apiTypes`: Array d'objets avec :
  - `id`: string (identifiant unique)
  - `name`: string (nom affiché)
  - `color`: string (classe Tailwind CSS, ex: "bg-blue-500")
  - `description`: string (description du type d'API)
- ✅ `scenarios`: Array d'objets avec :
  - `id`: number (identifiant unique)
  - `text`: string (texte du scénario)
  - `correctType`: string (id du type d'API correct)
  - `explanation`: string (explication de la réponse)

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 4. Format Files (Formats JSON/XML/Protobuf)

**gameType** : `"format-files"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "format-files",
    "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
    "instructions": "Répondez aux questions pour progresser dans les niveaux",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [
          {
            "id": "q1-1",
            "type": "identify-format",
            "prompt": "Quel est ce format de données ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "C'est du JSON : les accolades {} et les guillemets doubles indiquent ce format.",
            "difficulty": 1
          },
          {
            "id": "q1-2",
            "type": "json-valid",
            "prompt": "Ce JSON est-il valide ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "answer": true,
            "explanation": "Oui, c'est un JSON valide avec une syntaxe correcte.",
            "difficulty": 1
          }
        ]
      },
      {
        "level": 2,
        "name": "Intermédiaire",
        "questions": [
          {
            "id": "q2-1",
            "type": "fix-json-mcq",
            "prompt": "Quelle est la correction de ce JSON ?",
            "snippet": "{\n  name: \"John\",\n  age: 30\n}",
            "options": [
              "{\"name\": \"John\", \"age\": 30}",
              "{name: \"John\", age: 30}",
              "{\"name\": \"John\", \"age\": 30}"
            ],
            "answer": "{\"name\": \"John\", \"age\": 30}",
            "explanation": "En JSON, les clés doivent être entre guillemets doubles.",
            "difficulty": 2
          }
        ]
      },
      {
        "level": 3,
        "name": "Avancé",
        "questions": [
          {
            "id": "q3-1",
            "type": "fix-json-editor",
            "prompt": "Corrigez ce JSON dans l'éditeur :",
            "snippet": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30}\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "answer": "{\n  \"users\": [\n    {\"name\": \"John\", \"age\": 30},\n    {\"name\": \"Jane\", \"age\": 25}\n  ]\n}",
            "explanation": "Il manque une virgule entre les deux objets du tableau.",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"format-files"`
- ✅ `levels`: Array d'objets avec :
  - `level`: number (numéro du niveau, 1, 2, 3...)
  - `name`: string (nom du niveau)
  - `questions`: Array d'objets question

**Structure d'une question** :

Chaque question doit avoir :
- ✅ `id`: string (identifiant unique)
- ✅ `type`: string - un des types suivants :
  - `"identify-format"` : Identifier le format (JSON/XML/Protobuf)
  - `"json-valid"` : Vérifier si le JSON est valide (réponse booléenne)
  - `"fix-json-mcq"` : Corriger le JSON (choix multiples)
  - `"fix-json-editor"` : Corriger le JSON dans un éditeur
  - `"choose-format"` : Choisir le format approprié
- ✅ `prompt`: string (question posée)
- ✅ `answer`: string | boolean (réponse correcte)
- ✅ `explanation`: string (explication de la réponse)
- ✅ `difficulty`: number (niveau de difficulté, 1-3)

**Champs optionnels selon le type de question** :
- `snippet`: string (code à analyser) - requis pour la plupart des types
- `options`: Array<string> (options de réponse) - requis pour `identify-format` et `fix-json-mcq`

**Champs optionnels** :
- `description`: Description du jeu
- `instructions`: Instructions pour jouer

---

### 5. JSON File Types (Nouveau type)

**gameType** : `"json-file-types"`

**Structure complète** :

```json
{
  "type": "game",
  "title": "Jeu : Types de fichiers JSON",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "json-file-types",
    "description": "Identifiez le type de fichier JSON",
    "instructions": "Regardez le contenu et choisissez le type de fichier",
    "fileTypes": [
      {
        "id": "package.json",
        "name": "package.json",
        "description": "Fichier de configuration npm",
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
        "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\"\n}",
        "correctType": "package.json",
        "explanation": "Ce contenu correspond à un package.json avec name et version."
      }
    ]
  }
}
```

**Champs requis** :
- ✅ `gameType`: `"json-file-types"`
- ✅ `fileTypes`: Array d'objets avec `id`, `name`, `description`, `color`
- ✅ `examples`: Array d'objets avec `id`, `content`, `correctType`, `explanation`

---

## ✅ Checklist de validation

Pour qu'un jeu soit complet et fonctionnel, vérifiez :

### Structure de base
- [ ] `type` = `"game"` (pour un item) ou `type` = `"game"` dans le chapitre
- [ ] `title` présent et non vide
- [ ] `position` défini (number)
- [ ] `published` = `true` (ou omis, par défaut `true`)

### Contenu du jeu
- [ ] `gameType` présent et valide (matching, column-matching, api-types, format-files, json-file-types)
- [ ] Tous les champs requis pour le `gameType` sont présents
- [ ] Les arrays requis ne sont pas vides (pairs, levels, apiTypes, scenarios, etc.)
- [ ] Les indices dans `correctMatches` sont valides (0-indexed)
- [ ] Les `id` dans les questions/scénarios sont uniques

### Pour les chapitres
- [ ] `game_content` contient le jeu (PAS `content`)
- [ ] `game_content.gameType` est défini
- [ ] Structure du jeu directement dans `game_content` (pas imbriquée)

### Pour les items
- [ ] `content.gameType` est défini
- [ ] Structure du jeu directement dans `content` (pas imbriquée)

---

## 📝 Exemples complets par contexte

### Exemple : Jeu dans un Item

```json
{
  "type": "game",
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

### Exemple : Jeu dans un Chapitre

```json
{
  "title": "Jeu : Associer les termes API",
  "position": 1,
  "type": "game",
  "published": true,
  "game_content": {
    "gameType": "matching",
    "description": "Associez chaque terme à sa définition",
    "instructions": "Cliquez sur les cartes pour les retourner",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless" },
      { "term": "GraphQL", "definition": "Requêtes flexibles" }
    ]
  }
}
```

---

## 🚨 Erreurs courantes à éviter

1. ❌ Mettre `game_content` dans un item (utiliser `content` à la place)
2. ❌ Mettre `content` dans un chapitre de type game (utiliser `game_content`)
3. ❌ Imbriquer la structure : `game_content.game_content.gameType` (structure plate requise)
4. ❌ Oublier `gameType` (champ requis)
5. ❌ Arrays vides dans les champs requis (pairs, levels, etc.)
6. ❌ Indices incorrects dans `correctMatches` (doivent être 0-indexed)
7. ❌ `id` dupliqués dans les questions/scénarios

---

## 📚 Ressources supplémentaires

- `GUIDE-FORMAT-JEU-CHAPITRE.md` : Guide détaillé pour les chapitres
- `FORMATS-JSON.md` : Documentation complète des formats JSON
- `exemples-chapitres-jeux.json` : Exemples complets de tous les types
- `GUIDE-AJOUT-NOUVEAU-JEU.md` : Comment ajouter un nouveau type de jeu

