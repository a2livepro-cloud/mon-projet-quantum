import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTEUR_LABELS, DISPO_LABELS, GRADE_LABELS } from "@/types/database";
import { ProfilForm } from "./profil-form";

export default async function CandidatProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: candidat } = await supabase
    .from("candidats")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const completion =
    candidat?.secteur &&
    candidat?.annees_experience &&
    candidat?.disponibilite &&
    (candidat?.competences?.length ?? 0) > 0
      ? 100
      : [
          candidat?.secteur,
          candidat?.annees_experience,
          candidat?.disponibilite,
          candidat?.competences?.length,
        ].filter(Boolean).length * 25;

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">Mon profil</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
            <CardDescription>
              Complétez votre profil pour améliorer le matching (et gagner des XP).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-400">
              <span className="text-white">Nom :</span> {profile?.full_name ?? "—"}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-white">Email :</span> {profile?.email ?? "—"}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-white">Secteur :</span>{" "}
              {candidat?.secteur ? (SECTEUR_LABELS as Record<string, string>)[candidat.secteur] : "—"}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-white">Expérience :</span>{" "}
              {candidat?.annees_experience ?? "—"}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-white">Disponibilité :</span>{" "}
              {candidat?.disponibilite
                ? (DISPO_LABELS as Record<string, string>)[candidat.disponibilite]
                : "—"}
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-white">Grade :</span>{" "}
              {candidat?.grade ? (GRADE_LABELS as Record<string, string>)[candidat.grade] : "—"} ({candidat?.xp ?? 0} XP)
            </p>
            <p className="text-sm">
              <span className="text-white">Complétion :</span>{" "}
              <span className="text-quantum-accent">{completion}%</span>
            </p>
            {candidat?.referral_code && (
              <p className="text-sm text-slate-400">
                <span className="text-white">Votre code parrainage :</span>{" "}
                <code className="rounded bg-white/10 px-1">{candidat.referral_code}</code>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Modifier le profil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilForm candidat={candidat} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
