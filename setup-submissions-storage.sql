-- Script pour créer et configurer le bucket 'submissions' dans Supabase Storage
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket 'submissions' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false, -- Privé par défaut
  10485760, -- 10MB max
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique RLS pour permettre aux utilisateurs d'uploader leurs propres fichiers
CREATE POLICY "Users can upload their own submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Politique RLS pour permettre aux utilisateurs de lire leurs propres fichiers
CREATE POLICY "Users can read their own submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique RLS pour permettre aux admins/formateurs de lire tous les fichiers
CREATE POLICY "Admins and trainers can read all submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor', 'trainer')
  )
);

-- 5. Politique RLS pour permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "Users can update their own submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Politique RLS pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Vérifier que le bucket a été créé
SELECT * FROM storage.buckets WHERE id = 'submissions';

