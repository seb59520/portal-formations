# Guide Rapide : Ajouter un Jeu dans un Chapitre

## ✅ Étapes à suivre

### 1. Ouvrir l'éditeur JSON du chapitre
- Allez dans `/admin/chapters/{chapterId}/json`
- Remplacez `{chapterId}` par l'ID de votre chapitre

### 2. Coller le JSON complet
Copiez **TOUT** le contenu du fichier `chapitre-complet-format-files.json` et collez-le dans l'éditeur.

**Le JSON doit contenir :**
```json
{
  "title": "Jeu : Formats de fichiers (JSON/XML/Protobuf)",
  "position": 0,
  "type": "game",  ← IMPORTANT : doit être "game"
  "game_content": {
    "gameType": "format-files",
    "description": "...",
    "instructions": "...",
    "levels": [...]
  }
}
```

### 3. Sauvegarder
- Cliquez sur "Sauvegarder"
- Attendez le message de confirmation

### 4. Vérifier dans la console
Ouvrez la console du navigateur (F12) et regardez les logs qui commencent par :
- `=== Chapters fetched ===`
- `=== RENDERING GAME ===`

**Vous devriez voir :**
- `Chapter type: "game"` (ou `null` si pas encore sauvegardé)
- `Chapter game_content: { gameType: "format-files", levels: [...] }`

## 🔍 Diagnostic

### Si vous voyez "Ce chapitre n'a pas encore de contenu"

**Causes possibles :**
1. Le champ `type` n'est pas `"game"` dans le JSON
2. Le champ `game_content` est vide ou invalide
3. Le JSON n'a pas été sauvegardé correctement

**Solutions :**
1. Vérifiez dans la console les logs `=== Chapters fetched ===`
2. Vérifiez que `type` est bien `"game"` dans le JSON
3. Vérifiez que `game_content` contient bien `gameType` et `levels`
4. Réessayez de sauvegarder

### Vérification dans Supabase

Exécutez cette requête SQL dans Supabase :

```sql
SELECT 
  id,
  title,
  type,
  CASE 
    WHEN game_content IS NULL THEN 'NULL'
    WHEN game_content::text = '{}' THEN 'EMPTY OBJECT'
    ELSE 'HAS CONTENT'
  END as game_content_status,
  jsonb_typeof(game_content) as game_content_type,
  game_content->>'gameType' as game_type
FROM chapters
WHERE id = 'VOTRE_CHAPITRE_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu :**
- `type` doit être `"game"`
- `game_content_status` doit être `"HAS CONTENT"`
- `game_type` doit être `"format-files"`

## 📝 Format JSON correct

Le JSON dans l'éditeur doit être **exactement** comme ceci :

```json
{
  "title": "Jeu : Formats de fichiers (JSON/XML/Protobuf)",
  "position": 0,
  "type": "game",
  "game_content": {
    "gameType": "format-files",
    "description": "...",
    "instructions": "...",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [...]
      }
    ]
  }
}
```

**⚠️ Ne mettez PAS :**
- `"content"` (pour un jeu)
- Un `game_content` imbriqué dans un autre `game_content`
- Un `type` différent de `"game"`

## 🚀 Après la sauvegarde

1. Rechargez la page du cours/élément
2. Développez le chapitre (cliquez sur le titre)
3. Le jeu devrait apparaître

Si le jeu n'apparaît toujours pas :
1. Ouvrez la console (F12)
2. Regardez les logs `=== RENDERING GAME ===`
3. Partagez ces logs pour diagnostic

