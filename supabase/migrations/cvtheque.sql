-- CVthèques externes (connexions BEETWEEN par client)
CREATE TABLE IF NOT EXISTS cvtheques (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source      VARCHAR(50) NOT NULL DEFAULT 'beetween',
  nom         VARCHAR(255),
  api_url     TEXT NOT NULL DEFAULT 'https://api.beetween.fr',
  api_key     TEXT NOT NULL,
  statut      VARCHAR(20) NOT NULL DEFAULT 'inactive', -- inactive | active | error
  derniere_sync TIMESTAMPTZ,
  nb_candidats  INTEGER NOT NULL DEFAULT 0,
  erreur_msg    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, source)
);

-- Candidats importés depuis les CVthèques externes (privés par client)
CREATE TABLE IF NOT EXISTS candidats_externes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cvtheque_id   UUID NOT NULL REFERENCES cvtheques(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  external_id   VARCHAR(255),                 -- ID dans BEETWEEN
  quantum_id    VARCHAR(50) UNIQUE NOT NULL,  -- QTM-EXT-xxxxxx
  competences   TEXT[] NOT NULL DEFAULT '{}',
  secteur       TEXT,
  annees_experience TEXT,
  localisation  TEXT,
  disponibilite TEXT,
  source_label  TEXT,                         -- ex: "BEETWEEN – Ingénieurs aéro"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cvtheque_id, external_id)
);

-- Matchings entre fiches de poste et candidats externes
CREATE TABLE IF NOT EXISTS matchings_externes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id             UUID NOT NULL REFERENCES fiches_poste(id) ON DELETE CASCADE,
  candidat_externe_id  UUID NOT NULL REFERENCES candidats_externes(id) ON DELETE CASCADE,
  score                FLOAT NOT NULL,
  matched_competences  TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fiche_id, candidat_externe_id)
);

-- Journal des requêtes de matching CVthèque (pour le quota mensuel)
CREATE TABLE IF NOT EXISTS cvtheque_match_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fiche_id   UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS : chaque client ne voit que ses propres données
ALTER TABLE cvtheques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_cvtheque" ON cvtheques
  USING (client_id = auth.uid());

ALTER TABLE candidats_externes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_candidats_externes" ON candidats_externes
  USING (client_id = auth.uid());

ALTER TABLE matchings_externes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_matchings_externes" ON matchings_externes
  USING (
    fiche_id IN (
      SELECT id FROM fiches_poste WHERE client_id = auth.uid()
    )
  );
