-- ============================================================================
-- Script de création : Cours "Développement d'API Professionnelles"
-- ============================================================================
-- Ce script crée la structure complète du cours avec :
-- - 1 cours
-- - 11 modules
-- - 40 leçons (items)
-- - 150+ chapitres
--
-- IMPORTANT: Remplacez 'VOTRE_USER_ID' par l'UUID d'un utilisateur admin/instructor
-- Vous pouvez obtenir votre UUID avec : SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
-- ============================================================================

DO $$
DECLARE
  -- UUIDs à remplacer
  user_uuid UUID := 'VOTRE_USER_ID'::UUID; -- ⚠️ REMPLACEZ CETTE VALEUR
  
  -- Variables pour stocker les IDs
  course_id_var UUID;
  -- Modules
  m1_id UUID; m2_id UUID; m3_id UUID; m4_id UUID; m5_id UUID;
  m6_id UUID; m7_id UUID; m8_id UUID; m9_id UUID; m10_id UUID; m11_id UUID;
  -- Items (leçons)
  lexique_id UUID; i1_id UUID; i2_id UUID; i3_id UUID; i4_id UUID; i5_id UUID; i6_id UUID; i7_id UUID;
  i8_id UUID; i9_id UUID; i10_id UUID; i11_id UUID; i12_id UUID; i13_id UUID; i14_id UUID;
  i15_id UUID; i16_id UUID; i17_id UUID; i18_id UUID; i19_id UUID; i20_id UUID;
  i21_id UUID; i22_id UUID; i23_id UUID; i24_id UUID; i25_id UUID; i26_id UUID;
  i27_id UUID; i28_id UUID; i29_id UUID; i30_id UUID; i31_id UUID; i32_id UUID;
  i33_id UUID; i34_id UUID; i35_id UUID; i36_id UUID; i37_id UUID; i38_id UUID;
  i39_id UUID; i40_id UUID; i41_id UUID; i42_id UUID; i43_id UUID; i44_id UUID;
  i45_id UUID; i46_id UUID; i47_id UUID;
