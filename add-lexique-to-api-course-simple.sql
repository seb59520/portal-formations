-- ============================================================================
-- Script d'ajout : Lexique API dans le cours "Développement d'API Professionnelles"
-- Version simplifiée
-- ============================================================================

-- 1. Décaler les positions des items existants du Module 1
UPDATE items
SET position = position + 1
WHERE module_id IN (
  SELECT id FROM modules 
  WHERE course_id IN (
    SELECT id FROM courses 
    WHERE title = 'Développement d''API Professionnelles'
  )
  AND title = 'Fondamentaux et Paradigmes d''API'
);

-- 2. Insérer le lexique en position 0
INSERT INTO items (id, module_id, type, title, position, content, published)
SELECT 
  gen_random_uuid(),
  m.id,
  'resource',
  'Lexique API - Termes fondamentaux',
  0,
  '{"isLexique": true, "body": "Lexique des termes fondamentaux sur les APIs"}'::jsonb,
  true
FROM modules m
INNER JOIN courses c ON m.course_id = c.id
WHERE c.title = 'Développement d''API Professionnelles'
  AND m.title = 'Fondamentaux et Paradigmes d''API'
  AND NOT EXISTS (
    SELECT 1 FROM items i 
    WHERE i.module_id = m.id 
    AND i.title ILIKE '%lexique%'
  );

