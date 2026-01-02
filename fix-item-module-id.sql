-- Script pour déplacer un item d'un module à un autre
-- Remplacez les valeurs entre < > par vos IDs réels

-- 1. D'abord, trouvez l'ID du module 0 (celui où vous voulez mettre le jeu)
-- Exécutez cette requête pour voir tous les modules avec leur position :
SELECT id, title, position, course_id 
FROM modules 
ORDER BY position ASC;

-- 2. Trouvez l'ID de votre jeu "Jeu format de fichier"
-- Exécutez cette requête :
SELECT id, title, type, module_id, position 
FROM items 
WHERE title ILIKE '%format%' OR title ILIKE '%fichier%'
ORDER BY created_at DESC;

-- 3. Une fois que vous avez les IDs, mettez à jour le module_id du jeu
-- Remplacez <ID_DU_JEU> par l'ID de votre jeu
-- Remplacez <ID_DU_MODULE_0> par l'ID du module 0
UPDATE items 
SET module_id = '<ID_DU_MODULE_0>',
    updated_at = NOW()
WHERE id = '<ID_DU_JEU>'
  AND title ILIKE '%format%';

-- 4. Vérifiez que la mise à jour a fonctionné
SELECT 
  i.id,
  i.title,
  i.type,
  i.module_id,
  m.title as module_title,
  m.position as module_position
FROM items i
LEFT JOIN modules m ON i.module_id = m.id
WHERE i.id = '<ID_DU_JEU>';

-- Alternative : Si vous connaissez le titre exact du module 0
-- Remplacez <TITRE_MODULE_0> par le titre exact du module 0
UPDATE items 
SET module_id = (
  SELECT id FROM modules 
  WHERE position = 0 
  AND course_id = (
    SELECT course_id FROM modules 
    WHERE id = items.module_id
  )
  LIMIT 1
),
updated_at = NOW()
WHERE title = 'Jeu format de fichier'
  AND module_id IN (
    SELECT id FROM modules WHERE position = 13
  );

