-- Vérifier le contenu complet de game_content pour le chapitre de jeu
SELECT 
  id,
  title,
  type,
  game_content,
  game_content->>'gameType' as game_type,
  game_content->'levels' as levels,
  jsonb_array_length(game_content->'levels') as levels_count,
  game_content->'levels'->0->>'name' as first_level_name
FROM chapters
WHERE id = 'ebc5e1db-cbb7-4037-8bef-7a80ccd0e610';

