-- Champ motivation pour les candidatures sans code parrainage
ALTER TABLE candidats
  ADD COLUMN IF NOT EXISTS motivation TEXT;
