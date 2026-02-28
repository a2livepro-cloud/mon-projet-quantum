import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Award, Plus, ArrowRight } from "lucide-react";

const STATUT_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  pourvue: { label: "Pourvue", variant: "secondary" },
  archivee: { label: "Archivée", variant: "outline" },
};

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre, statut, secteur, type_contrat, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: fichesActive } = await supabase
    .from("fiches_poste")
    .select("id", { count: "exact", head: true })
    .eq("client_id", user.id)
    .eq("statut", "active");

  const allFicheIds = (fiches ?? []).map((f) => f.id);

  const { count: matchingsCount } =
    allFicheIds.length > 0
      ? await supabase
          .from("matchings")
          .select("id", { count: "exact", head: true })
          .in("fiche_id", allFicheIds)
      : { count: 0 };

  const { count: placementsCount } = await supabase
    .from("matchings")
    .select("id", { count: "exact", head: true })
    .eq("statut", "accepte")
    .in("fiche_id", allFicheIds.length > 0 ? allFicheIds : ["00000000-0000-0000-0000-000000000000"]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-syne text-3xl font-bold text-white">Dashboard</h1>
        <Link href="/client/fiches/nouvelle">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle fiche de poste
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Fiches actives</CardTitle>
            <FileText className="h-4 w-4 text-quantum-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{fichesActive ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">fiches en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Profils matchés</CardTitle>
            <TrendingUp className="h-4 w-4 text-quantum-cyan" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{matchingsCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">profils compatibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Placements</CardTitle>
            <Award className="h-4 w-4 text-quantum-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{placementsCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">missions confirmées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières fiches de poste</CardTitle>
          <Link href="/client/fiches">
            <Button variant="outline" size="sm" className="gap-1">
              Voir toutes
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!fiches || fiches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400">Aucune fiche pour le moment.</p>
              <Link href="/client/fiches/nouvelle" className="mt-3 inline-block">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Déposer une fiche
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {fiches.map((f) => {
                const badge = STATUT_BADGE[f.statut] ?? { label: f.statut, variant: "outline" as const };
                return (
                  <li key={f.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-white">{f.titre ?? "Sans titre"}</p>
                      <p className="text-sm text-slate-400">
                        {f.secteur ?? "—"}
                        {f.type_contrat ? ` · ${f.type_contrat}` : ""}
                        {" · "}
                        {new Date(f.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Link href={`/client/matching/${f.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-quantum-accent hover:text-quantum-accent">
                          Matching
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
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
