-- Exemple : Créer un programme qui fusionne plusieurs formations
-- ⚠️ REMPLACEZ 'VOTRE_USER_ID' par votre UUID utilisateur admin/instructor

DO $$
DECLARE
  user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
  program_id_var UUID;
  course1_id UUID;
  course2_id UUID;
  course3_id UUID;
BEGIN
  -- Récupérer les IDs des formations à fusionner (remplacez par vos vrais IDs)
  -- Exemple : récupérer les 3 premières formations publiées
  SELECT id INTO course1_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO course2_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO course3_id FROM courses WHERE status = 'published' ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Si aucune formation n'existe, créer des formations d'exemple
  IF course1_id IS NULL THEN
    INSERT INTO courses (title, description, status, access_type, created_by)
    VALUES ('Formation 1', 'Description formation 1', 'published', 'free', user_uuid)
    RETURNING id INTO course1_id;
  END IF;

  IF course2_id IS NULL THEN
    INSERT INTO courses (title, description, status, access_type, created_by)
    VALUES ('Formation 2', 'Description formation 2', 'published', 'free', user_uuid)
    RETURNING id INTO course2_id;
  END IF;

  IF course3_id IS NULL THEN
    INSERT INTO courses (title, description, status, access_type, created_by)
    VALUES ('Formation 3', 'Description formation 3', 'published', 'free', user_uuid)
    RETURNING id INTO course3_id;
  END IF;

  -- Créer le programme
  INSERT INTO programs (title, description, status, access_type, created_by)
  VALUES (
    'Programme Complet - Fusion de Formations',
    'Ce programme regroupe plusieurs formations dans un parcours structuré',
    'published',
    'free',
    user_uuid
  )
  RETURNING id INTO program_id_var;

  -- Ajouter les formations au programme dans l'ordre souhaité
  INSERT INTO program_courses (program_id, course_id, position) VALUES
    (program_id_var, course1_id, 0),  -- Première formation (position 0)
    (program_id_var, course2_id, 1),  -- Deuxième formation (position 1)
    (program_id_var, course3_id, 2);  -- Troisième formation (position 2)

  RAISE NOTICE 'Programme créé avec ID: %', program_id_var;
  RAISE NOTICE 'Formations ajoutées: % (pos 0), % (pos 1), % (pos 2)', course1_id, course2_id, course3_id;
END $$;

-- Pour utiliser avec des IDs spécifiques, utilisez ce script :
/*
DO $$
DECLARE
  user_uuid UUID := 'VOTRE_USER_ID'::UUID;
  program_id_var UUID;
  -- Remplacez ces UUIDs par les IDs réels de vos formations
  course1_id UUID := 'uuid-formation-1'::UUID;
  course2_id UUID := 'uuid-formation-2'::UUID;
  course3_id UUID := 'uuid-formation-3'::UUID;
BEGIN
  -- Créer le programme
  INSERT INTO programs (title, description, status, access_type, created_by)
  VALUES (
    'Mon Programme Personnalisé',
    'Description du programme',
    'published',
    'free',
    user_uuid
  )
  RETURNING id INTO program_id_var;

  -- Ajouter les formations dans l'ordre
  INSERT INTO program_courses (program_id, course_id, position) VALUES
    (program_id_var, course1_id, 0),
    (program_id_var, course2_id, 1),
    (program_id_var, course3_id, 2);
END $$;
*/

