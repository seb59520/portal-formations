-- Solution 2 : Concaténation directe - Fusionner les modules de plusieurs formations dans une nouvelle formation
-- ⚠️ REMPLACEZ 'VOTRE_USER_ID' par votre UUID utilisateur admin/instructor

DO $$
DECLARE
  user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
  merged_course_id UUID;
  course1_id UUID;
  course2_id UUID;
  course3_id UUID;
  max_position INTEGER := 0;
  module_record RECORD;
  new_module_id UUID;
  old_module_id UUID;
  item_record RECORD;
  new_item_id UUID;
  old_item_id UUID;
BEGIN
  -- Récupérer les IDs des formations à fusionner (remplacez par vos vrais IDs)
  SELECT id INTO course1_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO course2_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO course3_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Créer la nouvelle formation fusionnée
  INSERT INTO courses (title, description, status, access_type, created_by)
  VALUES (
    'Formation Fusionnée - Toutes les Formations',
    'Formation créée en fusionnant plusieurs formations existantes',
    'published',
    'free',
    user_uuid
  )
  RETURNING id INTO merged_course_id;

  -- Copier les modules de la première formation
  FOR module_record IN 
    SELECT * FROM modules WHERE course_id = course1_id ORDER BY position
  LOOP
    old_module_id := module_record.id;
    
    -- Créer le nouveau module
    INSERT INTO modules (course_id, title, position)
    VALUES (merged_course_id, module_record.title, max_position)
    RETURNING id INTO new_module_id;
    
    -- Copier les items de l'ancien module vers le nouveau
    FOR item_record IN 
      SELECT * FROM items WHERE module_id = old_module_id ORDER BY position
    LOOP
      old_item_id := item_record.id;
      
      INSERT INTO items (module_id, type, title, content, asset_path, external_url, position, published)
      VALUES (
        new_module_id,
        item_record.type,
        item_record.title,
        item_record.content,
        item_record.asset_path,
        item_record.external_url,
        item_record.position,
        item_record.published
      )
      RETURNING id INTO new_item_id;
      
      -- Copier les chapitres de l'ancien item vers le nouveau
      INSERT INTO chapters (item_id, title, content, position)
      SELECT 
        new_item_id,
        title,
        content,
        position
      FROM chapters
      WHERE item_id = old_item_id;
    END LOOP;
    
    max_position := max_position + 1;
  END LOOP;

  -- Copier les modules de la deuxième formation
  FOR module_record IN 
    SELECT * FROM modules WHERE course_id = course2_id ORDER BY position
  LOOP
    old_module_id := module_record.id;
    
    INSERT INTO modules (course_id, title, position)
    VALUES (merged_course_id, module_record.title, max_position)
    RETURNING id INTO new_module_id;
    
    FOR item_record IN 
      SELECT * FROM items WHERE module_id = old_module_id ORDER BY position
    LOOP
      old_item_id := item_record.id;
      
      INSERT INTO items (module_id, type, title, content, asset_path, external_url, position, published)
      VALUES (
        new_module_id,
        item_record.type,
        item_record.title,
        item_record.content,
        item_record.asset_path,
        item_record.external_url,
        item_record.position,
        item_record.published
      )
      RETURNING id INTO new_item_id;
      
      INSERT INTO chapters (item_id, title, content, position)
      SELECT 
        new_item_id,
        title,
        content,
        position
      FROM chapters
      WHERE item_id = old_item_id;
    END LOOP;
    
    max_position := max_position + 1;
  END LOOP;

  -- Copier les modules de la troisième formation
  FOR module_record IN 
    SELECT * FROM modules WHERE course_id = course3_id ORDER BY position
  LOOP
    old_module_id := module_record.id;
    
    INSERT INTO modules (course_id, title, position)
    VALUES (merged_course_id, module_record.title, max_position)
    RETURNING id INTO new_module_id;
    
    FOR item_record IN 
      SELECT * FROM items WHERE module_id = old_module_id ORDER BY position
    LOOP
      old_item_id := item_record.id;
      
      INSERT INTO items (module_id, type, title, content, asset_path, external_url, position, published)
      VALUES (
        new_module_id,
        item_record.type,
        item_record.title,
        item_record.content,
        item_record.asset_path,
        item_record.external_url,
        item_record.position,
        item_record.published
      )
      RETURNING id INTO new_item_id;
      
      INSERT INTO chapters (item_id, title, content, position)
      SELECT 
        new_item_id,
        title,
        content,
        position
      FROM chapters
      WHERE item_id = old_item_id;
    END LOOP;
    
    max_position := max_position + 1;
  END LOOP;

  RAISE NOTICE 'Formation fusionnée créée avec ID: %', merged_course_id;
  RAISE NOTICE 'Total de modules copiés: %', max_position;
END $$;

-- ⚠️ NOTE : Cette solution crée une duplication des données
-- Les formations originales restent intactes, mais les modules sont copiés
-- Pour une solution plus flexible, utilisez plutôt add-programs-schema.sql

