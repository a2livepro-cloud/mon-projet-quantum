-- Row Level Security

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidats ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_poste ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's profile
CREATE OR REPLACE FUNCTION auth.user_profile()
RETURNS TABLE (id UUID, role profile_role, status profile_status) AS $$
  SELECT p.id, p.role, p.status FROM profiles p WHERE p.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: user sees own profile; admin sees all
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY profiles_select_admin ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- candidats: candidat sees own row only; admin sees all
CREATE POLICY candidats_select_own ON candidats FOR SELECT
  USING (id = auth.uid());
CREATE POLICY candidats_select_admin ON candidats FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY candidats_insert_own ON candidats FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY candidats_update_own ON candidats FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY candidats_update_admin ON candidats FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- clients: client sees own row only; admin sees all
CREATE POLICY clients_select_own ON clients FOR SELECT
  USING (id = auth.uid());
CREATE POLICY clients_select_admin ON clients FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY clients_insert_own ON clients FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY clients_update_own ON clients FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY clients_update_admin ON clients FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- fiches_poste: client sees own fiches; admin sees all
CREATE POLICY fiches_select_own ON fiches_poste FOR SELECT
  USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY fiches_insert_own ON fiches_poste FOR INSERT
  WITH CHECK (client_id = auth.uid());
CREATE POLICY fiches_update_own ON fiches_poste FOR UPDATE
  USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY fiches_delete_own ON fiches_poste FOR DELETE
  USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- matchings: client sees matchings for their fiches (anon view via API); admin sees all
CREATE POLICY matchings_select_client ON matchings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM fiches_poste f WHERE f.id = matchings.fiche_id AND f.client_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY matchings_insert_admin ON matchings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- Client peut insérer un matching "interested" pour ses propres fiches
CREATE POLICY matchings_insert_client_interested ON matchings FOR INSERT
  WITH CHECK (
    statut = 'interested'
    AND EXISTS (SELECT 1 FROM fiches_poste f WHERE f.id = matchings.fiche_id AND f.client_id = auth.uid())
  );
CREATE POLICY matchings_update_admin ON matchings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- xp_logs: user sees own logs; admin sees all
CREATE POLICY xp_logs_select_own ON xp_logs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY xp_logs_select_admin ON xp_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY xp_logs_insert_service ON xp_logs FOR INSERT
  WITH CHECK (true); -- restricted by app (service role or admin)

-- messages: anyone approved can read/write in channels
CREATE POLICY messages_select ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- referrals: referrer sees own referrals; admin sees all
CREATE POLICY referrals_select_own ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY referrals_select_admin ON referrals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY referrals_insert ON referrals FOR INSERT
  WITH CHECK (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY referrals_insert_admin ON referrals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY referrals_update_admin ON referrals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
