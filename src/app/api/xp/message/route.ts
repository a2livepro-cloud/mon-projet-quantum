import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const XP_PER_MESSAGE = 5;
const DAILY_CAP = 20;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayLogs } = await supabase
    .from("xp_logs")
    .select("points")
    .eq("user_id", user.id)
    .eq("action", "message_tchat")
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`);

  const todayTotal = (todayLogs ?? []).reduce((s, l) => s + l.points, 0);
  if (todayTotal >= DAILY_CAP) {
    return NextResponse.json({ ok: true, xp_awarded: 0, message: "Plafond quotidien atteint" });
  }

  const toAdd = Math.min(XP_PER_MESSAGE, DAILY_CAP - todayTotal);
  if (toAdd <= 0) return NextResponse.json({ ok: true, xp_awarded: 0 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const table = profile?.role === "candidat" ? "candidats" : "clients";
  const { data: row } = await supabase
    .from(table)
    .select("xp, grade")
    .eq("id", user.id)
    .single();

  await supabase.from("xp_logs").insert({
    user_id: user.id,
    action: "message_tchat",
    points: toAdd,
  });
  const newXp = (row?.xp ?? 0) + toAdd;
  const newGrade = computeGrade(newXp);
  await supabase.from(table).update({ xp: newXp, grade: newGrade }).eq("id", user.id);

  return NextResponse.json({ ok: true, xp_awarded: toAdd });
}

function computeGrade(xp: number): string {
  if (xp >= 5000) return "ambassadeur";
  if (xp >= 3000) return "pionnier";
  if (xp >= 1500) return "confirme";
  if (xp >= 500) return "membre";
  return "recrue";
}
