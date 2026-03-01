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
  const { clientId, secteursValides, xp, grade } = body as {
    clientId: string;
    secteursValides?: string[];
    xp?: number;
    grade?: string;
  };

  if (!clientId)
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });

  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (secteursValides !== undefined) updateData.secteurs_valides = secteursValides;
  if (xp !== undefined) updateData.xp = xp;
  if (grade !== undefined) updateData.grade = grade;

  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  const { error } = await admin
    .from("clients")
    .update(updateData)
    .eq("id", clientId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (xp !== undefined) {
    await admin.from("xp_logs").insert({
      user_id: clientId,
      action: "admin_ajustement",
      points: xp,
    });
  }

  return NextResponse.json({ ok: true });
}
