-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum types
CREATE TYPE profile_role AS ENUM ('candidat', 'client', 'admin');
CREATE TYPE profile_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE secteur_candidat AS ENUM ('aeronautique', 'automobile', 'energie', 'robotique', 'industrie', 'bureau_etudes');
CREATE TYPE annees_experience AS ENUM ('0-2', '3-5', '6-10', '10+');
CREATE TYPE disponibilite AS ENUM ('immediate', '1_mois', '3_mois', 'veille');
CREATE TYPE grade AS ENUM ('recrue', 'membre', 'confirme', 'pionnier', 'ambassadeur');
CREATE TYPE matching_source AS ENUM ('reseau_jeff', 'beetween', 'sourcing_allan');
CREATE TYPE matching_statut AS ENUM ('suggested', 'viewed', 'interested', 'placed');
CREATE TYPE fiche_statut AS ENUM ('active', 'closed');
CREATE TYPE referral_status AS ENUM ('pending', 'validated');

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role profile_role NOT NULL,
  status profile_status NOT NULL DEFAULT 'pending',
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- candidats
CREATE TABLE candidats (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  secteur secteur_candidat,
  annees_experience annees_experience,
  disponibilite disponibilite,
  competences TEXT[] DEFAULT '{}',
  cv_url TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  grade grade NOT NULL DEFAULT 'recrue',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- clients
CREATE TABLE clients (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  secteur_activite TEXT,
  taille_entreprise TEXT,
  description_besoin TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  grade grade NOT NULL DEFAULT 'recrue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fiches_poste
CREATE TABLE fiches_poste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  titre TEXT,
  description TEXT,
  secteur TEXT,
  competences_requises TEXT[] DEFAULT '{}',
  localisation TEXT,
  type_contrat TEXT,
  statut fiche_statut NOT NULL DEFAULT 'active',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- matchings
CREATE TABLE matchings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id UUID NOT NULL REFERENCES fiches_poste(id) ON DELETE CASCADE,
  candidat_id UUID NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
  score FLOAT NOT NULL CHECK (score >= 0 AND score <= 1),
  source matching_source NOT NULL,
  statut matching_statut NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fiche_id, candidat_id)
);

-- xp_logs
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages (tchat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_channel_created ON messages(channel, created_at DESC);

-- referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- consentement RGPD (stockage timestamp + IP)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gdpr_consent_ip INET;
-- motif de refus (optionnel)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_motif TEXT;

-- Index for cosine similarity search on candidats
CREATE INDEX ON candidats USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for fiches_poste embedding
CREATE INDEX ON fiches_poste USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidats_updated_at BEFORE UPDATE ON candidats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate referral code (example: QTM-XXXX)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    code := 'QTM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    IF NOT EXISTS (SELECT 1 FROM candidats WHERE referral_code = code)
       AND NOT EXISTS (SELECT 1 FROM clients WHERE referral_code = code) THEN
      done := TRUE;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
