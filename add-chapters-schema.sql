-- Ajout du système de chapitrage pour les items (leçons)
-- À exécuter dans l'interface SQL de Supabase

-- Table pour les chapitres
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB, -- Contenu riche du chapitre (format TipTap/JSON)
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_chapters_item_id ON chapters(item_id);
CREATE INDEX idx_chapters_position ON chapters(item_id, position);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Policies pour chapters
-- Lecture : même règles que les items
CREATE POLICY "Chapters viewable with item access" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = auth.uid()
      WHERE i.id = chapters.item_id
      AND (c.status = 'published' OR c.created_by = auth.uid() OR e.status = 'active')
    )
  );

-- Écriture : admins et instructeurs
CREATE POLICY "Admins and instructors can manage chapters" ON chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN modules m ON i.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = chapters.item_id
      AND (p.role = 'admin' OR (p.role = 'instructor' AND c.created_by = p.id))
    )
  );

