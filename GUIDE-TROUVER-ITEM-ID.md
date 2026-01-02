# Guide : Trouver l'ID de votre item

## Problème

Vous avez l'erreur :
```
ERROR: 23503: insert or update on table "chapters" violates foreign key constraint
Key (item_id)=(9266adf5-539a-4b9e-9fe2-c238732713aa) is not present in table "items"
```

Cela signifie que l'ID que vous avez utilisé n'existe pas dans la table `items`.

## Solution : Trouver le bon ID

### Étape 1 : Exécuter la requête pour trouver vos items

Ouvrez le fichier `trouver-item-id.sql` et exécutez une des requêtes dans Supabase SQL Editor.

**Recommandation :** Utilisez la requête "Option 1" pour voir tous vos items avec leurs modules et cours :

```sql
SELECT 
  i.id as item_id,
  i.title as item_title,
  i.type as item_type,
  i.position as item_position,
  m.title as module_title,
  c.title as course_title
FROM items i
JOIN modules m ON i.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY c.title, m.position, i.position;
```

### Étape 2 : Copier l'ID de l'item souhaité

Dans les résultats, trouvez l'item dans lequel vous voulez créer le chapitre et copiez son `item_id`.

**Exemple de résultat :**
```
item_id                                | item_title              | item_type  | module_title | course_title
--------------------------------------|-------------------------|------------|--------------|-------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Introduction aux APIs   | resource   | Module 1     | Cours API
b2c3d4e5-f6a7-8901-bcde-f12345678901 | Exercice pratique       | exercise   | Module 1     | Cours API
```

### Étape 3 : Utiliser l'ID dans le script

1. Ouvrez `insert-json-file-types-game.sql`
2. Remplacez `'YOUR_ITEM_ID'` par l'ID que vous avez copié
3. **Important :** Gardez les guillemets simples autour de l'ID

**Exemple :**
```sql
-- ❌ Incorrect
INSERT INTO chapters (item_id, ...) VALUES (9266adf5-539a-4b9e-9fe2-c238732713aa, ...)

-- ✅ Correct
INSERT INTO chapters (item_id, ...) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', ...)
```

## Alternative : Créer un item si vous n'en avez pas

Si vous n'avez pas d'item, créez-en un d'abord :

```sql
-- 1. Trouvez l'ID de votre module
SELECT id, title FROM modules ORDER BY created_at DESC LIMIT 5;

-- 2. Créez un item (remplacez YOUR_MODULE_ID)
INSERT INTO items (module_id, type, title, position, content)
VALUES (
  'YOUR_MODULE_ID',  -- Remplacez par l'ID de votre module
  'resource',        -- Type : resource, slide, exercise, tp, ou game
  'Mon Item',        -- Titre de l'item
  0,                 -- Position
  '{}'::jsonb        -- Contenu vide pour commencer
)
RETURNING id, title;  -- Retourne l'ID créé

-- 3. Utilisez l'ID retourné dans le script insert-json-file-types-game.sql
```

## Vérification

Après avoir créé le chapitre, vérifiez qu'il a été créé correctement :

```sql
SELECT 
  id,
  title,
  type,
  item_id,
  game_content->>'gameType' as game_type
FROM chapters
WHERE title = 'Jeu : Types de fichiers JSON'
ORDER BY created_at DESC
LIMIT 1;
```

Vous devriez voir :
- `type` = `'game'`
- `game_type` = `'json-file-types'`
- `item_id` correspond à l'ID que vous avez utilisé

