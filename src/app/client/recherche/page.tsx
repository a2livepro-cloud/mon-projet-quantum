import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RechercheForm } from "./recherche-form";

export default async function ClientRecherchePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Fetch client's active fiches for the "Je veux aller plus loin" dialog
  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre")
    .eq("client_id", user.id)
    .eq("statut", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">
          Recherche de profils
        </h1>
        <p className="mt-1 text-slate-400">
          Filtrez librement parmi les candidats disponibles. Tous les profils sont anonymisés — Quantum gère la mise en relation.
        </p>
      </div>
      <RechercheForm fiches={fiches ?? []} />
    </div>
  );
}
