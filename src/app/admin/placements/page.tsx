import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPlacementsPage() {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("matchings")
    .select("id, fiche_id, candidat_id, statut, created_at")
    .in("statut", ["interested", "placed"])
    .order("created_at", { ascending: false });

  const matchings = list ?? [];
  const ficheIds = Array.from(new Set(matchings.map((m) => m.fiche_id)));
  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre, client_id")
    .in("id", ficheIds);
  const clientIds = Array.from(new Set((fiches ?? []).map((f) => f.client_id)));
  const { data: clients } = await supabase
    .from("clients")
    .select("id, nom_entreprise")
    .in("id", clientIds);
  const fichesMap = new Map((fiches ?? []).map((f) => [f.id, f]));
  const clientsMap = new Map((clients ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">
        Placements & portages
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Demandes « Je veux aller plus loin » et placements</CardTitle>
        </CardHeader>
        <CardContent>
          {matchings.length === 0 ? (
            <p className="text-slate-400">Aucune demande pour le moment.</p>
          ) : (
            <ul className="space-y-4">
              {matchings.map((m) => {
                const f = fichesMap.get(m.fiche_id);
                const client = f ? clientsMap.get(f.client_id) : null;
                return (
                  <li
                    key={m.id}
                    className="rounded-lg border border-white/10 p-4"
                  >
                    <p className="font-medium text-white">{f?.titre ?? "Fiche"}</p>
                    <p className="text-sm text-slate-400">
                      Client : {client?.nom_entreprise ?? f?.client_id}
                    </p>
                    <p className="text-sm text-slate-400">
                      Candidat : {m.candidat_id}
                    </p>
                    <p className="text-sm">
                      Statut : <span className="text-quantum-gold">{m.statut}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
