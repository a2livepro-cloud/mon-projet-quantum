import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CvthequeClient } from "./cvtheque-client";
import { CVTHEQUE_QUOTA, CVTHEQUE_MIN_GRADE } from "@/lib/cvtheque";
import type { Grade } from "@/types/database";

export default async function CvthequePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Grade + quota du client
  const { data: clientData } = await supabase
    .from("clients")
    .select("grade")
    .eq("id", user.id)
    .single();
  const grade = (clientData?.grade ?? "recrue") as Grade;
  const quota = CVTHEQUE_QUOTA[grade];

  // Utilisation ce mois-ci
  let usedThisMonth = 0;
  if (quota !== 0) {
    const admin = createAdminClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from("cvtheque_match_logs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .gte("created_at", startOfMonth.toISOString());
    usedThisMonth = count ?? 0;
  }

  // Connexion BEETWEEN existante
  const { data: cvtheque } = await supabase
    .from("cvtheques")
    .select("id, nom, api_url, statut, derniere_sync, nb_candidats, erreur_msg")
    .eq("client_id", user.id)
    .eq("source", "beetween")
    .single();

  // Fiches actives
  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre, secteur, competences_requises")
    .eq("client_id", user.id)
    .eq("statut", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">CVthèque externe</h1>
        <p className="mt-1 text-slate-400">
          Connectez votre CVthèque BEETWEEN pour retrouver les profils oubliés ou mal triés.
        </p>
      </div>
      <CvthequeClient
        cvtheque={cvtheque ?? null}
        fiches={fiches ?? []}
        grade={grade}
        quota={quota}
        usedThisMonth={usedThisMonth}
        minGrade={CVTHEQUE_MIN_GRADE}
      />
    </div>
  );
}
