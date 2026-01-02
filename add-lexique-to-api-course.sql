-- ============================================================================
-- Script d'ajout : Lexique API dans le cours "Développement d'API Professionnelles"
-- ============================================================================
-- Ce script ajoute un item "Lexique API" dans le Module 1 du cours API
-- Le lexique sera positionné en premier (position 0) pour être facilement accessible
-- ============================================================================

DO $$
DECLARE
  -- Trouver le cours "Développement d'API Professionnelles"
  course_id_var UUID;
  -- Trouver le Module 1 du cours
  m1_id UUID;
  -- ID pour le nouvel item lexique
  lexique_item_id UUID;
BEGIN
  -- 1. Trouver le cours API
  SELECT id INTO course_id_var
  FROM courses
  WHERE title = 'Développement d''API Professionnelles'
  LIMIT 1;
  
  IF course_id_var IS NULL THEN
    RAISE EXCEPTION 'Cours "Développement d''API Professionnelles" non trouvé. Assurez-vous que le cours existe.';
  END IF;
  
  -- 2. Trouver le Module 1 (Fondamentaux et Paradigmes d'API)
  SELECT id INTO m1_id
  FROM modules
  WHERE course_id = course_id_var
    AND title = 'Fondamentaux et Paradigmes d''API'
  LIMIT 1;
  
  IF m1_id IS NULL THEN
    RAISE EXCEPTION 'Module 1 "Fondamentaux et Paradigmes d''API" non trouvé.';
  END IF;
  
  -- 3. Vérifier si le lexique existe déjà
  SELECT id INTO lexique_item_id
  FROM items
  WHERE module_id = m1_id
    AND (title ILIKE '%lexique%' OR title ILIKE '%Lexique%')
  LIMIT 1;
  
  IF lexique_item_id IS NOT NULL THEN
    RAISE NOTICE 'Le lexique existe déjà avec l''ID: %', lexique_item_id;
    RAISE NOTICE 'Pour le recréer, supprimez d''abord l''item existant.';
    RETURN;
  END IF;
  
  -- 4. Décaler les positions des autres items du module 1
  UPDATE items
  SET position = position + 1
  WHERE module_id = m1_id;
  
  -- 5. Créer l'item Lexique en position 0
  INSERT INTO items (id, module_id, type, title, position, content, published)
  VALUES (
    gen_random_uuid(),
    m1_id,
    'resource',
    'Lexique API - Termes fondamentaux',
    0, -- Position 0 (premier)
    '{"isLexique": true, "body": "Lexique des termes fondamentaux sur les APIs"}'::jsonb,
    true
  )
  RETURNING id INTO lexique_item_id;
  
  RAISE NOTICE 'Lexique API créé avec succès !';
  RAISE NOTICE 'Item ID: %', lexique_item_id;
  RAISE NOTICE 'Module ID: %', m1_id;
  RAISE NOTICE 'Cours ID: %', course_id_var;
  
END $$;

