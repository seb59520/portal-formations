-- Script de diagnostic pour vérifier les incohérences de rôles utilisateur
-- À exécuter dans l'interface SQL de Supabase

-- 1. Lister tous les utilisateurs avec leurs rôles dans profiles et org_members
SELECT 
  p.id,
  p.full_name,
  p.role as profile_role,
  p.created_at as profile_created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'org_id', om.org_id,
        'org_name', o.name,
        'org_role', om.role,
        'org_created_at', om.created_at
      )
    ) FILTER (WHERE om.id IS NOT NULL),
    '[]'::json
  ) as org_memberships
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.id
LEFT JOIN orgs o ON o.id = om.org_id
GROUP BY p.id, p.full_name, p.role, p.created_at
ORDER BY p.created_at DESC;

-- 2. Identifier les utilisateurs avec des rôles incohérents
-- (admin dans profiles mais aussi membre d'org avec un rôle différent)
SELECT 
  p.id,
  p.full_name,
  p.role as profile_role,
  om.role as org_role,
  o.name as org_name,
  CASE 
    WHEN p.role = 'admin' AND om.role IS NOT NULL AND om.role != 'admin' THEN '⚠️ Admin dans profiles mais rôle différent dans org'
    WHEN p.role != 'admin' AND om.role = 'admin' THEN '⚠️ Admin dans org mais pas dans profiles'
    WHEN p.role IS NULL THEN '❌ Pas de rôle dans profiles'
    ELSE '✅ Cohérent'
  END as status
FROM profiles p
LEFT JOIN org_members om ON om.user_id = p.id
LEFT JOIN orgs o ON o.id = om.org_id
WHERE 
  (p.role = 'admin' AND om.role IS NOT NULL AND om.role != 'admin')
  OR (p.role != 'admin' AND om.role = 'admin')
  OR p.role IS NULL
ORDER BY status, p.full_name;

-- 3. Compter les utilisateurs par rôle (profiles)
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- 4. Compter les membres d'organisation par rôle
SELECT 
  role,
  COUNT(*) as count
FROM org_members
GROUP BY role
ORDER BY count DESC;

-- 5. Identifier les utilisateurs dans plusieurs organisations
SELECT 
  p.id,
  p.full_name,
  p.role as profile_role,
  COUNT(om.id) as org_count,
  array_agg(DISTINCT om.role) as org_roles,
  array_agg(DISTINCT o.name) as org_names
FROM profiles p
JOIN org_members om ON om.user_id = p.id
JOIN orgs o ON o.id = om.org_id
GROUP BY p.id, p.full_name, p.role
HAVING COUNT(om.id) > 1
ORDER BY org_count DESC;

