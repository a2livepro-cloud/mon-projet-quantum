import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTEUR_LABELS, DISPO_LABELS, GRADE_LABELS } from "@/types/database";
import type { SecteurCandidat, Disponibilite } from "@/types/database";
import { MatchingResults } from "./matching-results";

export default async function ClientMatchingPage({
  params,
}: {
  params: Promise<{ ficheId: string }>;
}) {
  const { ficheId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: fiche } = await supabase
    .from("fiches_poste")
    .select("id, titre, client_id")
    .eq("id", ficheId)
    .single();

  if (!fiche || fiche.client_id !== user.id) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">
        Matching — {fiche.titre ?? "Fiche"}
      </h1>
      <p className="text-slate-400">
        Profils anonymisés, triés par score de compatibilité. Pour aller plus loin avec un profil, cliquez sur « Je veux aller plus loin » : Quantum gérera la mise en relation.
      </p>
      <MatchingResults ficheId={ficheId} />
    </div>
  );
}
