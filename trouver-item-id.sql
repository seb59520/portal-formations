-- Script pour trouver l'ID d'un item existant
-- Exécutez cette requête pour voir tous vos items

-- Option 1 : Voir tous les items avec leurs modules et cours
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

-- Option 2 : Chercher un item spécifique par titre
SELECT 
  i.id as item_id,
  i.title as item_title,
  i.type as item_type,
  m.title as module_title,
  c.title as course_title
FROM items i
JOIN modules m ON i.module_id = m.id
JOIN courses c ON m.course_id = c.id
WHERE i.title ILIKE '%votre recherche%'  -- Remplacez par votre recherche
ORDER BY i.created_at DESC;

-- Option 3 : Voir les items récemment créés
SELECT 
  i.id as item_id,
  i.title as item_title,
  i.type as item_type,
  i.created_at,
  m.title as module_title
FROM items i
JOIN modules m ON i.module_id = m.id
ORDER BY i.created_at DESC
LIMIT 10;

-- Option 4 : Voir les items d'un module spécifique
SELECT 
  i.id as item_id,
  i.title as item_title,
  i.type as item_type,
  i.position
FROM items i
JOIN modules m ON i.module_id = m.id
WHERE m.title ILIKE '%nom du module%'  -- Remplacez par le nom de votre module
ORDER BY i.position;

