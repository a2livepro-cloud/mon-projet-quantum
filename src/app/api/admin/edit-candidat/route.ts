import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin")
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { candidatId, secteursValides, xp, grade } = body as {
    candidatId: string;
    secteursValides?: string[];
    xp?: number;
    grade?: string;
  };

  if (!candidatId)
    return NextResponse.json({ error: "candidatId requis" }, { status: 400 });

  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (secteursValides !== undefined) updateData.secteurs_valides = secteursValides;
  if (xp !== undefined) updateData.xp = xp;
  if (grade !== undefined) updateData.grade = grade;

  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  const { error } = await admin
    .from("candidats")
    .update(updateData)
    .eq("id", candidatId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Log l'ajustement XP si modifié
  if (xp !== undefined) {
    await admin.from("xp_logs").insert({
      user_id: candidatId,
      action: "admin_ajustement",
      points: xp,
    });
  }

  return NextResponse.json({ ok: true });
}
