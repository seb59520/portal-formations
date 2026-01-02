# Guide : Format pour intégrer un jeu dans un chapitre

## Format exact à mettre dans la colonne `game_content` de la table `chapters`

### ⚠️ IMPORTANT : Structure à respecter

Dans la colonne `game_content` de la table `chapters`, vous devez mettre **UNIQUEMENT** la partie jeu, **SANS** les champs `type`, `title`, `position` qui sont déjà dans les autres colonnes du chapitre.

### ✅ Format CORRECT pour `game_content` :

```json
{
  "gameType": "format-files",
  "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
  "instructions": "Répondez aux questions pour progresser dans les 3 niveaux de difficulté",
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
          "explanation": "C'est du JSON : accolades {} et clés/valeurs entre guillemets doubles.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

### ❌ Format INCORRECT (ne pas utiliser) :

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "game_content": {
    "gameType": "format-files",
    ...
  }
}
```

## Comment corriger vos données

### Option 1 : Via l'éditeur JSON du chapitre (recommandé)

1. Allez dans `/admin/chapters/{chapterId}/json`
2. Dans le JSON, vous devez avoir :
   ```json
   {
     "title": "Jeu : Formats de fichiers",
     "position": 0,
     "type": "game",
     "game_content": {
       "gameType": "format-files",
       "levels": [...]
     }
   }
   ```
3. Cliquez sur "Sauvegarder"

### Option 2 : Via SQL (pour corriger directement)

Si vous avez déjà mis le mauvais format dans `game_content`, exécutez ce SQL dans Supabase :

```sql
-- Trouver votre chapitre
SELECT id, title, game_content 
FROM chapters 
WHERE type = 'game' 
  AND title ILIKE '%format%';

-- Corriger le game_content (remplacez <CHAPTER_ID> par l'ID de votre chapitre)
UPDATE chapters
SET game_content = game_content->'game_content'  -- Extrait le game_content imbriqué
WHERE id = '<CHAPTER_ID>'
  AND game_content->>'game_content' IS NOT NULL;
```

## Exemples complets par type de jeu

### 1. Matching (cartes à associer)

```json
{
  "gameType": "matching",
  "description": "Associez chaque terme à sa définition",
  "instructions": "Cliquez sur une carte pour la retourner",
  "pairs": [
    {
      "term": "REST",
      "definition": "Architecture stateless avec ressources HTTP"
    },
    {
      "term": "GraphQL",
      "definition": "Requêtes flexibles avec un seul endpoint"
    }
  ]
}
```

### 2. Column Matching (colonnes à associer)

```json
{
  "gameType": "column-matching",
  "leftColumn": ["GET", "POST", "PUT", "DELETE"],
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
```

### 3. API Types

```json
{
  "gameType": "api-types",
  "apiTypes": [
    {
      "id": "rest",
      "name": "REST API",
      "color": "bg-blue-500",
      "description": "Architecture stateless avec ressources HTTP"
    }
  ],
  "scenarios": [
    {
      "id": 1,
      "text": "Application de chat en temps réel",
      "correctType": "websocket",
      "explanation": "Les chats nécessitent une communication bidirectionnelle."
    }
  ]
}
```

### 4. Format Files (votre cas)

```json
{
  "gameType": "format-files",
  "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
  "instructions": "Répondez aux questions pour progresser dans les 3 niveaux",
  "levels": [
    {
      "level": 1,
      "name": "Découverte",
      "questions": [
        {
          "id": "q1-1",
          "type": "identify-format",
          "prompt": "Quel est ce format ?",
          "snippet": "{\"name\": \"John\"}",
          "options": ["JSON", "XML", "Protobuf"],
          "answer": "JSON",
          "explanation": "C'est du JSON.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

## Vérification

Après avoir sauvegardé, vérifiez dans Supabase :

1. Table `chapters` → votre chapitre
2. Colonne `type` = `'game'`
3. Colonne `game_content` doit contenir **directement** :
   - `gameType`
   - `levels` (pour format-files)
   - `pairs` (pour matching)
   - etc.

**SANS** les champs `type`, `title`, `position` dans `game_content`.

