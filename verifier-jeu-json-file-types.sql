-- Script pour vérifier que le chapitre avec le jeu JSON File Types est correctement configuré

-- 1. Vérifier que le chapitre existe et a le bon type
SELECT 
  id,
  title,
  type,
  item_id,
  CASE 
    WHEN game_content IS NULL THEN 'NULL'
    WHEN game_content::text = '{}' THEN 'EMPTY OBJECT'
    ELSE 'HAS CONTENT'
  END as game_content_status,
  game_content->>'gameType' as game_type
FROM chapters
WHERE type = 'game'
  AND game_content->>'gameType' = 'json-file-types'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier la structure du game_content
SELECT 
  id,
  title,
  game_content->>'gameType' as game_type,
  jsonb_array_length(game_content->'fileTypes') as file_types_count,
  jsonb_array_length(game_content->'examples') as examples_count,
  game_content->'fileTypes'->0 as first_file_type,
  game_content->'examples'->0 as first_example
FROM chapters
WHERE type = 'game'
  AND game_content->>'gameType' = 'json-file-types'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier que fileTypes et examples sont bien des tableaux
SELECT 
  id,
  title,
  jsonb_typeof(game_content->'fileTypes') as file_types_type,
  jsonb_typeof(game_content->'examples') as examples_type,
  CASE 
    WHEN jsonb_typeof(game_content->'fileTypes') = 'array' THEN 'OK'
    ELSE 'ERROR: Not an array'
  END as file_types_check,
  CASE 
    WHEN jsonb_typeof(game_content->'examples') = 'array' THEN 'OK'
    ELSE 'ERROR: Not an array'
  END as examples_check
FROM chapters
WHERE type = 'game'
  AND game_content->>'gameType' = 'json-file-types'
ORDER BY created_at DESC
LIMIT 1;

