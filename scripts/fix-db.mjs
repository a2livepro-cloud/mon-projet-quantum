import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qckyededaevahcrjiuxq.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3llZGVkYWV2YWhjcmppdXhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzA1MiwiZXhwIjoyMDg3Njk5MDUyfQ.xnReAcFuGJKduBVu-MsSGdUzvsTKJd4TsRmjAnpqmZA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🔍 Récupération des utilisateurs auth...");
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) { console.error("Erreur listUsers:", usersError); process.exit(1); }
  console.log(`  → ${users.length} utilisateur(s) auth trouvé(s)`);

  console.log("🔍 Récupération des profils...");
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id");
  if (profilesError) { console.error("Erreur profiles:", profilesError.message); process.exit(1); }
  const profileIds = new Set((profiles || []).map((p) => p.id));
  console.log(`  → ${profileIds.size} profil(s) trouvé(s)`);

  const broken = users.filter((u) => !profileIds.has(u.id));
  console.log(`\n🛠  ${broken.length} utilisateur(s) sans profil détecté(s) :`);

  for (const u of broken) {
    console.log(`  - Suppression : ${u.email} (${u.id})`);
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.error(`    ✗ Erreur :`, error.message);
    else console.log(`    ✓ Supprimé`);
  }

  if (broken.length === 0) {
    console.log("  → Aucun compte cassé, tout est propre !");
  }

  console.log("\n✅ Nettoyage terminé.");
  console.log("\n⚠️  N'oublie pas d'exécuter dans Supabase SQL Editor :");
  console.log(`
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gdpr_consent_ip INET;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_motif TEXT;
  `);
}

main();
