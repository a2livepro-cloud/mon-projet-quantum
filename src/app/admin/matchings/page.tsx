import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminMatchingsPage() {
  const supabase = await createClient();
  const { data: matchings } = await supabase
    .from("matchings")
    .select("id, fiche_id, candidat_id, score, source, statut, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = matchings ?? [];
  const ficheIds = Array.from(new Set(list.map((m) => m.fiche_id)));
  const candidatIds = Array.from(new Set(list.map((m) => m.candidat_id)));
  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre")
    .in("id", ficheIds);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", candidatIds);
  const fichesMap = new Map((fiches ?? []).map((f) => [f.id, f]));
  const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">
        Matchings
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Derniers matchings</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-slate-400">Aucun matching.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-400">
                    <th className="pb-2 pr-4">Fiche</th>
                    <th className="pb-2 pr-4">Candidat</th>
                    <th className="pb-2 pr-4">Score</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-white">
                        {fichesMap.get(m.fiche_id)?.titre ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {profilesMap.get(m.candidat_id)?.full_name ?? m.candidat_id}
                      </td>
                      <td className="py-3 pr-4">{Math.round((m.score ?? 0) * 100)}%</td>
                      <td className="py-3 pr-4 text-slate-400">{m.source}</td>
                      <td className="py-3 pr-4">{m.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
