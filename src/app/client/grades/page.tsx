import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GRADE_LABELS, GRADE_THRESHOLDS } from "@/types/database";
import type { Grade } from "@/types/database";
import { Trophy, Lock, CheckCircle } from "lucide-react";

const GRADES_ORDER: Grade[] = ["recrue", "membre", "confirme", "pionnier", "ambassadeur"];

const GRADE_PERKS: Record<Grade, string[]> = {
  recrue: ["Accès au matching de base", "Dépôt de fiches de poste"],
  membre: ["Matching avancé (top 10 profils)", "Badge Membre"],
  confirme: ["Matching premium (top 20 profils)", "Accès prioritaire aux nouveaux candidats", "Badge Confirmé"],
  pionnier: ["Matching illimité", "Rapport de matching détaillé", "Badge Pionnier", "Accès anticipé aux nouvelles fonctionnalités"],
  ambassadeur: ["Tous les avantages Pionnier", "Account manager dédié", "Badge Ambassadeur", "Co-construction du produit"],
};

export default async function ClientGradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clientData } = await supabase
    .from("clients")
    .select("grade, xp")
    .eq("id", user.id)
    .single();

  const currentGrade = (clientData?.grade ?? "recrue") as Grade;
  const currentXp = clientData?.xp ?? 0;
  const currentIndex = GRADES_ORDER.indexOf(currentGrade);

  const nextGrade = GRADES_ORDER[currentIndex + 1] as Grade | undefined;
  const nextThreshold = nextGrade ? GRADE_THRESHOLDS[nextGrade] : null;
  const progress = nextThreshold
    ? Math.min(100, Math.round((currentXp / nextThreshold) * 100))
    : 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-syne text-3xl font-bold text-white">Grades & Progression</h1>
        <p className="mt-1 text-slate-400">
          Gagnez des XP en utilisant la plateforme pour débloquer de nouveaux avantages.
        </p>
      </div>

      {/* Current grade card */}
      <Card className="border-quantum-accent/30 bg-quantum-accent/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Votre grade actuel</p>
              <p className="font-syne text-3xl font-bold text-quantum-gold">
                {GRADE_LABELS[currentGrade]}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {currentXp} XP
                {nextGrade && (
                  <> · {GRADE_THRESHOLDS[nextGrade] - currentXp} XP pour atteindre {GRADE_LABELS[nextGrade]}</>
                )}
              </p>
            </div>
            <Trophy className="h-12 w-12 text-quantum-gold opacity-60" />
          </div>
          {nextGrade && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{GRADE_LABELS[currentGrade]}</span>
                <span>{GRADE_LABELS[nextGrade]}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-quantum-gold transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-slate-500">{progress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All grades */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GRADES_ORDER.map((grade, i) => {
          const unlocked = i <= currentIndex;
          const isCurrent = grade === currentGrade;
          return (
            <Card
              key={grade}
              className={
                isCurrent
                  ? "border-quantum-gold/40 bg-quantum-gold/5"
                  : unlocked
                  ? "border-white/10"
                  : "border-white/5 opacity-60"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className={isCurrent ? "text-quantum-gold" : "text-white"}>
                    {GRADE_LABELS[grade]}
                  </span>
                  {unlocked ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-500" />
                  )}
                </CardTitle>
                <p className="text-xs text-slate-400">
                  {GRADE_THRESHOLDS[grade] === 0 ? "Dès l'inscription" : `À partir de ${GRADE_THRESHOLDS[grade]} XP`}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {GRADE_PERKS[grade].map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-0.5 text-quantum-accent">•</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* XP actions */}
      <Card>
        <CardHeader>
          <CardTitle>Comment gagner des XP ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { action: "Parrainer une entreprise", xp: "+200 XP" },
              { action: "Profil client complet", xp: "+100 XP" },
              { action: "Placement réussi", xp: "+500 XP" },
              { action: "Message dans la communauté", xp: "+5 XP" },
              { action: "Ancienneté (mensuel)", xp: "+50 XP" },
            ].map(({ action, xp }) => (
              <div
                key={action}
                className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-300">{action}</span>
                <span className="font-mono font-bold text-quantum-gold">{xp}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
