-- Cosine similarity: 1 - (embedding <=> fiche_embedding) gives similarity in [0,1]
CREATE OR REPLACE FUNCTION match_candidats_to_fiche(
  fiche_embedding vector(1536),
  match_count INT DEFAULT 30
)
RETURNS TABLE (candidat_id UUID, score FLOAT) AS $$
  SELECT
    c.id AS candidat_id,
    (1 - (c.embedding <=> fiche_embedding))::FLOAT AS score
  FROM candidats c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> fiche_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
