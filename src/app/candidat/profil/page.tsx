import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SECTEUR_LABELS,
  GRADE_LABELS,
  GRADE_THRESHOLDS,
  type Grade,
  type SecteurCandidat,
} from "@/types/database";
import { ProfilForm } from "./profil-form";
import { CvSection } from "./cv-section";
import { Trophy, Zap, CheckCircle2, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const XP_ACTION_LABELS: Record<string, string> = {
  parrainage: "Parrainage",
  profil_complet: "Profil complété",
  message_tchat: "Message communauté",
  placement: "Placement",
  anciennete: "Ancienneté",
  admin_ajustement: "Ajustement admin",
};

const GRADE_COLORS: Record<
  Grade,
  { text: string; bg: string; border: string; bar: string }
> = {
  recrue:      { text: "text-slate-300",  bg: "bg-slate-400/10",  border: "border-slate-400/30",  bar: "bg-slate-400" },
  membre:      { text: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   bar: "bg-blue-400" },
  confirme:    { text: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/30",   bar: "bg-cyan-400" },
  pionnier:    { text: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30",  bar: "bg-amber-400" },
  ambassadeur: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", bar: "bg-yellow-400" },
};

export default async function CandidatProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: candidat }, { data: profile }, { data: xpLogs }] =
    await Promise.all([
      supabase.from("candidats").select("*").eq("id", user.id).single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single(),
      supabase
        .from("xp_logs")
        .select("action, points, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const xp = candidat?.xp ?? 0;
  const currentGrade = (candidat?.grade as Grade) ?? "recrue";
  const gradesOrder: Grade[] = [
    "recrue",
    "membre",
    "confirme",
    "pionnier",
    "ambassadeur",
  ];
  const currentIndex = gradesOrder.indexOf(currentGrade);
  const nextGrade = gradesOrder[currentIndex + 1] as Grade | undefined;
  const currentThreshold = GRADE_THRESHOLDS[currentGrade];
  const nextThreshold = nextGrade ? GRADE_THRESHOLDS[nextGrade] : xp;
  const progressInGrade = nextGrade
    ? Math.min(
        100,
        Math.max(
          0,
          ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
        )
      )
    : 100;

  const gradeColors = GRADE_COLORS[currentGrade];
  const secteurValides = (candidat?.secteurs_valides ?? []) as SecteurCandidat[];

  const completion =
    [
      candidat?.secteur,
      candidat?.annees_experience,
      candidat?.disponibilite,
      candidat?.competences?.length,
    ].filter(Boolean).length * 25;

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">Mon profil</h1>

      {/* XP Hero card */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Bienvenue,</p>
              <h2 className="text-xl font-semibold text-white">
                {profile?.full_name ?? "Candidat"}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  gradeColors.bg,
                  gradeColors.border,
                  gradeColors.text
                )}
              >
                <Trophy className="h-3 w-3" />
                {GRADE_LABELS[currentGrade]}
              </span>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white tabular-nums">
                {xp.toLocaleString("fr-FR")}
              </p>
              <p className="text-sm text-slate-500">points XP</p>
            </div>
          </div>

          {nextGrade ? (
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{GRADE_LABELS[currentGrade]}</span>
                <span>
                  {(xp - currentThreshold).toLocaleString("fr-FR")} /{" "}
                  {(nextThreshold - currentThreshold).toLocaleString("fr-FR")}{" "}
                  XP → {GRADE_LABELS[nextGrade]}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    gradeColors.bar
                  )}
                  style={{ width: `${progressInGrade}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-yellow-400">
              Grade maximum atteint — Ambassadeur !
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — infos */}
        <div className="space-y-4">
          {/* Canaux validés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Canaux validés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {secteurValides.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {secteurValides.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20"
                    >
                      {SECTEUR_LABELS[s]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aucun canal activé pour le moment. L&apos;équipe validera vos
                  accès après validation de votre profil.
                </p>
              )}
            </CardContent>
          </Card>

          {/* CV */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-quantum-cyan" />
                Curriculum Vitæ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CvSection candidatId={user.id} hasCv={!!candidat?.cv_url} />
            </CardContent>
          </Card>

          {/* Complétude */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-quantum-gold" />
                Complétude du profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Complétion</span>
                <span
                  className={
                    completion === 100
                      ? "font-semibold text-green-400"
                      : "text-quantum-gold"
                  }
                >
                  {completion}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    completion === 100 ? "bg-green-400" : "bg-quantum-gold"
                  )}
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">
                Profil complet = +100 XP & meilleur matching
              </p>
            </CardContent>
          </Card>

          {/* Activité récente */}
          {xpLogs && xpLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {xpLogs.map((log, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {XP_ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      <span className="text-xs font-semibold text-quantum-gold">
                        +{log.points} XP
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — edit form */}
        <div className="lg:col-span-2">
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
    </div>
  );
}
