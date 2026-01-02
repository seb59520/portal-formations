# Guide : Créer le jeu "Types de fichiers JSON" via SQL

## ⚠️ Important : Remplacer l'ID de l'item

Avant d'exécuter le script SQL, vous devez trouver l'ID de l'item dans lequel vous voulez créer le chapitre.

### Étape 1 : Trouver l'ID de votre item

```sql
-- Lister tous vos items
SELECT 
  id,
  title,
  type,
  position
FROM items
ORDER BY created_at DESC;

-- Ou chercher un item spécifique
SELECT 
  id,
  title,
  type
FROM items
WHERE title ILIKE '%votre recherche%';
```

### Étape 2 : Exécuter le script SQL

1. Ouvrez le fichier `insert-json-file-types-game.sql`
2. Remplacez `'YOUR_ITEM_ID'` par l'ID réel de votre item (ex: `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'`)
3. Copiez-collez le script dans l'éditeur SQL de Supabase
4. Exécutez la requête

### Étape 3 : Vérifier la création

```sql
-- Vérifier que le chapitre a été créé
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  jsonb_array_length(game_content->'fileTypes') as file_types_count,
  jsonb_array_length(game_content->'examples') as examples_count
FROM chapters
WHERE title = 'Jeu : Types de fichiers JSON'
ORDER BY created_at DESC
LIMIT 1;
```

Vous devriez voir :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `file_types_count` = `8`
- `examples_count` = `8`

## Alternative : Via l'interface admin (plus simple)

Si vous préférez utiliser l'interface graphique :

1. Allez sur votre item dans `/admin/items/{itemId}`
2. Dans la section "Chapitres", cliquez sur "Ajouter un chapitre"
3. Cliquez sur "Ajouter un jeu"
4. Ouvrez l'éditeur JSON : `/admin/chapters/{chapterId}/json`
5. Copiez tout le contenu de `chapitre-jeu-json-file-types.json`
6. Collez dans l'éditeur et sauvegardez

## Dépannage

### Erreur : "invalid input syntax for type json"

**Cause :** Le JSON contient des caractères non échappés ou des placeholders `[...]`

**Solution :** Utilisez le fichier `insert-json-file-types-game.sql` qui contient le JSON complet et valide.

### Erreur : "violates foreign key constraint"

**Cause :** L'ID de l'item n'existe pas ou est incorrect.

**Solution :** Vérifiez que l'ID de l'item est correct avec la requête de l'étape 1.

### Le jeu ne s'affiche pas

**Vérifications :**
1. Le champ `type` est bien `'game'` ?
2. Le champ `game_content` contient bien `gameType: 'json-file-types'` ?
3. Les tableaux `fileTypes` et `examples` ne sont pas vides ?

```sql
SELECT 
  id,
  title,
  type,
  game_content->>'gameType' as game_type,
  game_content->'fileTypes' as file_types,
  game_content->'examples' as examples
FROM chapters
WHERE id = 'VOTRE_CHAPITRE_ID';
```

