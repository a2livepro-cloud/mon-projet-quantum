import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const XP_PROFIL_COMPLET = 100;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: already } = await supabase
    .from("xp_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("action", "profil_complet")
    .limit(1)
    .single();
  if (already) return NextResponse.json({ ok: true, xp_awarded: 0 });

  const { data: candidat } = await supabase
    .from("candidats")
    .select("secteur, annees_experience, disponibilite, competences, xp, grade")
    .eq("id", user.id)
    .single();

  if (!candidat) return NextResponse.json({ ok: true, xp_awarded: 0 });
  const complete =
    candidat.secteur &&
    candidat.annees_experience &&
    candidat.disponibilite &&
    (candidat.competences?.length ?? 0) > 0;
  if (!complete) return NextResponse.json({ ok: true, xp_awarded: 0 });

  await supabase.from("xp_logs").insert({
    user_id: user.id,
    action: "profil_complet",
    points: XP_PROFIL_COMPLET,
  });
  const newXp = (candidat.xp ?? 0) + XP_PROFIL_COMPLET;
  const newGrade = computeGrade(newXp);
  await supabase.from("candidats").update({ xp: newXp, grade: newGrade }).eq("id", user.id);

  return NextResponse.json({ ok: true, xp_awarded: XP_PROFIL_COMPLET });
}

function computeGrade(xp: number): string {
  if (xp >= 5000) return "ambassadeur";
  if (xp >= 3000) return "pionnier";
  if (xp >= 1500) return "confirme";
  if (xp >= 500) return "membre";
  return "recrue";
}
