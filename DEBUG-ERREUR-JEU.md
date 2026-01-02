# Guide de débogage : Erreur dans ReactItemRenderer

## Problème

Erreur React dans le composant `ReactItemRenderer` lors du rendu d'un jeu.

## Solutions appliquées

1. ✅ Ajout d'une vérification de sécurité dans `renderGameFromChapter`
2. ✅ Ajout d'un Error Boundary (`GameErrorBoundary`) pour capturer les erreurs React
3. ✅ Gestion des cas où `game_content` est `null` ou `undefined`

## Étapes de débogage

### 1. Vérifier la console du navigateur

Ouvrez la console (F12) et cherchez :
- Les erreurs détaillées
- Les logs commençant par `✅ Jeu "Types de fichiers JSON" enregistré`
- Les warnings sur les props manquantes

### 2. Vérifier que le jeu est bien enregistré

Dans la console, tapez :
```javascript
// Vérifier que le registre contient le jeu
import { gameRegistry } from './lib/gameRegistry'
gameRegistry.get('json-file-types')
```

Vous devriez voir un objet avec `gameType: 'json-file-types'`.

### 3. Vérifier les données du chapitre

Dans Supabase, exécutez :
```sql
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  game_content->'fileTypes' as file_types,
  game_content->'examples' as examples
FROM chapters
WHERE type = 'game'
ORDER BY created_at DESC
LIMIT 1;
```

Vérifiez que :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `file_types` n'est pas `null` et contient un tableau
- `examples` n'est pas `null` et contient un tableau

### 4. Vérifier les props passées au jeu

Dans `GameRenderer.tsx`, le jeu reçoit ces props :
- `fileTypes` (depuis `game_content.fileTypes`)
- `examples` (depuis `game_content.examples`)
- `description` (depuis `game_content.description`)
- `instructions` (depuis `game_content.instructions`)
- `onScore` (callback)

### 5. Erreurs courantes

#### Erreur : "Cannot read property 'map' of undefined"

**Cause :** `fileTypes` ou `examples` est `undefined` au lieu d'un tableau vide.

**Solution :** Vérifiez que dans `game_content`, vous avez bien :
```json
{
  "fileTypes": [],
  "examples": []
}
```

#### Erreur : "Type de jeu non reconnu"

**Cause :** Le jeu n'est pas enregistré dans le registre.

**Solution :** Vérifiez que `gameRegistry.ts` importe bien `JsonFileTypesGame` et l'enregistre.

#### Erreur : "Configuration invalide"

**Cause :** La validation échoue (tableaux vides, types incorrects).

**Solution :** Vérifiez que `fileTypes` et `examples` contiennent au moins un élément.

## Test rapide

Pour tester si le jeu fonctionne, créez un chapitre avec ce JSON minimal :

```json
{
  "title": "Test JSON File Types",
  "type": "game",
  "game_content": {
    "gameType": "json-file-types",
    "description": "Test",
    "fileTypes": [
      {
        "id": "package.json",
        "name": "package.json",
        "description": "Test",
        "color": "bg-red-500"
      }
    ],
    "examples": [
      {
        "id": 1,
        "content": "{}",
        "correctType": "package.json",
        "explanation": "Test"
      }
    ]
  }
}
```

## Si l'erreur persiste

1. Vérifiez la console du navigateur pour l'erreur complète
2. Vérifiez que tous les fichiers sont bien sauvegardés
3. Redémarrez le serveur de développement (`npm run dev`)
4. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)

