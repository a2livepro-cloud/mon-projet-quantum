import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Zap } from "lucide-react";

const STATUT_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  pourvue: { label: "Pourvue", variant: "secondary" },
  archivee: { label: "Archivée", variant: "outline" },
};

export default async function ClientFichesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: fiches } = await supabase
    .from("fiches_poste")
    .select("id, titre, secteur, type_contrat, statut, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const ficheIds = (fiches ?? []).map((f) => f.id);

  // Count matchings per fiche
  const { data: matchingCounts } =
    ficheIds.length > 0
      ? await supabase
          .from("matchings")
          .select("fiche_id")
          .in("fiche_id", ficheIds)
      : { data: [] };

  const countByFiche: Record<string, number> = {};
  for (const m of matchingCounts ?? []) {
    countByFiche[m.fiche_id] = (countByFiche[m.fiche_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-3xl font-bold text-white">Mes fiches de poste</h1>
          <p className="mt-1 text-slate-400">
            {fiches?.length ?? 0} fiche{(fiches?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/client/fiches/nouvelle">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle fiche
          </Button>
        </Link>
      </div>

      {!fiches || fiches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400">Aucune fiche de poste pour le moment.</p>
            <p className="mt-1 text-sm text-slate-500">
              Déposez votre première fiche pour lancer le matching automatique.
            </p>
            <Link href="/client/fiches/nouvelle" className="mt-4 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Déposer une fiche
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fiches.map((f) => {
            const badge = STATUT_BADGE[f.statut] ?? { label: f.statut, variant: "outline" as const };
            const nbMatchings = countByFiche[f.id] ?? 0;
            return (
              <Card key={f.id} className="transition-colors hover:border-white/20">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-white">{f.titre ?? "Sans titre"}</p>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {f.secteur ?? "Secteur non précisé"}
                      {f.type_contrat ? ` · ${f.type_contrat}` : ""}
                      {" · "}
                      {new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-quantum-cyan">{nbMatchings}</p>
                      <p className="text-xs text-slate-500">profil{nbMatchings > 1 ? "s" : ""} matché{nbMatchings > 1 ? "s" : ""}</p>
                    </div>
                    <Link href={`/client/matching/${f.id}`}>
                      <Button size="sm" className="gap-2">
                        <Zap className="h-3 w-3" />
                        Matching
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
