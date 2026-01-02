# Diagnostic : Pourquoi mon jeu n'apparaît pas dans un chapitre ?

## ✅ Checklist de vérification

### 1. Vérifier dans Supabase (Table Editor → `chapters`)

Votre chapitre doit avoir :
- ✅ `type` = `'game'` (pas `'content'` ou `null`)
- ✅ `game_content` contient un JSON valide avec :
  - `gameType: "format-files"`
  - `levels: [...]` (tableau avec au moins 1 niveau)

**Requête SQL pour vérifier :**
```sql
SELECT 
  id,
  title,
  type,
  CASE 
    WHEN game_content IS NULL THEN 'NULL'
    WHEN game_content->>'gameType' IS NULL THEN 'Pas de gameType'
    ELSE game_content->>'gameType'
  END as game_type,
  CASE 
    WHEN game_content->'levels' IS NULL THEN 'Pas de levels'
    WHEN jsonb_array_length(game_content->'levels') = 0 THEN 'Levels vide'
    ELSE jsonb_array_length(game_content->'levels')::text || ' niveaux'
  END as levels_status
FROM chapters
WHERE type = 'game'
ORDER BY position;
```

### 2. Vérifier dans la console du navigateur

1. Ouvrez la console (F12)
2. Rechargez la page avec le chapitre
3. Développez le chapitre de jeu
4. Cherchez les logs qui commencent par :
   - `=== Chapters fetched ===`
   - `renderGame called with gameContent:`
   - `FormatFilesGame initialized`

**Ce que vous devriez voir :**
```
=== Chapters fetched ===
Chapter 4: {
  id: "...",
  title: "Jeu : Formats de fichiers",
  type: "game",
  hasGameContent: true,
  gameContentType: "object",
  gameContent: { gameType: "format-files", levels: [...] }
}
```

### 3. Vérifier que le chapitre est développé

- Le chapitre doit être cliqué pour se développer
- Vous devriez voir le contenu du jeu apparaître en dessous

### 4. Vérifier les erreurs dans la console

Cherchez les erreurs en rouge qui pourraient bloquer le rendu.

## 🔧 Solutions selon le problème

### Problème 1 : `type` n'est pas `'game'`

**Solution :**
```sql
UPDATE chapters
SET type = 'game'
WHERE id = '<CHAPTER_ID>';
```

### Problème 2 : `game_content` est NULL

**Solution :** Sauvegardez le JSON via l'éditeur JSON du chapitre.

### Problème 3 : `game_content` n'a pas `gameType`

**Solution :** Vérifiez que votre JSON contient bien `"gameType": "format-files"` à la racine.

### Problème 4 : `game_content` n'a pas `levels` ou `levels` est vide

**Solution :** Vérifiez que votre JSON contient bien `"levels": [...]` avec au moins un niveau.

### Problème 5 : Le chapitre n'est pas visible

**Solution :** Vérifiez que vous êtes sur la bonne page (vue item ou vue cours).

## 📋 Format exact à mettre dans `game_content`

Copiez ceci dans la colonne `game_content` :

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
          "explanation": "C'est du JSON.",
          "difficulty": 1
        }
      ]
    }
  ]
}
```

## 🚀 Test rapide

Exécutez ce SQL pour créer un chapitre de test :

```sql
-- Trouver un item_id de test
SELECT id FROM items LIMIT 1;

-- Créer un chapitre de jeu de test (remplacez <ITEM_ID>)
INSERT INTO chapters (item_id, title, type, position, game_content)
VALUES (
  '<ITEM_ID>',
  'Test Jeu Format Files',
  'game',
  0,
  '{
    "gameType": "format-files",
    "description": "Test",
    "instructions": "Test",
    "levels": [
      {
        "level": 1,
        "name": "Test",
        "questions": [
          {
            "id": "test-1",
            "type": "identify-format",
            "prompt": "Quel format ?",
            "snippet": "{}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "Test",
            "difficulty": 1
          }
        ]
      }
    ]
  }'::jsonb
);
```

Ensuite, allez sur la page de l'item et vérifiez si le jeu apparaît.

