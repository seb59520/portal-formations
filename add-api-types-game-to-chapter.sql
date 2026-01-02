-- ============================================================================
-- Script d'ajout : Mini-jeu "Types d'API" dans un chapitre
-- ============================================================================
-- Ce script crée un item de type "game" avec le jeu "Types d'API"
-- et l'ajoute directement dans le premier chapitre de la leçon 1.1
-- ============================================================================
-- ATTENTION: Ce script modifie le contenu d'un chapitre existant.
-- Si le chapitre a déjà du contenu, le jeu sera ajouté à la fin.
-- ============================================================================

DO $$
DECLARE
  -- Variables pour stocker les IDs
  game_item_id UUID;
  module_1_id UUID;
  lesson_1_1_id UUID;
  chapter_1_id UUID;
  existing_content JSONB;
  new_content JSONB;
  content_array JSONB;
BEGIN
  -- ============================================================================
  -- 1. TROUVER LE MODULE 1 ET LA LEÇON 1.1
  -- ============================================================================
  
  -- Trouver le module 1 (Fondamentaux et Paradigmes d'API)
  SELECT id INTO module_1_id
  FROM modules
  WHERE title = 'Fondamentaux et Paradigmes d''API'
  LIMIT 1;
  
  IF module_1_id IS NULL THEN
    RAISE EXCEPTION 'Module 1 non trouvé. Assurez-vous que le cours est créé.';
  END IF;
  
  -- Trouver la leçon 1.1 (Introduction aux API et écosystème)
  SELECT id INTO lesson_1_1_id
  FROM items
  WHERE module_id = module_1_id
    AND title = 'Introduction aux API et écosystème'
  LIMIT 1;
  
  IF lesson_1_1_id IS NULL THEN
    RAISE EXCEPTION 'Leçon 1.1 non trouvée. Assurez-vous que le cours est créé.';
  END IF;
  
  -- ============================================================================
  -- 2. CRÉER L'ITEM DE JEU (ou le récupérer s'il existe déjà)
  -- ============================================================================
  
  -- Vérifier si l'item existe déjà
  SELECT id INTO game_item_id
  FROM items
  WHERE module_id = module_1_id
    AND type = 'game'
    AND title = 'Jeu : Quel type d''API utiliser ?'
  LIMIT 1;
  
  IF game_item_id IS NULL THEN
    -- Créer l'item de jeu
    INSERT INTO items (
      id,
      module_id,
      type,
      title,
      position,
      content,
      published
    ) VALUES (
      gen_random_uuid(),
      module_1_id,
      'game',
      'Jeu : Quel type d''API utiliser ?',
      999,
      jsonb_build_object(
        'gameType', 'api-types',
        'description', 'Jeu interactif pour apprendre à choisir le bon type d''API selon le contexte',
        'instructions', 'Glissez le type d''API approprié pour chaque scénario, puis vérifiez vos réponses.',
        'apiTypes', jsonb_build_array(
          jsonb_build_object('id', 'rest', 'name', 'REST API', 'color', 'bg-blue-500', 'description', 'Architecture stateless avec ressources HTTP'),
          jsonb_build_object('id', 'graphql', 'name', 'GraphQL', 'color', 'bg-pink-500', 'description', 'Requêtes flexibles avec un seul endpoint'),
          jsonb_build_object('id', 'websocket', 'name', 'WebSocket', 'color', 'bg-green-500', 'description', 'Communication bidirectionnelle en temps réel'),
          jsonb_build_object('id', 'grpc', 'name', 'gRPC', 'color', 'bg-purple-500', 'description', 'RPC haute performance avec Protocol Buffers')
        ),
        'scenarios', jsonb_build_array(
          jsonb_build_object('id', 1, 'text', 'Application de chat en temps réel', 'correctType', 'websocket', 'explanation', 'WebSocket permet une communication bidirectionnelle instantanée, idéale pour le chat.'),
          jsonb_build_object('id', 2, 'text', 'CRUD simple pour un blog', 'correctType', 'rest', 'explanation', 'REST est parfait pour les opérations CRUD standards et simples.'),
          jsonb_build_object('id', 3, 'text', 'Application mobile qui doit minimiser la consommation de données', 'correctType', 'graphql', 'explanation', 'GraphQL permet de requêter exactement les données nécessaires, réduisant le transfert.'),
          jsonb_build_object('id', 4, 'text', 'Microservices internes nécessitant haute performance', 'correctType', 'grpc', 'explanation', 'gRPC offre de meilleures performances pour la communication entre services.'),
          jsonb_build_object('id', 5, 'text', 'Dashboard avec mises à jour de données en direct', 'correctType', 'websocket', 'explanation', 'WebSocket permet de pousser les mises à jour aux clients sans polling.'),
          jsonb_build_object('id', 6, 'text', 'API publique pour des développeurs tiers', 'correctType', 'rest', 'explanation', 'REST est le standard le plus adopté et facile à consommer par des tiers.'),
          jsonb_build_object('id', 7, 'text', 'Application avec des écrans très différents nécessitant des données variées', 'correctType', 'graphql', 'explanation', 'GraphQL évite le over-fetching et under-fetching avec des requêtes personnalisées.'),
          jsonb_build_object('id', 8, 'text', 'Système de trading boursier en temps réel', 'correctType', 'websocket', 'explanation', 'Les cotations boursières nécessitent des mises à jour temps réel avec latence minimale.')
        )
      ),
      true
    )
    RETURNING id INTO game_item_id;
    
    RAISE NOTICE 'Item de jeu créé avec l''ID: %', game_item_id;
  ELSE
    RAISE NOTICE 'Item de jeu existant trouvé avec l''ID: %', game_item_id;
  END IF;
  
  -- ============================================================================
  -- 3. TROUVER LE PREMIER CHAPITRE DE LA LEÇON 1.1
  -- ============================================================================
  
  SELECT id, content INTO chapter_1_id, existing_content
  FROM chapters
  WHERE item_id = lesson_1_1_id
  ORDER BY position ASC
  LIMIT 1;
  
  IF chapter_1_id IS NULL THEN
    RAISE EXCEPTION 'Aucun chapitre trouvé pour la leçon 1.1. Créez d''abord un chapitre.';
  END IF;
  
  -- ============================================================================
  -- 4. AJOUTER LE BLOC INTERACTIF DANS LE CONTENU DU CHAPITRE
  -- ============================================================================
  
  -- Initialiser le contenu s'il est NULL
  IF existing_content IS NULL THEN
    existing_content := jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array()
    );
  END IF;
  
  -- Vérifier si le bloc interactif existe déjà
  IF existing_content->'content' @> jsonb_build_array(
    jsonb_build_object(
      'type', 'interactiveBlock',
      'attrs', jsonb_build_object('itemId', game_item_id::text)
    )
  ) THEN
    RAISE NOTICE 'Le bloc interactif existe déjà dans ce chapitre.';
  ELSE
    -- Récupérer le tableau de contenu existant
    content_array := COALESCE(existing_content->'content', '[]'::jsonb);
    
    -- Ajouter le bloc interactif à la fin du contenu
    content_array := content_array || jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array()
      ),
      jsonb_build_object(
        'type', 'interactiveBlock',
        'attrs', jsonb_build_object(
          'type', 'game',
          'itemId', game_item_id::text,
          'title', 'Jeu : Quel type d''API utiliser ?'
        )
      ),
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array()
      )
    );
    
    -- Construire le nouveau contenu
    new_content := jsonb_set(
      existing_content,
      '{content}',
      content_array
    );
    
    -- Mettre à jour le chapitre
    UPDATE chapters
    SET content = new_content,
        updated_at = NOW()
    WHERE id = chapter_1_id;
    
    RAISE NOTICE 'Bloc interactif ajouté au chapitre avec succès.';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Script terminé avec succès !';
  RAISE NOTICE 'Le jeu est maintenant disponible dans le premier chapitre de la leçon 1.1.';
  RAISE NOTICE '========================================';
  
END $$;

