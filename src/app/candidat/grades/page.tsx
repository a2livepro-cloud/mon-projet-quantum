import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  GRADE_THRESHOLDS,
  GRADE_LABELS,
  type Grade,
} from "@/types/database";

export default async function CandidatGradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: candidat } = await supabase
    .from("candidats")
    .select("xp, grade")
    .eq("id", user.id)
    .single();

  const xp = candidat?.xp ?? 0;
  const currentGrade = (candidat?.grade as Grade) ?? "recrue";
  const gradesOrder: Grade[] = ["recrue", "membre", "confirme", "pionnier", "ambassadeur"];
  const currentIndex = gradesOrder.indexOf(currentGrade);
  const nextGrade = gradesOrder[currentIndex + 1];
  const currentThreshold = GRADE_THRESHOLDS[currentGrade];
  const nextThreshold = nextGrade ? GRADE_THRESHOLDS[nextGrade] : currentThreshold;
  const progressInGrade = nextGrade
    ? Math.min(100, ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold text-white">Mes grades & XP</h1>
      <Card>
        <CardHeader>
          <CardTitle>Grade actuel</CardTitle>
          <p className="text-2xl font-bold text-quantum-gold">
            {currentGrade ? GRADE_LABELS[currentGrade] : "Recrue"}
          </p>
          <p className="text-slate-400">{xp} XP</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextGrade && (
            <>
              <p className="text-sm text-slate-400">
                Progression vers {GRADE_LABELS[nextGrade]} ({nextThreshold} XP)
              </p>
              <Progress value={progressInGrade} className="h-3" />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Seuils des grades</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {gradesOrder.map((g) => (
              <li
                key={g}
                className={
                  g === currentGrade
                    ? "flex justify-between text-quantum-gold"
                    : "flex justify-between text-slate-400"
                }
              >
                <span>{GRADE_LABELS[g]}</span>
                <span>{GRADE_THRESHOLDS[g]} XP</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Pionnier : invitation sortie annuelle Jeff · Ambassadeur : dîner privé Jeff + sortie annuelle
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