BEGIN
  -- ============================================================================
  -- 1. CRÉATION DU COURS
  -- ============================================================================
  
  INSERT INTO courses (id, title, description, status, access_type, created_by)
  VALUES (
    gen_random_uuid(),
    'Développement d''API Professionnelles',
    'Formation complète sur le développement d''API modernes : REST, GraphQL, sécurité, tests, performance, micro-services, et déploiement. Projet fil rouge Full-Stack PWA inclus.',
    'published',
    'free',
    user_uuid
  )
  RETURNING id INTO course_id_var;
  
  -- ============================================================================
  -- 2. MODULE 1 : Fondamentaux et Paradigmes d'API (6h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Fondamentaux et Paradigmes d''API', 1)
  RETURNING id INTO m1_id;
  
  -- Lexique API - Termes fondamentaux (position 0)
  INSERT INTO items (id, module_id, type, title, position, content, published) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'Lexique API - Termes fondamentaux', 0, 
     '{"isLexique": true, "body": "Lexique des termes fondamentaux sur les APIs"}'::jsonb, 
     true)
  RETURNING id INTO lexique_id;
  
  -- Leçon 1.1 : Introduction aux API et écosystème (position 1)
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'Introduction aux API et écosystème', 1)
  RETURNING id INTO i1_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i1_id, 'Qu''est-ce qu''une API ? Rôles et enjeux', 1),
    (i1_id, 'Architecture client-serveur et communication HTTP', 2),
    (i1_id, 'Formats de données (JSON, XML, Protobuf)', 3),
    (i1_id, 'Écosystème moderne (API Gateway, Service Mesh)', 4);
  
  -- Leçon 1.2 : RESTful API
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'RESTful API - Principes et bonnes pratiques', 2)
  RETURNING id INTO i2_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i2_id, 'Principes REST (ressources, méthodes HTTP, stateless)', 1),
    (i2_id, 'Design des URLs et structure des ressources', 2),
    (i2_id, 'Codes de statut HTTP et sémantique', 3),
    (i2_id, 'HATEOAS et hypermédia', 4);
  
  -- Leçon 1.3 : GraphQL
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'GraphQL - Alternative moderne', 3)
  RETURNING id INTO i3_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i3_id, 'Concepts GraphQL (schema, queries, mutations)', 1),
    (i3_id, 'Avantages et cas d''usage', 2),
    (i3_id, 'Résolveurs et DataLoader', 3),
    (i3_id, 'Comparaison REST vs GraphQL', 4);
  
  -- Leçon 1.4 : RPC et gRPC
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m1_id, 'resource', 'RPC et gRPC - Performance et typage fort', 4)
  RETURNING id INTO i4_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i4_id, 'Principes RPC (Remote Procedure Call)', 1),
    (i4_id, 'gRPC et Protobuf', 2),
    (i4_id, 'Streaming et cas d''usage', 3),
    (i4_id, 'WebSocket pour le temps réel', 4);
  
  -- ============================================================================
  -- 3. MODULE 2 : Spécifications et Contrats (5h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Spécifications et Contrats', 2)
  RETURNING id INTO m2_id;
  
  -- Leçon 2.1 : OpenAPI 3 et Swagger
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m2_id, 'resource', 'OpenAPI 3 et Swagger', 1)
  RETURNING id INTO i5_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i5_id, 'Introduction à OpenAPI 3.0', 1),
    (i5_id, 'Structure d''une spécification (paths, components, schemas)', 2),
    (i5_id, 'Swagger UI et génération de documentation', 3),
    (i5_id, 'Validation et outils (Swagger Editor, Postman)', 4);
  
  -- Leçon 2.2 : JSON Schema
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m2_id, 'resource', 'JSON Schema et validation', 2)
  RETURNING id INTO i6_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i6_id, 'Structure JSON Schema', 1),
    (i6_id, 'Validation des données (types, formats, contraintes)', 2),
    (i6_id, 'Références et composition ($ref, allOf, oneOf)', 3),
    (i6_id, 'Intégration dans OpenAPI', 4);
  
  -- Leçon 2.3 : Versioning
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m2_id, 'resource', 'Versioning sémantique et stratégies', 3)
  RETURNING id INTO i7_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i7_id, 'Semantic Versioning (SemVer) pour les API', 1),
    (i7_id, 'Stratégies de versioning (URL, header, négociation de contenu)', 2),
    (i7_id, 'Gestion de la rétrocompatibilité', 3),
    (i7_id, 'Dépréciation et migration', 4);
  
  -- ============================================================================
  -- 4. MODULE 3 : Modélisation et Persistance (6h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Modélisation et Persistance', 3)
  RETURNING id INTO m3_id;
  
  -- Leçon 3.1 : Modélisation des données
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m3_id, 'resource', 'Modélisation des données', 1)
  RETURNING id INTO i8_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i8_id, 'Design de schémas de base de données', 1),
    (i8_id, 'Relations et normalisation', 2),
    (i8_id, 'Patterns de modélisation (DDD, CQRS)', 3),
    (i8_id, 'Mapping API ↔ Base de données', 4);
  
  -- Leçon 3.2 : ORM
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m3_id, 'resource', 'ORM - Prisma, TypeORM, Sequelize', 2)
  RETURNING id INTO i9_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i9_id, 'Introduction aux ORM (avantages, inconvénients)', 1),
    (i9_id, 'Prisma (schema, migrations, client)', 2),
    (i9_id, 'TypeORM (entities, repositories, relations)', 3),
    (i9_id, 'Comparaison et choix d''un ORM', 4);
  
  -- Leçon 3.3 : Migrations
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m3_id, 'resource', 'Migrations et évolution du schéma', 3)
  RETURNING id INTO i10_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i10_id, 'Concept de migrations', 1),
    (i10_id, 'Création et exécution de migrations', 2),
    (i10_id, 'Rollback et gestion des erreurs', 3),
    (i10_id, 'Migrations en production', 4);
  
  -- Leçon 3.4 : Transactions
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m3_id, 'resource', 'Transactions et concurrence', 4)
  RETURNING id INTO i11_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i11_id, 'Transactions ACID', 1),
    (i11_id, 'Isolation levels et problèmes de concurrence', 2),
    (i11_id, 'Optimistic vs Pessimistic locking', 3),
    (i11_id, 'Patterns de gestion de la concurrence', 4);
  
  -- ============================================================================
  -- 5. MODULE 4 : Sécurité by Design (8h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Sécurité by Design', 4)
  RETURNING id INTO m4_id;
  
  -- Leçon 4.1 : Authentification
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'Authentification et autorisation', 1)
  RETURNING id INTO i12_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i12_id, 'OAuth2 - Principes et flows (Authorization Code, Client Credentials)', 1),
    (i12_id, 'OIDC (OpenID Connect) et identity providers', 2),
    (i12_id, 'JWT (structure, signature, validation)', 3),
    (i12_id, 'Refresh tokens et rotation', 4);
  
  -- Leçon 4.2 : RBAC/ABAC
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'RBAC et ABAC', 2)
  RETURNING id INTO i13_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i13_id, 'Role-Based Access Control (RBAC)', 1),
    (i13_id, 'Attribute-Based Access Control (ABAC)', 2),
    (i13_id, 'Implémentation dans les API', 3),
    (i13_id, 'Gestion des permissions granulaires', 4);
  
  -- Leçon 4.3 : Protection
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'Protection contre les attaques', 3)
  RETURNING id INTO i14_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i14_id, 'Rate limiting (stratégies, implémentations)', 1),
    (i14_id, 'CORS et sécurité des headers', 2),
    (i14_id, 'Validation et sanitization des inputs', 3),
    (i14_id, 'Protection CSRF et XSS', 4);
  
  -- Leçon 4.4 : OWASP
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'OWASP API Top 10', 4)
  RETURNING id INTO i15_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i15_id, 'Vulnérabilités #1-3 (Broken Authentication, Excessive Data Exposure, Lack of Resources)', 1),
    (i15_id, 'Vulnérabilités #4-6 (Broken Authorization, Security Misconfiguration, Injection)', 2),
    (i15_id, 'Vulnérabilités #7-10 (Improper Asset Management, Logging, Mass Assignment)', 3),
    (i15_id, 'Audit de sécurité et bonnes pratiques', 4);
  
  -- Leçon 4.5 : Chiffrement
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m4_id, 'resource', 'Chiffrement et secrets', 5)
  RETURNING id INTO i16_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i16_id, 'HTTPS/TLS et certificats', 1),
    (i16_id, 'Chiffrement des données sensibles', 2),
    (i16_id, 'Gestion des secrets (variables d''environnement, vaults)', 3),
    (i16_id, 'Hashing et salage des mots de passe', 4);
  
  -- ============================================================================
  -- 6. MODULE 5 : Gestion des Erreurs et Observabilité (5h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Gestion des Erreurs et Observabilité', 5)
  RETURNING id INTO m5_id;
  
  -- Leçon 5.1 : Gestion des erreurs
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m5_id, 'resource', 'Gestion des erreurs', 1)
  RETURNING id INTO i17_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i17_id, 'Codes HTTP et sémantique des erreurs', 1),
    (i17_id, 'Enveloppes d''erreurs standardisées (RFC 7807)', 2),
    (i17_id, 'Gestion des exceptions et middleware', 3),
    (i17_id, 'Erreurs métier vs erreurs techniques', 4);
  
  -- Leçon 5.2 : Logging
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m5_id, 'resource', 'Logging structuré', 2)
  RETURNING id INTO i18_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i18_id, 'Principes du logging structuré (JSON)', 1),
    (i18_id, 'Niveaux de log (DEBUG, INFO, WARN, ERROR)', 2),
    (i18_id, 'Context et corrélation (request ID, trace ID)', 3),
    (i18_id, 'Centralisation (ELK, Loki, CloudWatch)', 4);
  
  -- Leçon 5.3 : Tracing
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m5_id, 'resource', 'Tracing avec OpenTelemetry', 3)
  RETURNING id INTO i19_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i19_id, 'Concepts de distributed tracing', 1),
    (i19_id, 'OpenTelemetry (spans, traces, instrumentation)', 2),
    (i19_id, 'Intégration dans les API', 3),
    (i19_id, 'Visualisation (Jaeger, Zipkin, Tempo)', 4);
  
  -- Leçon 5.4 : Métriques
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m5_id, 'resource', 'Métriques et monitoring', 4)
  RETURNING id INTO i20_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i20_id, 'Métriques clés (latence, throughput, erreurs)', 1),
    (i20_id, 'Prometheus et exposition de métriques', 2),
    (i20_id, 'Alerting et seuils', 3),
    (i20_id, 'Dashboards (Grafana, Datadog)', 4);
  
  -- ============================================================================
  -- 7. MODULE 6 : Tests et Qualité (6h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Tests et Qualité', 6)
  RETURNING id INTO m6_id;
  
  -- Leçon 6.1 : Tests unitaires
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m6_id, 'resource', 'Tests unitaires', 1)
  RETURNING id INTO i21_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i21_id, 'Principes et structure (AAA pattern)', 1),
    (i21_id, 'Mocking et stubs (Jest, Sinon)', 2),
    (i21_id, 'Tests de services et repositories', 3),
    (i21_id, 'Coverage et métriques de qualité', 4);
  
  -- Leçon 6.2 : Tests d'intégration
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m6_id, 'resource', 'Tests d''intégration', 2)
  RETURNING id INTO i22_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i22_id, 'Tests d''endpoints (supertest, axios)', 1),
    (i22_id, 'Tests avec base de données (fixtures, seeds)', 2),
    (i22_id, 'Tests d''authentification et autorisation', 3),
    (i22_id, 'Tests de performance basiques', 4);
  
  -- Leçon 6.3 : Tests contractuels
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m6_id, 'resource', 'Tests contractuels avec Pact', 3)
  RETURNING id INTO i23_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i23_id, 'Consumer-Driven Contracts', 1),
    (i23_id, 'Pact (setup, interactions, verification)', 2),
    (i23_id, 'CI/CD et intégration continue', 3),
    (i23_id, 'Gestion des breaking changes', 4);
  
  -- Leçon 6.4 : CI/CD
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m6_id, 'resource', 'CI/CD automatisée', 4)
  RETURNING id INTO i24_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i24_id, 'Pipelines CI (lint, tests, build)', 1),
    (i24_id, 'Tests automatisés dans CI', 2),
    (i24_id, 'Quality gates et reporting', 3),
    (i24_id, 'Intégration avec GitHub Actions / GitLab CI', 4);
  
  -- ============================================================================
  -- 8. MODULE 7 : Performance et Scalabilité (5h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Performance et Scalabilité', 7)
  RETURNING id INTO m7_id;
  
  -- Leçon 7.1 : Pagination
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m7_id, 'resource', 'Pagination et filtrage', 1)
  RETURNING id INTO i25_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i25_id, 'Pagination offset-based vs cursor-based', 1),
    (i25_id, 'Implémentation cursor-based (performance)', 2),
    (i25_id, 'Filtrage et recherche avancée', 3),
    (i25_id, 'Tri et tri multi-colonnes', 4);
  
  -- Leçon 7.2 : Cache
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m7_id, 'resource', 'Cache et optimisation', 2)
  RETURNING id INTO i26_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i26_id, 'Stratégies de cache (HTTP cache, application cache)', 1),
    (i26_id, 'Redis pour le cache distribué', 2),
    (i26_id, 'Invalidation et TTL', 3),
    (i26_id, 'Cache-aside, write-through, write-behind', 4);
  
  -- Leçon 7.3 : Compression
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m7_id, 'resource', 'Compression et optimisation réseau', 3)
  RETURNING id INTO i27_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i27_id, 'Compression HTTP (gzip, brotli)', 1),
    (i27_id, 'Optimisation des payloads (field selection, sparse fieldsets)', 2),
    (i27_id, 'CDN et mise en cache statique', 3),
    (i27_id, 'HTTP/2 et multiplexing', 4);
  
  -- Leçon 7.4 : Métriques
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m7_id, 'resource', 'Métriques de performance', 4)
  RETURNING id INTO i28_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i28_id, 'Latence, throughput, p95/p99', 1),
    (i28_id, 'Métriques Prometheus (histograms, summaries)', 2),
    (i28_id, 'Profiling et identification des bottlenecks', 3),
    (i28_id, 'Load testing (k6, Artillery, JMeter)', 4);
  
  -- ============================================================================
  -- 9. MODULE 8 : Architecture Micro-services et Event-Driven (6h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Architecture Micro-services et Event-Driven', 8)
  RETURNING id INTO m8_id;
  
  -- Leçon 8.1 : Micro-services
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Architecture micro-services', 1)
  RETURNING id INTO i29_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i29_id, 'Principes et avantages/inconvénients', 1),
    (i29_id, 'Communication inter-services (synchrones, asynchrones)', 2),
    (i29_id, 'Service discovery et API Gateway', 3),
    (i29_id, 'Patterns de décomposition', 4);
  
  -- Leçon 8.2 : Event-Driven
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Event-Driven Architecture', 2)
  RETURNING id INTO i30_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i30_id, 'Concepts (events, producers, consumers)', 1),
    (i30_id, 'Event sourcing et CQRS', 2),
    (i30_id, 'Saga pattern pour transactions distribuées', 3),
    (i30_id, 'Choreography vs Orchestration', 4);
  
  -- Leçon 8.3 : Message brokers
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Message brokers - RabbitMQ et Kafka', 3)
  RETURNING id INTO i31_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i31_id, 'RabbitMQ (queues, exchanges, routing)', 1),
    (i31_id, 'Apache Kafka (topics, partitions, consumers groups)', 2),
    (i31_id, 'Comparaison et cas d''usage', 3),
    (i31_id, 'Intégration dans les API', 4);
  
  -- Leçon 8.4 : Résilience
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Résilience et patterns', 4)
  RETURNING id INTO i32_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i32_id, 'Circuit breaker (Hystrix, Resilience4j)', 1),
    (i32_id, 'Retry et exponential backoff', 2),
    (i32_id, 'Bulkhead et isolation', 3),
    (i32_id, 'Idempotence et idempotency keys', 4);
  
  -- Leçon 8.5 : Serverless
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m8_id, 'resource', 'Serverless et FaaS', 5)
  RETURNING id INTO i33_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i33_id, 'Concepts serverless (Lambda, Cloud Functions)', 1),
    (i33_id, 'API serverless (API Gateway, Serverless Framework)', 2),
    (i33_id, 'Cold start et optimisations', 3),
    (i33_id, 'Cas d''usage et limites', 4);
  
  -- ============================================================================
  -- 10. MODULE 9 : Documentation et Portail Développeur (3h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Documentation et Portail Développeur', 9)
  RETURNING id INTO m9_id;
  
  -- Leçon 9.1 : Génération automatique
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m9_id, 'resource', 'Génération automatique de documentation', 1)
  RETURNING id INTO i34_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i34_id, 'OpenAPI comme source de vérité', 1),
    (i34_id, 'Génération depuis le code (annotations, decorators)', 2),
    (i34_id, 'Swagger UI et Redoc', 3),
    (i34_id, 'Documentation interactive', 4);
  
  -- Leçon 9.2 : Exemples
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m9_id, 'resource', 'Exemples et guides', 2)
  RETURNING id INTO i35_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i35_id, 'Exemples d''appels (cURL, Postman, SDK)', 1),
    (i35_id, 'Guides de démarrage rapide', 2),
    (i35_id, 'Cas d''usage et scénarios', 3),
    (i35_id, 'FAQ et troubleshooting', 4);
  
  -- Leçon 9.3 : Sandbox
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m9_id, 'resource', 'Sandbox et environnement de test', 3)
  RETURNING id INTO i36_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i36_id, 'Environnements (dev, staging, sandbox)', 1),
    (i36_id, 'Données de test et seeds', 2),
    (i36_id, 'Mock servers et simulation', 3),
    (i36_id, 'Politique de versioning et changelog', 4);
  
  -- ============================================================================
  -- 11. MODULE 10 : Déploiement Continu (4h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Déploiement Continu', 10)
  RETURNING id INTO m10_id;
  
  -- Leçon 10.1 : Conteneurisation
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m10_id, 'resource', 'Conteneurisation', 1)
  RETURNING id INTO i37_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i37_id, 'Docker et Dockerfile (best practices)', 1),
    (i37_id, 'Multi-stage builds et optimisation', 2),
    (i37_id, 'Docker Compose pour le développement', 3),
    (i37_id, 'Sécurité des images (scanning, minimal images)', 4);
  
  -- Leçon 10.2 : Pipelines CI/CD
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m10_id, 'resource', 'Pipelines CI/CD', 2)
  RETURNING id INTO i38_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i38_id, 'Pipeline de déploiement (build, test, deploy)', 1),
    (i38_id, 'GitHub Actions / GitLab CI / Jenkins', 2),
    (i38_id, 'Secrets management dans CI/CD', 3),
    (i38_id, 'Automatisation complète', 4);
  
  -- Leçon 10.3 : Stratégies de déploiement
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m10_id, 'resource', 'Stratégies de déploiement', 3)
  RETURNING id INTO i39_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i39_id, 'Blue-Green deployment', 1),
    (i39_id, 'Canary releases', 2),
    (i39_id, 'Rolling updates', 3),
    (i39_id, 'Feature flags et dark launches', 4);
  
  -- Leçon 10.4 : Infrastructure as Code
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m10_id, 'resource', 'Infrastructure as Code', 4)
  RETURNING id INTO i40_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i40_id, 'Terraform / CloudFormation', 1),
    (i40_id, 'Kubernetes basics (deployments, services)', 2),
    (i40_id, 'Helm charts et gestion de configuration', 3),
    (i40_id, 'Monitoring du déploiement', 4);
  
  -- ============================================================================
  -- 12. MODULE 11 : Projet Fil Rouge - Application Full-Stack PWA (10h)
  -- ============================================================================
  
  INSERT INTO modules (id, course_id, title, position) VALUES
    (gen_random_uuid(), course_id_var, 'Projet Fil Rouge - Application Full-Stack PWA', 11)
  RETURNING id INTO m11_id;
  
  -- Leçon 11.1 : Architecture
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Architecture et setup du projet', 1)
  RETURNING id INTO i41_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i41_id, 'Définition des besoins et architecture', 1),
    (i41_id, 'Setup backend (Express/Prisma/PostgreSQL)', 2),
    (i41_id, 'Setup frontend PWA (React/Vite)', 3),
    (i41_id, 'Configuration CI/CD initiale', 4);
  
  -- Leçon 11.2 : Authentification
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Authentification et autorisation', 2)
  RETURNING id INTO i42_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i42_id, 'Implémentation JWT/OAuth2', 1),
    (i42_id, 'RBAC côté backend', 2),
    (i42_id, 'Protection des routes frontend', 3),
    (i42_id, 'Refresh tokens et gestion de session', 4);
  
  -- Leçon 11.3 : API REST/GraphQL
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'API REST/GraphQL - Catalogue et panier', 3)
  RETURNING id INTO i43_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i43_id, 'Design de l''API (OpenAPI spec)', 1),
    (i43_id, 'Endpoints catalogue (CRUD, recherche, filtrage)', 2),
    (i43_id, 'Panier temps réel (WebSocket ou polling)', 3),
    (i43_id, 'Validation et gestion d''erreurs', 4);
  
  -- Leçon 11.4 : Paiement
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Paiement fictif et transactions', 4)
  RETURNING id INTO i44_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i44_id, 'Modélisation du processus de paiement', 1),
    (i44_id, 'Transactions et rollback', 2),
    (i44_id, 'Webhooks et notifications', 3),
    (i44_id, 'Gestion des erreurs de paiement', 4);
  
  -- Leçon 11.5 : Dashboard admin
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Dashboard admin', 5)
  RETURNING id INTO i45_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i45_id, 'API admin (statistiques, gestion utilisateurs)', 1),
    (i45_id, 'Interface admin React', 2),
    (i45_id, 'Permissions et audit logs', 3),
    (i45_id, 'Export de données', 4);
  
  -- Leçon 11.6 : Observabilité
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Observabilité et tests', 6)
  RETURNING id INTO i46_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i46_id, 'Logging structuré et tracing', 1),
    (i46_id, 'Métriques Prometheus', 2),
    (i46_id, 'Tests unitaires et d''intégration', 3),
    (i46_id, 'Tests de charge (k6)', 4);
  
  -- Leçon 11.7 : Déploiement
  INSERT INTO items (id, module_id, type, title, position) VALUES
    (gen_random_uuid(), m11_id, 'tp', 'Déploiement et production', 7)
  RETURNING id INTO i47_id;
  
  INSERT INTO chapters (item_id, title, position) VALUES
    (i47_id, 'Conteneurisation complète', 1),
    (i47_id, 'Pipeline CI/CD final', 2),
    (i47_id, 'Déploiement blue-green', 3),
    (i47_id, 'Monitoring en production', 4);
  
  RAISE NOTICE 'Cours créé avec succès ! ID du cours : %', course_id_var;
  
END $$;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Pour vérifier que tout a été créé correctement, exécutez :
-- 
-- SELECT 
--   c.title as course,
--   COUNT(DISTINCT m.id) as modules,
--   COUNT(DISTINCT i.id) as items,
--   COUNT(DISTINCT ch.id) as chapters
-- FROM courses c
-- LEFT JOIN modules m ON m.course_id = c.id
-- LEFT JOIN items i ON i.module_id = m.id
-- LEFT JOIN chapters ch ON ch.item_id = i.id
-- WHERE c.title = 'Développement d''API Professionnelles'
-- GROUP BY c.id, c.title;
